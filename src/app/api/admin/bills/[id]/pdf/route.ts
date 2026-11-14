import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ensureBillPdf, loadBillWithItems } from "@/lib/bills-server";
import { billPdfFilename } from "@/lib/bill-calc";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();

  if (!user || user.role !== "admin") {
    return new Response("Not found", { status: 404 });
  }

  const { id } = await params;

  if (!UUID_PATTERN.test(id)) {
    return new Response("Not found", { status: 404 });
  }

  const supabase = await createClient();
  const billData = await loadBillWithItems(supabase, id);

  if (!billData) {
    return new Response("Bill not found", { status: 404 });
  }

  const { bill, items } = billData;

  try {
    let path = bill.pdf_path;

    if (!path) {
      path = (await ensureBillPdf(supabase, bill, items)).path;
    }

    let download = await supabase.storage.from("bills").download(path);

    // The database row can outlive a manually deleted storage object. Rebuild
    // the same path (never a second file) and try once more.
    if (download.error || !download.data) {
      path = (
        await ensureBillPdf(
          supabase,
          { ...bill, pdf_path: null },
          items,
          { force: true }
        )
      ).path;
      download = await supabase.storage.from("bills").download(path);
    }

    if (download.error || !download.data) {
      return new Response("The bill PDF could not be loaded.", { status: 500 });
    }

    const filename = billPdfFilename(bill.bill_number, bill.customer_name);
    const inline = new URL(request.url).searchParams.get("view") === "1";

    return new Response(download.data, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Content-Length": String(download.data.size),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Bill PDF download failed", error);
    return new Response("The bill PDF could not be generated.", { status: 500 });
  }
}
