import { BadgeCheck, Palette, Sparkles } from "lucide-react";
import { FloralArt } from "@/components/ui/floral-art";

export function AuthAside() {
  return (
    <div className="relative hidden overflow-hidden rounded-r-3xl bg-gradient-to-br from-pink-soft via-blush to-white p-8 lg:flex lg:flex-col lg:justify-between">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-pink">
          Subha Fashion Factory
        </p>
        <h2 className="mt-3 max-w-xs text-2xl font-semibold leading-tight tracking-tight text-navy">
          Flowers, thoughtfully made for you.
        </h2>
      </div>

      <FloralArt className="mx-auto my-4 w-[78%]" />

      <div className="space-y-3">
        {[
          { icon: Sparkles, text: "Handcrafted blooms, petal by petal" },
          { icon: Palette, text: "Custom colours and made-to-order pieces" },
          { icon: BadgeCheck, text: "Every order confirmed by a real person" },
        ].map((item) => (
          <div key={item.text} className="flex items-center gap-2.5">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-blue">
              <item.icon className="h-3.5 w-3.5" />
            </span>
            <span className="text-xs text-navy/55">{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
