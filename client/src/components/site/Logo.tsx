import { brandLogo } from "@/config/brand";
import { cn } from "@/lib/cn";

/** Steering-wheel mark, matching the client's driving-school theme. Part of the temporary logo. */
function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={cn("size-10 shrink-0", className)}>
      <rect width="40" height="40" rx="10" fill="currentColor" />
      <circle cx="20" cy="20" r="11" fill="none" stroke="#fff" strokeWidth="3" />
      <path
        d="M20 23.5V32M16.5 20H8.5M23.5 20h8"
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="20" cy="20" r="3.4" fill="#e2352e" />
    </svg>
  );
}

interface LogoProps {
  /** `dark` for light backgrounds (header), `light` for navy backgrounds (footer). */
  tone?: "dark" | "light";
  className?: string;
}

/**
 * The site logo. TEMPORARY treatment: a wordmark built from the business name plus a simple
 * steering-wheel mark. When the client's real logo is supplied, set `brandLogo` in config/brand.ts and
 * this component renders that image instead, with no other change needed.
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
      <LogoMark className={light ? "text-brand-700" : "text-brand-900"} />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display text-[17px] font-bold tracking-tight sm:text-lg",
            light ? "text-white" : "text-brand-900",
          )}
        >
          Sri Sai Balaji
        </span>
        <span
          className={cn(
            "mt-1.5 text-[10px] font-semibold tracking-[0.24em] uppercase",
            light ? "text-accent-300" : "text-accent-600",
          )}
        >
          Driving School
        </span>
      </span>
    </span>
  );
}
