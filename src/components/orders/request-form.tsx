"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { submitOrderRequestAction } from "@/lib/actions/order";
import { CANCEL_REASONS, REQUEST_REASONS } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Label, Select, Textarea } from "@/components/ui/input";
import type { OrderItem, RequestType } from "@/lib/types";

export function RequestForm({
  orderId,
  type,
  items,
}: {
  orderId: string;
  type: RequestType;
  items: OrderItem[];
}) {
  const router = useRouter();
  const reasons = type === "cancel" ? CANCEL_REASONS : REQUEST_REASONS;
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [itemId, setItemId] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!reason.trim()) {
      setError("Please select a reason.");
      return;
    }

    setPending(true);

    const result = await submitOrderRequestAction(
      orderId,
      type,
      reason,
      description,
      itemId || null
    );

    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    toast.success(result.success ?? "Request submitted");
    router.push(`/orders/${orderId}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
          {error}
        </div>
      )}

      {type !== "cancel" && items.length > 0 && (
        <div>
          <Label htmlFor="request-item">Which item?</Label>
          <Select
            id="request-item"
            value={itemId}
            onChange={(event) => setItemId(event.target.value)}
          >
            <option value="">The whole order</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.product_name} — {item.option_label}
              </option>
            ))}
          </Select>
        </div>
      )}

      <div>
        <Label htmlFor="request-reason">
          Reason <span className="text-rose-500">*</span>
        </Label>
        <Select
          id="request-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          required
        >
          <option value="">Select a reason</option>
          {reasons.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="request-description">
          Tell us a little more (optional)
        </Label>
        <Textarea
          id="request-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={1000}
          placeholder="Share any details that will help our team"
        />
      </div>

      <Button
        type="submit"
        size="lg"
        loading={pending}
        disabled={!reason.trim()}
        className="w-full"
      >
        {type === "cancel"
          ? "Submit cancellation request"
          : type === "return"
            ? "Submit return request"
            : "Submit replacement request"}
      </Button>
    </form>
  );
}
