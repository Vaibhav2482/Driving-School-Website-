import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone =
  "neutral" | "brand" | "success" | "warning" | "danger" | "accent" | "inverse";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-sand-100 text-sand-700 ring-sand-200",
  brand: "bg-brand-50 text-brand-800 ring-brand-200",
  success: "bg-success-50 text-success-700 ring-success-200",
  // Road-sign yellow: used sparingly for "needs attention".
  warning: "bg-signal-100 text-warning-800 ring-warning-200",
  danger: "bg-danger-50 text-danger-700 ring-danger-200",
  accent: "bg-accent-50 text-accent-700 ring-accent-200",
  // For navy backgrounds.
  inverse: "bg-white/10 text-brand-50 ring-white/20",
};

export interface BadgeProps extends ComponentProps<"span"> {
  tone?: BadgeTone;
}

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
