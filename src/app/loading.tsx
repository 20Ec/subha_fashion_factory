import { FlowerMark } from "@/components/ui/logo";

export default function Loading() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-3 py-20">
      <span className="grid h-12 w-12 animate-pulse place-items-center rounded-2xl bg-pink-soft text-pink">
        <FlowerMark className="h-6 w-6" />
      </span>
      <p className="text-xs font-medium tracking-wide text-navy/40">
        Gathering your blooms…
      </p>
    </div>
  );
}
