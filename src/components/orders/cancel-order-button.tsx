"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";
import { toast } from "sonner";
import { cancelOrderAction } from "@/lib/actions/order";
import { CANCEL_REASONS } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);

  async function cancel() {
    if (!reason.trim()) {
      toast.error("Please select a reason for cancelling");
      return;
    }

    setPending(true);
    const result = await cancelOrderAction(orderId, reason);
    setPending(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Order cancelled");
    setOpen(false);
    router.refresh();
  }

  function close() {
    if (pending) return;
    setOpen(false);
    setReason("");
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <XCircle className="h-4 w-4" />
        Cancel order
      </Button>

      <Modal
        open={open}
        onClose={close}
        title="Cancel this order?"
        description="Since the order is still pending, it will be cancelled immediately."
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={close} disabled={pending}>
              Keep order
            </Button>
            <Button
              variant="danger"
              loading={pending}
              onClick={cancel}
              disabled={!reason.trim()}
            >
              Yes, cancel it
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <Label htmlFor="cancel-reason">
              Reason for cancelling <span className="text-rose-500">*</span>
            </Label>
            <Select
              id="cancel-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              required
            >
              <option value="">Select a reason</option>
              {CANCEL_REASONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </div>
          <p className="text-sm leading-relaxed text-navy/70">
            You can always place a new order later. If you just need to change
            something, our team will be happy to help.
          </p>
        </div>
      </Modal>
    </>
  );
}
