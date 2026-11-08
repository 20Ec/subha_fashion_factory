import { cn } from "@/lib/utils";
import { FlowerMark } from "@/components/ui/logo";

export function EmptyState({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-white/70 px-6 py-14 text-center",
        className
      )}
    >
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-pink-soft text-deep-rose">
        <FlowerMark className="h-7 w-7" />
      </span>
      <h3 className="mt-4 text-lg font-semibold text-navy">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-ink">{description}</p>
      )}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}
