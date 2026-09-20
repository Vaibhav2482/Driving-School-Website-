import { ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { formControlStyles } from "./form-control-styles";

export interface SelectProps extends ComponentProps<"select"> {
  invalid?: boolean;
}

/** Native `<select>` (best accessibility and mobile behaviour) with a consistent look. */
export function Select({ invalid, className, children, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        aria-invalid={invalid || undefined}
        className={cn(formControlStyles(invalid), "h-11 appearance-none pr-10", className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-sand-500"
      />
    </div>
  );
}
