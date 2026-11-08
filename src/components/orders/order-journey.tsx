import { Check, XCircle } from "lucide-react";
import { buildOrderJourney } from "@/lib/orders";
import { cn, formatDate } from "@/lib/utils";
import type { Order } from "@/lib/types";

export function OrderJourney({ order }: { order: Order }) {
  const stages = buildOrderJourney(order);

  return (
    <div className="mt-4 space-y-0">
      {stages.map((stage, index) => {
        const done = stage.state === "done";
        const current = stage.state === "current";
        const cancelled = stage.state === "cancelled";
        const upcoming = stage.state === "upcoming";
        const isLast = index === stages.length - 1;

        return (
          <div key={stage.status} className="relative flex gap-3 pb-5 last:pb-0">
            {!isLast && (
              <span
                className={cn(
                  "absolute left-[8px] top-5 h-full w-px",
                  done ? "bg-emerald-300" : "bg-navy/10"
                )}
              />
            )}
            <span
              className={cn(
                "mt-0.5 grid h-[17px] w-[17px] shrink-0 place-items-center rounded-full",
                done && "bg-emerald-500 text-white",
                current && "bg-blue text-white ring-4 ring-blue/10",
                cancelled && "bg-rose-500 text-white",
                upcoming && "border border-line bg-white"
              )}
            >
              {done && <Check className="h-3 w-3" strokeWidth={3} />}
              {cancelled && <XCircle className="h-3 w-3" strokeWidth={2.5} />}
            </span>
            <div className="min-w-0">
              <p
                className={cn(
                  "text-xs font-medium",
                  upcoming ? "text-navy/30" : "text-navy/75",
                  cancelled && "text-rose-700"
                )}
              >
                {stage.label}
              </p>
              {stage.at ? (
                <p className="mt-0.5 text-[10px] text-ink">
                  {formatDate(stage.at, true)}
                </p>
              ) : upcoming ? (
                <p className="mt-0.5 text-[10px] text-navy/25">Not yet</p>
              ) : null}
              {stage.note && !upcoming && (
                <p
                  className={cn(
                    "mt-0.5 text-[11px] leading-relaxed",
                    cancelled ? "text-rose-600" : "text-ink"
                  )}
                >
                  {stage.note}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
