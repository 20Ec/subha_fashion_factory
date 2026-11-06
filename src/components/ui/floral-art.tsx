import { cn } from "@/lib/utils";

export function FloralArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 560 600"
      className={cn("h-auto w-full", className)}
      role="img"
      aria-label="Illustration of a handmade floral bouquet"
    >
      <defs>
        <linearGradient id="arch" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe9f1" />
          <stop offset="0.55" stopColor="#ffdbe8" />
          <stop offset="1" stopColor="#f6eaff" />
        </linearGradient>
        <linearGradient id="petalPink" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd0e0" />
          <stop offset="1" stopColor="#f29ab8" />
        </linearGradient>
        <linearGradient id="petalDeep" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f7a9c2" />
          <stop offset="1" stopColor="#e07a9e" />
        </linearGradient>
        <linearGradient id="petalBlue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9aabf5" />
          <stop offset="1" stopColor="#3b5bdb" />
        </linearGradient>
        <linearGradient id="leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b7d8c3" />
          <stop offset="1" stopColor="#6f9f80" />
        </linearGradient>
        <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x="30" y="18" width="500" height="560" rx="250" fill="url(#arch)" />
      <circle cx="450" cy="95" r="115" fill="url(#glow)" />
      <circle cx="95" cy="470" r="80" fill="url(#glow)" />

      {/* soft decorative rings */}
      <circle
        cx="280"
        cy="290"
        r="212"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.55"
        strokeDasharray="3 12"
      />
      <circle
        cx="280"
        cy="290"
        r="176"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.35"
      />

      {/* stems */}
      <g fill="none" stroke="#6f9f80" strokeWidth="6" strokeLinecap="round">
        <path d="M282 548 C 276 460, 266 380, 282 300" />
        <path d="M282 548 C 300 470, 360 430, 408 392" />
        <path d="M282 548 C 250 480, 190 440, 158 404" />
        <path d="M282 520 C 330 500, 360 470, 372 430" />
        <path d="M282 520 C 240 500, 220 478, 210 450" />
      </g>

      {/* leaves */}
      <g fill="url(#leaf)">
        <ellipse cx="246" cy="430" rx="14" ry="38" transform="rotate(-38 246 430)" />
        <ellipse cx="318" cy="452" rx="14" ry="36" transform="rotate(38 318 452)" />
        <ellipse cx="218" cy="500" rx="13" ry="34" transform="rotate(-32 218 500)" />
        <ellipse cx="346" cy="512" rx="13" ry="34" transform="rotate(32 346 512)" />
        <ellipse cx="380" cy="440" rx="11" ry="26" transform="rotate(58 380 440)" />
        <ellipse cx="188" cy="446" rx="11" ry="26" transform="rotate(-58 188 446)" />
      </g>

      {/* main flower */}
      <g transform="translate(282 232)">
        <g fill="url(#petalPink)">
          <ellipse cx="0" cy="-62" rx="38" ry="60" />
          <ellipse cx="0" cy="62" rx="38" ry="60" />
          <ellipse cx="-62" cy="0" rx="60" ry="38" />
          <ellipse cx="62" cy="0" rx="60" ry="38" />
          <ellipse cx="-44" cy="-44" rx="38" ry="56" transform="rotate(-45)" />
          <ellipse cx="44" cy="44" rx="38" ry="56" transform="rotate(-45)" />
          <ellipse cx="44" cy="-44" rx="38" ry="56" transform="rotate(45)" />
          <ellipse cx="-44" cy="44" rx="38" ry="56" transform="rotate(45)" />
        </g>
        <g fill="url(#petalDeep)" opacity="0.75">
          <ellipse cx="0" cy="-42" rx="24" ry="38" />
          <ellipse cx="0" cy="42" rx="24" ry="38" />
          <ellipse cx="-42" cy="0" rx="38" ry="24" />
          <ellipse cx="42" cy="0" rx="38" ry="24" />
        </g>
        <circle r="34" fill="url(#petalBlue)" />
        <circle r="21" fill="#0b1b3a" opacity="0.12" />
        <g fill="#fff7fa">
          <circle cx="-9" cy="-7" r="3.2" />
          <circle cx="8" cy="-11" r="2.4" />
          <circle cx="12" cy="6" r="3" />
          <circle cx="-5" cy="11" r="2.6" />
          <circle cx="0" cy="0" r="2.2" />
        </g>
      </g>

      {/* left flower */}
      <g transform="translate(156 372) scale(0.66)">
        <g fill="url(#petalBlue)">
          <ellipse cx="0" cy="-54" rx="30" ry="48" />
          <ellipse cx="0" cy="54" rx="30" ry="48" />
          <ellipse cx="-54" cy="0" rx="48" ry="30" />
          <ellipse cx="54" cy="0" rx="48" ry="30" />
          <ellipse cx="-38" cy="-38" rx="30" ry="46" transform="rotate(-45)" />
          <ellipse cx="38" cy="38" rx="30" ry="46" transform="rotate(-45)" />
          <ellipse cx="38" cy="-38" rx="30" ry="46" transform="rotate(45)" />
          <ellipse cx="-38" cy="38" rx="30" ry="46" transform="rotate(45)" />
        </g>
        <circle r="28" fill="#f29ab8" />
        <circle r="12" fill="#fff7fa" />
        <circle r="5" fill="#3b5bdb" />
      </g>

      {/* right flower */}
      <g transform="translate(410 365) scale(0.58)">
        <g fill="url(#petalPink)">
          <ellipse cx="0" cy="-52" rx="30" ry="48" />
          <ellipse cx="0" cy="52" rx="30" ry="48" />
          <ellipse cx="-52" cy="0" rx="48" ry="30" />
          <ellipse cx="52" cy="0" rx="48" ry="30" />
          <ellipse cx="-36" cy="-36" rx="28" ry="44" transform="rotate(-45)" />
          <ellipse cx="36" cy="36" rx="28" ry="44" transform="rotate(-45)" />
          <ellipse cx="36" cy="-36" rx="28" ry="44" transform="rotate(45)" />
          <ellipse cx="-36" cy="36" rx="28" ry="44" transform="rotate(45)" />
        </g>
        <circle r="26" fill="#3b5bdb" />
        <circle r="10" fill="#fff7fa" />
      </g>

      {/* buds */}
      <g transform="translate(364 438)">
        <ellipse cx="0" cy="0" rx="18" ry="30" fill="url(#petalDeep)" />
        <path d="M0 26 L0 54" stroke="#6f9f80" strokeWidth="5" strokeLinecap="round" />
        <path d="M0 38 C 10 34, 18 40, 18 48 C 8 50, 2 46, 0 38Z" fill="url(#leaf)" />
      </g>
      <g transform="translate(204 456) rotate(-18)">
        <ellipse cx="0" cy="0" rx="15" ry="26" fill="url(#petalPink)" />
        <path d="M0 22 L0 46" stroke="#6f9f80" strokeWidth="5" strokeLinecap="round" />
      </g>

      {/* sparkles */}
      <g fill="#ffffff" opacity="0.9">
        <circle cx="120" cy="190" r="5" />
        <circle cx="440" cy="230" r="4" />
        <circle cx="400" cy="135" r="6" />
        <circle cx="150" cy="300" r="3" />
        <circle cx="465" cy="450" r="5" />
        <circle cx="105" cy="405" r="4" />
      </g>
      <g stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.8">
        <path d="M120 172v-14M112 190h-14" />
        <path d="M400 117v-12M406 135h12" />
        <path d="M465 432v-12M459 450h-12" />
      </g>
    </svg>
  );
}
