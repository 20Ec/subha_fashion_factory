import { createClient } from "@/lib/supabase/server";
import { buildBillPdf, type BillPdfItem } from "@/lib/bill-pdf";
import type { Bill, BillItem } from "@/lib/types";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type BillWithItems = {
  bill: Bill;
  items: BillItem[];
};

export function storagePathForBill(billNumber: string) {
  return `${billNumber}.pdf`;
}

export async function loadBillWithItems(
  supabase: Supabase,
  billId: string
): Promise<BillWithItems | null> {
  const { data, error } = await supabase
    .from("bills")
    .select("*, bill_items(*)")
    .eq("id", billId)
    .maybeSingle();

  if (error || !data) return null;

  const { bill_items, ...bill } = data as Bill & { bill_items: BillItem[] };
  const items = [...(bill_items ?? [])].sort(
    (a, b) => a.position - b.position
  );

  return { bill, items };
}

function toPdfItems(items: BillItem[]): BillPdfItem[] {
  return items.map((item) => ({
    product_name: item.product_name,
    inch: item.inch ?? "",
    pieces: item.pieces ?? "",
    size: item.size ?? "",
    nos: Number(item.nos ?? 0),
    price: Number(item.price ?? 0),
    total: Number(item.total ?? 0),
  }));
}

/**
 * Ensures a bill has a stored PDF. If `pdf_path` is already set the existing
 * object is reused — no duplicate file or record is created.
 *
 * `force` is only used when the database path exists but the storage object
 * has gone missing.
 */
export async function ensureBillPdf(
  supabase: Supabase,
  bill: Bill,
  items: BillItem[],
  options: { force?: boolean } = {}
): Promise<{ path: string; generated: boolean }> {
  if (bill.pdf_path && !options.force) {
    return { path: bill.pdf_path, generated: false };
  }

  const path = storagePathForBill(bill.bill_number);
  const bytes = await buildBillPdf(bill, toPdfItems(items));

  const { error: uploadError } = await supabase.storage
    .from("bills")
    .upload(path, Buffer.from(bytes), {
      contentType: "application/pdf",
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Could not upload the bill PDF: ${uploadError.message}`);
  }

  const { error: attachError } = await supabase.rpc("attach_bill_pdf", {
    p_bill_id: bill.id,
    p_path: path,
  });

  if (attachError) {
    throw new Error(`Could not save the bill PDF path: ${attachError.message}`);
  }

  return { path, generated: true };
}
