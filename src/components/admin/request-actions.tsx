"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CheckCheck, X } from "lucide-react";
import { toast } from "sonner";
import { resolveRequestAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RequestStatus } from "@/lib/types";

export function RequestActions({
  requestId,
  status,
}: {
  requestId: string;
  status: RequestStatus;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"approved" | "rejected" | "completed" | null>(
    null
  );

  async function resolve(next: "approved" | "rejected" | "completed") {
    setError(null);

    if (next === "rejected" && !note.trim()) {
      setError("Please write a reason for rejecting this request.");
      return;
    }

    setPending(next);
    const result = await resolveRequestAction(requestId, next, note);
    setPending(null);

    if (result.error) {
      setError(result.error);
      toast.error(result.error);
      return;
    }

    toast.success(result.success ?? "Request updated");
    router.refresh();
  }

  if (status === "rejected" || status === "completed") {
    return null;
  }

  return (
    <div className="mt-3 space-y-2 border-t border-line pt-3">
      <Input
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Message to the customer — required when rejecting"
        maxLength={500}
        className="h-9 text-xs"
      />
      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-700">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {status === "pending" ? (
          <>
            <Button
              size="sm"
              loading={pending === "approved"}
              disabled={Boolean(pending) && pending !== "approved"}
              onClick={() => resolve("approved")}
            >
              <Check className="h-3.5 w-3.5" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              loading={pending === "rejected"}
              disabled={Boolean(pending) && pending !== "rejected"}
              onClick={() => resolve("rejected")}
              className="text-rose-600"
            >
              <X className="h-3.5 w-3.5" />
              Reject
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            loading={pending === "completed"}
            onClick={() => resolve("completed")}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark completed
          </Button>
        )}
      </div>
    </div>
  );
}
