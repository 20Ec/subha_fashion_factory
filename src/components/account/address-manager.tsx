"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  deleteAddressAction,
  setDefaultAddressAction,
} from "@/lib/actions/address";
import { AddressForm } from "@/components/account/address-form";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Address } from "@/lib/types";

export function AddressManager({ addresses }: { addresses: Address[] }) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [deleting, setDeleting] = useState<Address | null>(null);
  const [pending, setPending] = useState(false);

  const atLimit = addresses.length >= 5;

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  async function confirmDelete() {
    if (!deleting) return;
    setPending(true);
    const result = await deleteAddressAction(deleting.id);
    setPending(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Address deleted");
    setDeleting(null);
    router.refresh();
  }

  async function makeDefault(address: Address) {
    const result = await setDefaultAddressAction(address.id);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Default address updated");
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Delivery addresses</h2>
          <p className="mt-0.5 text-xs text-ink">
            {addresses.length} of 5 saved
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          disabled={atLimit}
        >
          <Plus className="h-4 w-4" />
          Add address
        </Button>
      </div>

      {atLimit && (
        <p className="mt-3 rounded-xl bg-blush px-3.5 py-2.5 text-xs text-ink">
          You&apos;ve reached the maximum of 5 addresses. Delete one to add
          another.
        </p>
      )}

      {addresses.length === 0 ? (
        <EmptyState
          className="mt-4"
          title="No saved addresses yet"
          description="Add a delivery address to make checkout faster."
        >
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Add your first address
          </Button>
        </EmptyState>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="rounded-2xl border border-line bg-white p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-blush text-blue">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">{address.full_name}</p>
                    <p className="text-[11px] text-ink">{address.phone}</p>
                  </div>
                </div>
                {address.is_default && (
                  <StatusBadge status="delivered" label="Default" />
                )}
              </div>

              <p className="mt-3 text-xs leading-relaxed text-ink">
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ""}
                <br />
                {address.city}, {address.state} — {address.pincode}
                {address.landmark ? (
                  <>
                    <br />
                    Landmark: {address.landmark}
                  </>
                ) : null}
              </p>

              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditing(address);
                    setFormOpen(true);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
                {!address.is_default && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => makeDefault(address)}
                  >
                    <Star className="h-3.5 w-3.5" />
                    Set default
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-rose-600 hover:bg-rose-50"
                  onClick={() => setDeleting(address)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editing ? "Edit address" : "Add delivery address"}
        description={
          editing
            ? "Update the details for this delivery address."
            : "Save an address to use at checkout."
        }
      >
        <AddressForm
          address={editing ?? undefined}
          onDone={() => {
            closeForm();
            router.refresh();
          }}
          onCancel={closeForm}
        />
      </Modal>

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete address?"
        description="This address will be removed from your account."
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              Keep address
            </Button>
            <Button
              variant="danger"
              loading={pending}
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </div>
        }
      >
        {deleting && (
          <p className="text-sm leading-relaxed text-navy/70">
            {deleting.full_name}
            <br />
            {deleting.line1}
            {deleting.line2 ? `, ${deleting.line2}` : ""}
            <br />
            {deleting.city}, {deleting.state} — {deleting.pincode}
          </p>
        )}
      </Modal>
    </div>
  );
}
