"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { billSchema } from "@/lib/validators";
import { buildBillPdf, type BillPdfItem } from "@/lib/bill-pdf";
import { billLineTotal, roundMoney } from "@/lib/bill-calc";
import { storagePathForBill } from "@/lib/bills-server";
import type { ActionResult, Bill } from "@/lib/types";

export type CreateBillInput = {
  customer_name: string;
  bill_date: string;
  shipping: number;
  items: {
    product_name: string;
    inch: string;
    pieces: string;
    size: string;
    nos: number;
    price: number;
  }[];
};

export type CreateBillResult = ActionResult & {
  id?: string;
  billNumber?: string;
};

export async function createBillAction(
  input: CreateBillInput
): Promise<CreateBillResult> {
  await requireAdmin();

  const parsed = billSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please check the bill details",
    };
  }

  const supabase = await createClient();

  // Normalise to paise so the RPC, line totals and PDF all use exactly the
  // same numbers.
  const items = parsed.data.items.map((item) => ({
    product_name: item.product_name,
    inch: item.inch ?? "",
    pieces: item.pieces ?? "",
    size: item.size ?? "",
    nos: roundMoney(item.nos),
    price: roundMoney(item.price),
  }));

  // The RPC writes the header and every item in one transaction and owns the
  // bill number sequence, so two admins can never collide.
  const { data, error } = await supabase.rpc("create_bill", {
    p_customer_name: parsed.data.customer_name,
    p_bill_date: parsed.data.bill_date,
    p_shipping: roundMoney(parsed.data.shipping),
    p_items: items,
  });

  if (error) {
    // PGRST202/PGRST205 mean the bill tables and function are missing, which
    // is a setup problem rather than a bill problem.
    if (error.code === "PGRST202" || error.code === "PGRST205") {
      return {
        error:
          "The bill tables are not set up yet. Run `npm run db:bills` (or paste supabase/bills.sql into the Supabase SQL Editor), then try again.",
      };
    }

    return { error: error.message };
  }

  const bill = data as Bill;

  try {
    const pdfItems: BillPdfItem[] = items.map((item) => ({
      ...item,
      total: billLineTotal(item.nos, item.price),
    }));

    const bytes = await buildBillPdf(bill, pdfItems);
    const path = storagePathForBill(bill.bill_number);

    const { error: uploadError } = await supabase.storage
      .from("bills")
      .upload(path, Buffer.from(bytes), {
        contentType: "application/pdf",
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Could not upload the bill PDF: ${uploadError.message}`);
    }

    const { error: attachError } = await supabase.rpc("attach_bill_pdf", {
      p_bill_id: bill.id,
      p_path: path,
    });

    if (attachError) {
      await supabase.storage.from("bills").remove([path]);
      throw new Error(
        `Could not save the bill PDF path: ${attachError.message}`
      );
    }
  } catch (error) {
    // Keep the bill tables free of records whose PDF failed to save.
    await supabase.from("bills").delete().eq("id", bill.id);

    return {
      error:
        error instanceof Error
          ? error.message
          : "The bill PDF could not be generated. Please try again.",
    };
  }

  revalidatePath("/admin/bills");
  revalidatePath("/admin");

  return {
    success: `Bill ${bill.bill_number} created`,
    id: bill.id,
    billNumber: bill.bill_number,
  };
}
