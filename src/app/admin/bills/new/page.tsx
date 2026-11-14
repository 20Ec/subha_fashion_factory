import type { Metadata } from "next";
import { BillForm } from "@/components/admin/bill-form";

export const metadata: Metadata = { title: "New bill" };

export default function NewBillPage() {
  // Bill dates are recorded in the shop's timezone (IST), not the server's.
  const defaultDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  return <BillForm defaultDate={defaultDate} />;
}
