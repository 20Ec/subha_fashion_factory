export type Role = "customer" | "admin";
export type PricingType = "inch" | "pieces" | "size";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled";
export type PaymentStatus = "pending" | "paid" | "refunded";
export type RequestType = "return" | "replace" | "cancel";
export type RequestStatus = "pending" | "approved" | "rejected" | "completed";

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
};

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: Role;
  created_at: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string | null;
  image_public_id?: string | null;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
};

export type ProductImage = {
  id: string;
  product_id: string;
  image_url: string;
  public_id: string | null;
  sort_order: number;
};

export type ProductOption = {
  id: string;
  product_id: string;
  pricing_type: PricingType;
  label: string;
  price: number;
  sort_order: number;
  is_active: boolean;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category_id: string | null;
  cover_image: string | null;
  min_price: number;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at?: string;
  category?: Pick<Category, "id" | "name" | "slug"> | null;
  images: ProductImage[];
  options: ProductOption[];
};

export type Address = {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string;
  is_default: boolean;
  created_at: string;
};

export type CartLine = {
  id: string;
  optionId: string;
  productId: string;
  name: string;
  slug: string;
  image: string | null;
  pricingType: PricingType;
  label: string;
  price: number;
  quantity: number;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_slug: string | null;
  image_url: string | null;
  pricing_type: PricingType | null;
  option_label: string;
  unit_price: number;
  quantity: number;
  line_total: number;
};

export type OrderStatusHistory = {
  id: string;
  order_id: string;
  status: OrderStatus;
  note: string | null;
  created_at: string;
};

export type OrderRequest = {
  id: string;
  order_id: string;
  order_item_id: string | null;
  user_id: string | null;
  type: RequestType;
  reason: string;
  description: string;
  status: RequestStatus;
  admin_note: string | null;
  created_at: string;
  resolved_at: string | null;
};

export type Order = {
  id: string;
  order_number: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  address_snapshot: Record<string, string | boolean>;
  subtotal: number;
  total: number;
  confirmed_total: number | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  customer_note: string | null;
  admin_note: string | null;
  cancellation_reason: string | null;
  courier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  placed_at: string;
  delivered_at: string | null;
  updated_at: string;
  order_items: OrderItem[];
  history?: OrderStatusHistory[];
  order_status_history?: OrderStatusHistory[];
  order_requests?: OrderRequest[];
};

export type ActionResult = {
  error?: string;
  success?: string;
};
