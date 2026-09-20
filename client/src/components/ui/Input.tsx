import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { formControlStyles } from "./form-control-styles";

export interface InputProps extends ComponentProps<"input"> {
  invalid?: boolean;
}

/** Text-like input. Pair with `FormField` for the label, hint and error wiring. */
export function Input({ invalid, className, ...props }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(formControlStyles(invalid), "h-11", className)}
      {...props}
    />
  );
}
