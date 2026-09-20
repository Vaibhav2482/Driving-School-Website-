import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "accent" | "secondary" | "inverse" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex select-none items-center justify-center gap-2 rounded-control font-semibold whitespace-nowrap " +
  "transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  // Structural action: navy.
  primary: "bg-brand-800 text-white hover:bg-brand-900 active:bg-brand-950",
  // The one primary call to action per view ("Book Your Driving Lesson"): red.
  accent: "bg-accent-600 text-white hover:bg-accent-700 active:bg-accent-800",
  secondary:
    "border border-line-strong bg-surface text-brand-900 hover:bg-sand-100 active:bg-sand-200",
  // For navy backgrounds: outlined white.
  inverse: "border border-white/30 text-white hover:bg-white/10 active:bg-white/15",
  ghost: "text-brand-800 hover:bg-brand-50 active:bg-brand-100",
  danger: "bg-danger-600 text-white hover:bg-danger-700",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm", // 44px: comfortable touch target on phones
  lg: "h-12 px-6 text-base",
};

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

/** Class names for anything that should look like a button, e.g. a router `<Link>`. */
export function buttonStyles({
  variant = "primary",
  size = "md",
  fullWidth,
}: ButtonStyleOptions = {}): string {
  return cn(base, variants[variant], sizes[size], fullWidth && "w-full");
}
