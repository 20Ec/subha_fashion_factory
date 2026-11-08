const WHATSAPP_NUMBER = "919159234778";
const WHATSAPP_MESSAGE =
  "Hi Subha Fashion Factory! I'm interested in your products. Please share more details.";

export const SITE = {
  name: "Subha Fashion Factory",
  shortName: "Subha",
  tagline: "Handmade & artificial flowers, crafted to last forever.",
  instagram:
    process.env.NEXT_PUBLIC_INSTAGRAM_URL ??
    "https://www.instagram.com/subha_fashion_factory?psln=YXZwc2xqbWtkdzUy",
  youtube:
    process.env.NEXT_PUBLIC_YOUTUBE_URL ??
    "https://www.youtube.com/@subha_fashion_factory",
  whatsapp: {
    number: WHATSAPP_NUMBER,
    display: "+91 91592 34778",
    message: WHATSAPP_MESSAGE,
    url: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`,
  },
};

export const RETURN_WINDOW_DAYS = 7;

export const PRICING_TYPES = [
  { value: "inch", label: "Inch", helper: "Sized by length in inches" },
  { value: "pieces", label: "Pieces", helper: "Sold by number of pieces" },
  { value: "size", label: "Size", helper: "Small, medium, large and more" },
] as const;

export const PRICING_TYPE_LABEL: Record<string, string> = {
  inch: "Inch",
  pieces: "Pieces",
  size: "Size",
};

export const ORDER_STATUS_FLOW: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

// Payment can only move forward: pending → paid → refunded.
// A cancelled order is read-only unless it is still marked paid, in which
// case the only remaining action is paid → refunded.
export const PAYMENT_STATUS_FLOW: Record<string, string[]> = {
  pending: ["paid"],
  paid: ["refunded"],
  refunded: [],
};

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export const PAYMENT_STATUSES = ["pending", "paid", "refunded"] as const;

export const REQUEST_REASONS = [
  "Damaged on arrival",
  "Wrong item received",
  "Not as described",
  "Changed my mind",
  "Other",
];

export const CANCEL_REASONS = [
  "Changed my mind",
  "Ordered by mistake",
  "Delivery timeline is too long",
  "Other",
];
