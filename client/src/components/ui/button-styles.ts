import { cn } from "@/lib/cn";

export type ButtonVariant =
  "primary" | "accent" | "whatsapp" | "secondary" | "inverse" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "group inline-flex select-none items-center justify-center gap-2 rounded-control font-display font-bold tracking-wider whitespace-nowrap uppercase italic " +
  "transition-[background-color,color,box-shadow,transform,border-color] duration-200 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  // Structural action: midnight navy.
  primary: "bg-brand-900 text-white hover:bg-brand-800 active:bg-brand-950",
  // The one primary call to action per view ("Book your lesson"): champagne gold with navy text.
  // The one primary call to action per view: solid racing red with slanted ends and a sheen that sweeps across on hover.
  accent:
    "relative overflow-hidden bg-accent-500 text-white [clip-path:polygon(10px_0,100%_0,calc(100%-10px)_100%,0_100%)] before:absolute before:inset-y-0 before:-left-1/2 before:w-1/3 before:-skew-x-12 before:bg-white/35 before:opacity-0 before:blur-md before:transition-all before:duration-700 before:content-[''] hover:bg-accent-600 hover:before:left-[130%] hover:before:opacity-100 active:bg-accent-700",
  // WhatsApp actions: WhatsApp green with dark text (white on this green is too faint), slanted like the red button.
  whatsapp:
    "relative overflow-hidden bg-[#25d366] text-brand-950 [clip-path:polygon(10px_0,100%_0,calc(100%-10px)_100%,0_100%)] before:absolute before:inset-y-0 before:-left-1/2 before:w-1/3 before:-skew-x-12 before:bg-white/45 before:opacity-0 before:blur-md before:transition-all before:duration-700 before:content-[''] hover:bg-[#1fbd5a] hover:before:left-[130%] hover:before:opacity-100 active:bg-[#19a84f]",
  secondary:
    "border border-line-strong bg-surface text-brand-900 hover:border-accent-500 hover:bg-accent-50 active:bg-accent-100",
  // For navy backgrounds and photography: frosted outline.
  inverse:
    "border border-white/35 bg-white/5 text-white backdrop-blur-sm hover:border-white/60 hover:bg-white/15 active:bg-white/20",
  ghost: "text-brand-800 hover:bg-brand-50 active:bg-brand-100",
  danger: "bg-danger-600 text-white hover:bg-danger-700",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-base",
  md: "h-11 px-6 text-lg", // 44px: comfortable touch target on phones
  lg: "h-14 px-10 text-xl",
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
