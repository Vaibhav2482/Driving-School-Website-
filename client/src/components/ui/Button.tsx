import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { buttonStyles, type ButtonStyleOptions } from "./button-styles";
import { Spinner } from "./Spinner";

export interface ButtonProps extends ComponentProps<"button">, ButtonStyleOptions {
  /** Shows a spinner and blocks clicks while an action is in flight. */
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

export function Button({
  variant,
  size,
  fullWidth,
  loading = false,
  leadingIcon,
  trailingIcon,
  disabled,
  // Default to "button" so a Button inside a <form> never submits by accident.
  type = "button",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonStyles({ variant, size, fullWidth }), className)}
      {...props}
    >
      {loading ? <Spinner label="Working" className="size-4" /> : leadingIcon}
      {children}
      {!loading && trailingIcon}
    </button>
  );
}
