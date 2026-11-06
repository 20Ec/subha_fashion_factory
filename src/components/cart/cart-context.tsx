"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  addToCartAction,
  getCartLines,
  mergeGuestCartAction,
  removeCartItemAction,
  updateCartQuantityAction,
} from "@/lib/actions/cart";
import type { CartLine, SessionUser } from "@/lib/types";

const GUEST_KEY = "sff_guest_cart_v1";

type NewCartLine = Omit<CartLine, "id" | "quantity">;
type Result = { error?: string; success?: string };

type CartContextValue = {
  user: SessionUser | null;
  lines: CartLine[];
  loading: boolean;
  busy: boolean;
  count: number;
  subtotal: number;
  addLine: (line: NewCartLine, quantity?: number) => Promise<Result>;
  updateQuantity: (lineId: string, quantity: number) => Promise<Result>;
  removeLine: (lineId: string) => Promise<Result>;
  clearLocal: () => void;
  mergeAfterLogin: () => Promise<void>;
  refresh: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

function readGuestCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(GUEST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (line) =>
          line &&
          typeof line.optionId === "string" &&
          typeof line.price === "number" &&
          typeof line.quantity === "number"
      )
      .map((line) => ({
        id: `guest-${line.optionId}`,
        optionId: line.optionId,
        productId: String(line.productId ?? ""),
        name: String(line.name ?? ""),
        slug: String(line.slug ?? ""),
        image: line.image ?? null,
        pricingType: line.pricingType,
        label: String(line.label ?? ""),
        price: Number(line.price),
        quantity: Math.max(1, Math.min(99, Number(line.quantity))),
      }));
  } catch {
    return [];
  }
}

function writeGuestCart(lines: CartLine[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GUEST_KEY, JSON.stringify(lines));
}

export function CartProvider({
  user,
  children,
}: {
  user: SessionUser | null;
  children: React.ReactNode;
}) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const userId = user?.id ?? null;

  const refresh = useCallback(async () => {
    if (!userId) {
      setLines(readGuestCart());
      return;
    }
    const serverLines = await getCartLines();
    setLines(serverLines);
  }, [userId]);

  useEffect(() => {
    let active = true;
    setLoading(true);

    async function boot() {
      try {
        if (user) {
          const guest = readGuestCart();
          if (guest.length > 0) {
            window.localStorage.removeItem(GUEST_KEY);
            await mergeGuestCartAction(
              guest.map((line) => ({
                optionId: line.optionId,
                quantity: line.quantity,
              }))
            );
          }
          const serverLines = await getCartLines();
          if (active) setLines(serverLines);
        } else {
          if (active) setLines(readGuestCart());
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    boot();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const addLine = useCallback(
    async (line: NewCartLine, quantity = 1): Promise<Result> => {
      const qty = Math.max(1, Math.min(99, quantity));

      if (!user) {
        let result: Result = { success: "Added to cart" };
        setLines((previous) => {
          const existing = previous.find(
            (item) => item.optionId === line.optionId
          );
          const next = existing
            ? previous.map((item) =>
                item.optionId === line.optionId
                  ? {
                      ...item,
                      quantity: Math.min(99, item.quantity + qty),
                    }
                  : item
              )
            : [
                ...previous,
                {
                  ...line,
                  id: `guest-${line.optionId}`,
                  quantity: qty,
                },
              ];
          writeGuestCart(next);
          return next;
        });
        return result;
      }

      setBusy(true);
      const result = await addToCartAction(line.optionId, qty);
      if (!result.error) {
        const serverLines = await getCartLines();
        setLines(serverLines);
      }
      setBusy(false);
      return result;
    },
    [user]
  );

  const updateQuantity = useCallback(
    async (lineId: string, quantity: number): Promise<Result> => {
      const qty = Math.max(1, Math.min(99, quantity));

      if (!user) {
        setLines((previous) => {
          const next = previous.map((item) =>
            item.id === lineId ? { ...item, quantity: qty } : item
          );
          writeGuestCart(next);
          return next;
        });
        return { success: "Cart updated" };
      }

      setBusy(true);
      setLines((previous) =>
        previous.map((item) =>
          item.id === lineId ? { ...item, quantity: qty } : item
        )
      );
      const result = await updateCartQuantityAction(lineId, qty);
      if (result.error) {
        const serverLines = await getCartLines();
        setLines(serverLines);
      }
      setBusy(false);
      return result;
    },
    [user]
  );

  const removeLine = useCallback(
    async (lineId: string): Promise<Result> => {
      if (!user) {
        setLines((previous) => {
          const next = previous.filter((item) => item.id !== lineId);
          writeGuestCart(next);
          return next;
        });
        return { success: "Item removed" };
      }

      setBusy(true);
      const result = await removeCartItemAction(lineId);
      if (result.error) {
        const serverLines = await getCartLines();
        setLines(serverLines);
      } else {
        setLines((previous) => previous.filter((item) => item.id !== lineId));
      }
      setBusy(false);
      return result;
    },
    [user]
  );

  const clearLocal = useCallback(() => {
    setLines([]);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(GUEST_KEY);
    }
  }, []);

  const mergeAfterLogin = useCallback(async () => {
    const guest = readGuestCart();
    if (guest.length === 0) return;
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(GUEST_KEY);
    }
    await mergeGuestCartAction(
      guest.map((line) => ({
        optionId: line.optionId,
        quantity: line.quantity,
      }))
    );
    const serverLines = await getCartLines();
    setLines(serverLines);
  }, []);

  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = lines.reduce(
    (sum, line) => sum + line.price * line.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        user,
        lines,
        loading,
        busy,
        count,
        subtotal,
        addLine,
        updateQuantity,
        removeLine,
        clearLocal,
        mergeAfterLogin,
        refresh,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
}
