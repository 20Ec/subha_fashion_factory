import { cn } from "@/lib/utils";

const tones: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  confirmed: "border-blue-200 bg-blue-50 text-blue-700",
  packed: "border-violet-200 bg-violet-50 text-violet-700",
  shipped: "border-cyan-200 bg-cyan-50 text-cyan-700",
  delivered: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-rose-200 bg-rose-50 text-rose-700",
  paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
  refunded: "border-slate-200 bg-slate-100 text-slate-600",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-rose-200 bg-rose-50 text-rose-700",
  completed: "border-slate-200 bg-slate-100 text-slate-700",
  return: "border-pink-200 bg-pink-soft text-navy",
  replace: "border-blue-200 bg-blue-50 text-blue-700",
  cancel: "border-rose-200 bg-rose-50 text-rose-700",
};

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: string;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize tracking-wide",
        tones[status] ?? "border-navy/10 bg-white text-navy/70",
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label ?? status}
    </span>
  );
}
