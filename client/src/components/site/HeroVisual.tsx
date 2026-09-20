import { heroImage } from "@/config/brand";
import { cn } from "@/lib/cn";

// Centre-line dashes: [start, length] as fractions of the road's depth (0 = horizon, 1 = bottom edge).
const DASHES: [number, number][] = [
  [0.03, 0.05],
  [0.13, 0.08],
  [0.27, 0.11],
  [0.45, 0.15],
  [0.69, 0.2],
];
const HORIZON_Y = 300;
const ROAD_DEPTH = 340;

function dashPath([start, length]: [number, number]): string {
  const y1 = HORIZON_Y + ROAD_DEPTH * start;
  const y2 = HORIZON_Y + ROAD_DEPTH * (start + length);
  const w1 = 1 + (y1 - HORIZON_Y) * 0.035;
  const w2 = 1 + (y2 - HORIZON_Y) * 0.035;
  return `M${300 - w1} ${y1}L${300 + w1} ${y1}L${300 + w2} ${y2}L${300 - w2} ${y2}Z`;
}

/**
 * Hero artwork: a car driving away down an open road, drawn as a flat vector scene in the brand
 * palette (navy sky, red car, road-sign yellow accents). This is a designed placeholder, not client
 * photography. When the client supplies a real photo, set `heroImage` in config/brand.ts and it is
 * used here instead, with no other change needed.
 */
export function HeroVisual({ className }: { className?: string }) {
  if (heroImage) {
    return (
      <img
        src={heroImage.src}
        alt={heroImage.alt}
        width={heroImage.width}
        height={heroImage.height}
        fetchPriority="high"
        className={cn("h-full w-full object-cover", className)}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 600 640"
      role="img"
      aria-label="Illustration of a red car driving along an open road toward the horizon, with a stop sign and a road sign beside the road."
      preserveAspectRatio="xMidYMax slice"
      className={cn("h-full w-full", className)}
    >
      <defs>
        <linearGradient id="hv-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b1230" />
          <stop offset="0.55" stopColor="#1b285d" />
          <stop offset="1" stopColor="#3a55b0" />
        </linearGradient>
        <radialGradient id="hv-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffc629" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffc629" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hv-road" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b285d" />
          <stop offset="1" stopColor="#080d24" />
        </linearGradient>
        <linearGradient id="hv-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e2352e" />
          <stop offset="1" stopColor="#b3231f" />
        </linearGradient>
        <radialGradient id="hv-taillight" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ff5a4f" stopOpacity="0.5" />
          <stop offset="1" stopColor="#ff5a4f" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Sky and low sun */}
      <rect width="600" height="640" fill="url(#hv-sky)" />
      <circle cx="300" cy="300" r="230" fill="url(#hv-glow)" />
      <circle cx="300" cy="292" r="34" fill="#ffd84d" opacity="0.9" />

      {/* Distant hills */}
      <path
        d="M0 300C70 262 140 282 220 296S360 270 440 288 560 282 600 290V330H0Z"
        fill="#233377"
      />
      <path
        d="M0 312C90 290 170 304 260 310S430 296 520 306 580 304 600 308V340H0Z"
        fill="#131c43"
      />

      {/* Ground and road */}
      <rect y="308" width="600" height="332" fill="#0b1230" />
      <polygon points="284,306 316,306 660,640 -60,640" fill="url(#hv-road)" />
      <line x1="284" y1="306" x2="-60" y2="640" stroke="#fff" strokeOpacity="0.5" strokeWidth="3" />
      <line x1="316" y1="306" x2="660" y2="640" stroke="#fff" strokeOpacity="0.5" strokeWidth="3" />
      {DASHES.map((dash) => (
        <path key={dash[0]} d={dashPath(dash)} fill="#ffc629" opacity="0.95" />
      ))}

      {/* Roadside: stop sign (left) */}
      <rect x="107" y="338" width="6" height="104" rx="2" fill="#8a94b8" />
      <polygon
        points="96,300 124,300 138,314 138,342 124,356 96,356 82,342 82,314"
        transform="translate(-1 -6)"
        fill="#e2352e"
        stroke="#fff"
        strokeWidth="3"
      />
      <text
        x="109"
        y="335"
        textAnchor="middle"
        fontFamily="Inter Variable, Inter, sans-serif"
        fontWeight="800"
        fontSize="13"
        fill="#fff"
        letterSpacing="0.5"
      >
        STOP
      </text>

      {/* Roadside: yellow warning sign (right) */}
      <rect x="517" y="352" width="6" height="96" rx="2" fill="#8a94b8" />
      <rect
        x="498"
        y="318"
        width="44"
        height="44"
        rx="5"
        transform="rotate(45 520 340)"
        fill="#ffc629"
        stroke="#0b1230"
        strokeWidth="3"
      />
      <path
        d="M512 350v-9c0-6 3-9 9-9h8m0 0-6-6m6 6-6 6"
        transform="translate(-1 -1)"
        fill="none"
        stroke="#0b1230"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* The car, seen from behind */}
      <ellipse cx="300" cy="594" rx="175" ry="15" fill="#000" opacity="0.4" />
      <rect x="166" y="546" width="50" height="52" rx="12" fill="#05081a" />
      <rect x="384" y="546" width="50" height="52" rx="12" fill="#05081a" />
      <ellipse cx="180" cy="452" rx="24" ry="13" fill="#a51f1c" />
      <ellipse cx="420" cy="452" rx="24" ry="13" fill="#a51f1c" />

      {/* cabin */}
      <path d="M196 476 219 392Q223 382 234 382H366Q377 382 381 392L404 476Z" fill="#b3231f" />
      <path d="M212 468 231 404Q234 396 243 396H357Q366 396 369 404L388 468Z" fill="#0d1533" />
      <path d="M244 398h34l-22 68h-34Z" fill="#fff" opacity="0.07" />
      <rect x="236" y="376" width="128" height="9" rx="4.5" fill="#8f1f1d" />

      {/* body */}
      <rect x="150" y="466" width="300" height="112" rx="28" fill="url(#hv-body)" />
      <rect x="164" y="474" width="272" height="5" rx="2.5" fill="#fff" opacity="0.18" />

      {/* tail lights */}
      <circle cx="196" cy="504" r="46" fill="url(#hv-taillight)" />
      <circle cx="404" cy="504" r="46" fill="url(#hv-taillight)" />
      <rect x="160" y="490" width="68" height="28" rx="9" fill="#5e1211" />
      <rect x="165" y="494" width="58" height="20" rx="7" fill="#ff5a4f" />
      <rect x="372" y="490" width="68" height="28" rx="9" fill="#5e1211" />
      <rect x="377" y="494" width="58" height="20" rx="7" fill="#ff5a4f" />

      {/* bumper and plate */}
      <rect x="160" y="540" width="280" height="34" rx="13" fill="#8f1f1d" />
      <rect x="262" y="522" width="76" height="30" rx="5" fill="#f4f1ec" />
      <rect
        x="266"
        y="526"
        width="68"
        height="22"
        rx="3"
        fill="none"
        stroke="#d8d1c5"
        strokeWidth="1.5"
      />
    </svg>
  );
}
