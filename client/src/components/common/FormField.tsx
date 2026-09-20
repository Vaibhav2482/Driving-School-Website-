import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Props to spread on the form control so label, hint and error are programmatically linked. */
export interface FormControlProps {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
  required?: boolean;
}

export interface FormFieldProps {
  label: string;
  /** Validation message. When present the control is marked invalid. */
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: (control: FormControlProps) => ReactNode;
}

/**
 * Label + control + hint + error, wired for accessibility.
 *
 *   <FormField label="Phone" error={errors.phone?.message} required>
 *     {(control) => <Input type="tel" {...control} {...register("phone")} />}
 *   </FormField>
 */
export function FormField({ label, error, hint, required, className, children }: FormFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ");

  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-accent-600">
            *
          </span>
        )}
      </label>
      {children({
        id,
        required,
        "aria-describedby": describedBy || undefined,
        "aria-invalid": error ? true : undefined,
      })}
      {hint && (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-medium text-danger-700">
          {error}
        </p>
      )}
    </div>
  );
}
