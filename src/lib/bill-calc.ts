/**
 * Pure helpers shared by the bill form, server actions and the PDF renderer.
 * Keep this module free of server-only imports so it can run in the browser.
 */

export type BillItemInput = {
  product_name: string;
  inch: string;
  pieces: string;
  size: string;
  nos: number;
  price: number;
};

/** Rounds to paise so the UI and the database agree on every total. */
export function roundMoney(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function billLineTotal(nos: number | string, price: number | string) {
  const quantity = Number(nos);
  const rate = Number(price);
  if (!Number.isFinite(quantity) || !Number.isFinite(rate)) return 0;
  return roundMoney(quantity * rate);
}

export function billTotals(
  items: Pick<BillItemInput, "nos" | "price">[],
  shipping: number | string
) {
  const subtotal = roundMoney(
    items.reduce((sum, item) => sum + billLineTotal(item.nos, item.price), 0)
  );
  const shippingValue = Number(shipping);
  const shippingAmount = Number.isFinite(shippingValue)
    ? roundMoney(Math.max(0, shippingValue))
    : 0;

  return {
    subtotal,
    shipping: shippingAmount,
    total: roundMoney(subtotal + shippingAmount),
  };
}

/** `SFF-2026-0001-Asha-Ravi.pdf` — the same name the admin downloads. */
export function billPdfFilename(
  billNumber: string | null | undefined,
  customerName: string | null | undefined
) {
  const safeBill = (billNumber || "bill").replace(/[^A-Za-z0-9-_]+/g, "-");
  const safeCustomer = (customerName || "customer")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${safeBill}-${safeCustomer || "customer"}.pdf`;
}

/* --------------------------- Amount in words --------------------------- */

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function underThousand(value: number): string {
  const parts: string[] = [];
  const hundreds = Math.floor(value / 100);
  const remainder = value % 100;

  if (hundreds > 0) parts.push(`${ONES[hundreds]} Hundred`);

  if (remainder > 0) {
    if (remainder < 20) {
      parts.push(ONES[remainder]);
    } else {
      const tens = Math.floor(remainder / 10);
      const ones = remainder % 10;
      parts.push(ones > 0 ? `${TENS[tens]} ${ONES[ones]}` : TENS[tens]);
    }
  }

  return parts.join(" ");
}

export function amountInIndianWords(amount: number) {
  const rounded = roundMoney(Math.abs(Number(amount) || 0));
  const rupees = Math.floor(rounded);
  const paise = Math.round((rounded - rupees) * 100);

  if (rupees === 0 && paise === 0) return "Zero Rupees Only";

  const groups: { value: number; label: string }[] = [
    { value: Math.floor(rupees / 10000000), label: "Crore" },
    { value: Math.floor((rupees % 10000000) / 100000), label: "Lakh" },
    { value: Math.floor((rupees % 100000) / 1000), label: "Thousand" },
    { value: rupees % 1000, label: "" },
  ];

  const words: string[] = [];
  for (const group of groups) {
    if (group.value <= 0) continue;
    const label = group.value > 999 ? String(group.value) : underThousand(group.value);
    words.push(group.label ? `${label} ${group.label}` : label);
  }

  const rupeeWords = `${words.join(" ")} Rupees`;

  if (paise === 0) return `${rupeeWords} Only`;
  return `${rupeeWords} and ${underThousand(paise)} Paise Only`;
}

/** `₹1,23,456.00` — the rupee symbol is supported by the embedded PDF font. */
export function formatBillPDFAmount(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return `₹${new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeAmount)}`;
}

/** Date shown in the PDF, e.g. `13 Nov 2026`. */
export function formatBillPDFDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
