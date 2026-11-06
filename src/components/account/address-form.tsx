"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createAddressAction, updateAddressAction } from "@/lib/actions/address";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { Address } from "@/lib/types";

type AddressFormValues = {
  full_name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string;
  is_default: boolean;
};

const empty: AddressFormValues = {
  full_name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  landmark: "",
  is_default: false,
};

export function AddressForm({
  address,
  onDone,
  onCancel,
}: {
  address?: Address;
  onDone?: (id?: string) => void;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState<AddressFormValues>(
    address
      ? {
          full_name: address.full_name,
          phone: address.phone,
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          landmark: address.landmark,
          is_default: address.is_default,
        }
      : empty
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function update<K extends keyof AddressFormValues>(
    key: K,
    value: AddressFormValues[K]
  ) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const result = address
      ? await updateAddressAction(address.id, values)
      : await createAddressAction(values);

    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    toast.success(result.success ?? "Address saved");
    if (!address) {
      setValues(empty);
    }
    const resultId =
      "id" in result && typeof result.id === "string" ? result.id : address?.id;
    onDone?.(resultId);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="addr-full-name">Full name</Label>
          <Input
            id="addr-full-name"
            value={values.full_name}
            onChange={(event) => update("full_name", event.target.value)}
            required
            placeholder="Recipient name"
          />
        </div>
        <div>
          <Label htmlFor="addr-phone">Phone number</Label>
          <Input
            id="addr-phone"
            value={values.phone}
            onChange={(event) => update("phone", event.target.value)}
            required
            inputMode="tel"
            placeholder="10-digit mobile number"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="addr-line1">Address line 1</Label>
        <Input
          id="addr-line1"
          value={values.line1}
          onChange={(event) => update("line1", event.target.value)}
          required
          placeholder="House no., street, area"
        />
      </div>

      <div>
        <Label htmlFor="addr-line2">Address line 2 (optional)</Label>
        <Input
          id="addr-line2"
          value={values.line2}
          onChange={(event) => update("line2", event.target.value)}
          placeholder="Apartment, building, floor"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="addr-city">City</Label>
          <Input
            id="addr-city"
            value={values.city}
            onChange={(event) => update("city", event.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="addr-state">State</Label>
          <Input
            id="addr-state"
            value={values.state}
            onChange={(event) => update("state", event.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="addr-pincode">Pincode</Label>
          <Input
            id="addr-pincode"
            value={values.pincode}
            onChange={(event) => update("pincode", event.target.value)}
            required
            inputMode="numeric"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="addr-landmark">Landmark (optional)</Label>
        <Input
          id="addr-landmark"
          value={values.landmark}
          onChange={(event) => update("landmark", event.target.value)}
          placeholder="Nearby landmark"
        />
      </div>

      <label className="flex items-center gap-2.5 text-sm text-navy/70">
        <input
          type="checkbox"
          checked={values.is_default}
          onChange={(event) => update("is_default", event.target.checked)}
          className="h-4 w-4 rounded border-navy/20 text-blue focus:ring-blue/20"
        />
        Make this my default delivery address
      </label>

      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={pending}>
          {address ? "Save changes" : "Save address"}
        </Button>
      </div>
    </form>
  );
}
