import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { formControlStyles } from "./form-control-styles";

export interface TextareaProps extends ComponentProps<"textarea"> {
  invalid?: boolean;
}

export function Textarea({ invalid, className, rows = 4, ...props }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(formControlStyles(invalid), "min-h-24 py-2.5", className)}
      {...props}
    />
  );
}
