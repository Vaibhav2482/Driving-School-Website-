import { useId } from "react";
import { brandLogo } from "@/config/brand";
import { cn } from "@/lib/cn";

/**
 * The school's mark: a low red sports car drawn as one flowing outline, with speed streaks fading out behind it.
 * TEMPORARY until the client supplies their own logo (see `brandLogo` in config/brand.ts).
 */
export function CarMark({ className }: { className?: string }) {
  // Each copy of the mark needs its own gradient id, or copies on the same page would share (and break) one.
  const fade = `car-fade-${useId().replace(/:/g, "")}`;
  return (
    <svg viewBox="0 0 250 78" aria-hidden="true" className={cn("h-auto w-24", className)}>
      <defs>
        <linearGradient id={fade} x1="0" x2="1">
          <stop offset="0" stopColor="#e5251b" />
          <stop offset="1" stopColor="#e5251b" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g fill={`url(#${fade})`}>
        <rect x="176" y="27" width="62" height="2.2" />
        <rect x="180" y="33" width="52" height="1.8" />
        <rect x="178" y="39" width="70" height="2.6" />
        <rect x="182" y="45" width="56" height="1.8" />
        <rect x="176" y="51" width="64" height="2.2" />
        <rect x="184" y="57" width="42" height="1.6" />
        <rect x="186" y="22" width="40" height="1.5" />
      </g>
      <g fill="none" stroke="#e5251b" strokeLinecap="round" strokeLinejoin="round">
        <path
          strokeWidth="4.2"
          d="M6 55C6 52 12 50.500 24 48.500C44 45 66 40 86 34.500C97 27 110 23.500 126 24C144 24.500 158 31 176 37.500L185 35.500L185 54L166 57"
        />
        <path strokeWidth="4.2" d="M137 57H67" />
        <path strokeWidth="4.2" d="M37 57H16C10 57 6.500 56.500 6 55" />
        <path strokeWidth="4.2" d="M67 57A15 15 0 0 0 37 57" />
        <path strokeWidth="4.2" d="M166 57A15 15 0 0 0 137 57" />
        <path strokeWidth="3" d="M94 35C103 30 113 28 124 28.500L142 35.500Z" />
        <path strokeWidth="2.600" d="M26 50.500C56 50 84 46 112 41" opacity=".9" />
        <circle strokeWidth="4" cx="52" cy="60" r="10.500" />
        <circle strokeWidth="4" cx="152" cy="60" r="10.500" />
      </g>
    </svg>
  );
}

interface LogoProps {
  /** `dark` for light backgrounds, `light` for carbon-black backgrounds (header, footer). */
  tone?: "dark" | "light";
  className?: string;
}

/**
 * The site logo: the car mark beside a slanted wordmark with a red rule. When the client's real logo is supplied,
 * set `brandLogo` in config/brand.ts and this renders that image instead, with no other change needed.
 */
export function Logo({ tone = "dark", className }: LogoProps) {
  if (brandLogo) {
    return (
      <img
        src={brandLogo.src}
        alt={brandLogo.alt}
        width={brandLogo.width}
        height={brandLogo.height}
        className={cn("h-10 w-auto", className)}
      />
    );
  }

  const light = tone === "light";
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <CarMark className="w-[74px] shrink-0 sm:w-24" />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display text-[22px] leading-none font-extrabold tracking-wide sm:text-[27px]",
            light ? "text-white" : "text-brand-950",
          )}
        >
          Sri Sai Balaji
        </span>
        <span aria-hidden="true" className="mt-1.5 h-0.5 w-full bg-accent-500" />
        <span
          className={cn(
            "mt-1.5 text-[9.5px] font-semibold tracking-[0.38em] uppercase not-italic",
            light ? "text-sand-300" : "text-sand-700",
          )}
        >
          Driving School
        </span>
      </span>
    </span>
  );
}
