import { Toaster } from "sonner";
import { CartProvider } from "@/components/cart/cart-context";
import type { SessionUser } from "@/lib/types";

export function Providers({
  user,
  children,
}: {
  user: SessionUser | null;
  children: React.ReactNode;
}) {
  return (
    <CartProvider user={user}>
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            borderRadius: "16px",
            fontFamily: "var(--font-poppins)",
          },
        }}
      />
    </CartProvider>
  );
}
