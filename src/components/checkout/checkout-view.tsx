"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, MapPin, Phone, Plus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { formatINR } from "@/lib/utils";
import { useCart } from "@/components/cart/cart-context";
import { placeOrderAction } from "@/lib/actions/order";
import { AddressForm } from "@/components/account/address-form";
import { Button, buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/input";
import { FlowerMark } from "@/components/ui/logo";
import type { Address } from "@/lib/types";

export function CheckoutView({ addresses }: { addresses: Address[] }) {
  const router = useRouter();
  const { lines, loading, subtotal, clearLocal } = useCart();
  const [selectedId, setSelectedId] = useState<string | null>(
    addresses.find((address) => address.is_default)?.id ??
      addresses[0]?.id ??
      null
  );
  const [note, setNote] = useState("");
  const [addressModal, setAddressModal] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedAddress = addresses.find((address) => address.id === selectedId);
  const atLimit = addresses.length >= 5;

  async function placeOrder() {
    setError(null);

    if (!selectedAddress) {
      setError("Please add or choose a delivery address.");
      return;
    }

    if (lines.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setPending(true);
    const result = await placeOrderAction(selectedAddress.id, note);
    setPending(false);

    if (result.error || !result.orderId) {
      setError(result.error ?? "Could not place your order.");
      return;
    }

    toast.success("Order placed! Our team will call you soon.");
    clearLocal();
    router.push(`/orders/${result.orderId}?placed=1`);
    router.refresh();
  }

  if (loading) {
    return (
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          <div className="h-48 animate-pulse rounded-2xl border border-navy/5 bg-white" />
          <div className="h-32 animate-pulse rounded-2xl border border-navy/5 bg-white" />
        </div>
        <div className="h-72 animate-pulse rounded-2xl border border-navy/5 bg-white" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <EmptyState
        className="mt-8"
        title="There's nothing to check out"
        description="Add something beautiful to your cart first."
      >
        <Link href="/shop" className={buttonClass()}>
          Browse flowers
        </Link>
      </EmptyState>
    );
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
      <div className="space-y-5">
        <section className="rounded-2xl border border-navy/5 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Delivery address</h2>
              <p className="mt-0.5 text-xs text-navy/45">
                Choose where your flowers should arrive.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddressModal(true)}
              disabled={atLimit}
            >
              <Plus className="h-4 w-4" />
              Add new
            </Button>
          </div>

          {atLimit && (
            <p className="mt-3 rounded-xl bg-blush px-3.5 py-2.5 text-[11px] text-navy/50">
              You have 5 saved addresses. Manage them from{" "}
              <Link href="/account" className="font-medium text-blue">
                My account
              </Link>
              .
            </p>
          )}

          {addresses.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-navy/15 p-6 text-center">
              <MapPin className="mx-auto h-6 w-6 text-pink" />
              <p className="mt-2 text-sm font-medium">No address saved yet</p>
              <p className="mt-1 text-xs text-navy/45">
                Add an address to continue.
              </p>
              <Button
                size="sm"
                className="mt-3"
                onClick={() => setAddressModal(true)}
              >
                Add address
              </Button>
            </div>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {addresses.map((address) => {
                const active = address.id === selectedId;
                return (
                  <label
                    key={address.id}
                    className={`cursor-pointer rounded-2xl border p-4 transition ${
                      active
                        ? "border-blue bg-blue/5 ring-1 ring-blue"
                        : "border-navy/10 bg-white hover:border-navy/25"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <input
                        type="radio"
                        name="address"
                        checked={active}
                        onChange={() => setSelectedId(address.id)}
                        className="mt-1 h-4 w-4 border-navy/20 text-blue focus:ring-blue/20"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium">
                            {address.full_name}
                          </p>
                          {address.is_default && (
                            <StatusBadge status="delivered" label="Default" />
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] text-navy/45">
                          {address.phone}
                        </p>
                        <p className="mt-2 text-xs leading-relaxed text-navy/55">
                          {address.line1}
                          {address.line2 ? `, ${address.line2}` : ""}
                          <br />
                          {address.city}, {address.state} — {address.pincode}
                        </p>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-navy/5 bg-white p-5 shadow-card">
          <h2 className="text-base font-semibold">Order note</h2>
          <p className="mt-0.5 text-xs text-navy/45">
            Colours, occasion, delivery instructions — anything we should know.
          </p>
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={1000}
            placeholder="Optional note for our team"
            className="mt-3"
          />
        </section>

        <div className="flex items-start gap-3 rounded-2xl bg-pink-soft/60 p-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-blue">
            <Phone className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-medium">No online payment</p>
            <p className="mt-0.5 text-xs leading-relaxed text-navy/55">
              Our team will call you to confirm your order and final pricing,
              and arrange payment separately.
            </p>
          </div>
        </div>
      </div>

      <aside className="rounded-2xl border border-navy/5 bg-white p-5 shadow-card lg:sticky lg:top-28">
        <h2 className="text-base font-semibold">Your order</h2>

        <div className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
          {lines.map((line) => (
            <div key={line.id} className="flex items-center gap-3">
              <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-lg bg-blush">
                {line.image ? (
                  <Image
                    src={line.image}
                    alt={line.name}
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                ) : (
                  <span className="grid h-full place-items-center text-pink">
                    <FlowerMark className="h-4 w-4" />
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{line.name}</p>
                <p className="truncate text-[10px] text-navy/45">
                  {line.label} × {line.quantity}
                </p>
              </div>
              <p className="text-xs font-medium">
                {formatINR(line.price * line.quantity)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-navy/5 pt-4">
          <span className="text-sm font-medium">Total</span>
          <span className="text-xl font-semibold">{formatINR(subtotal)}</span>
        </div>
        <p className="mt-1 text-right text-[10px] text-navy/40">
          Delivery confirmed on call
        </p>

        {error && (
          <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-700">
            {error}
          </p>
        )}

        <Button
          size="lg"
          className="mt-4 w-full"
          loading={pending}
          onClick={placeOrder}
        >
          Place order
        </Button>

        <Link
          href="/cart"
          className="mt-3 flex items-center justify-center gap-1 text-xs font-medium text-navy/45 hover:text-navy"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to cart
        </Link>

        <div className="mt-4 flex items-center justify-center gap-1.5 border-t border-navy/5 pt-4 text-[10px] text-navy/35">
          <ShieldCheck className="h-3.5 w-3.5" />
          Your details are stored securely
        </div>
      </aside>

      <Modal
        open={addressModal}
        onClose={() => setAddressModal(false)}
        title="Add delivery address"
        description="Save an address for this and future orders."
      >
        <AddressForm
          onDone={(id) => {
            setAddressModal(false);
            if (id) setSelectedId(id);
            router.refresh();
          }}
          onCancel={() => setAddressModal(false)}
        />
      </Modal>
    </div>
  );
}
