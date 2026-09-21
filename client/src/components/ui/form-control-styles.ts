import { cn } from "@/lib/cn";

/** Shared look for Input, Select and Textarea so all form controls stay consistent. */
export function formControlStyles(invalid?: boolean): string {
  return cn(
    "block w-full rounded-control border bg-surface px-3.5 text-base text-ink shadow-card sm:text-sm",
    "transition-colors duration-150 placeholder:text-sand-500",
    "hover:border-sand-400 focus-visible:border-accent-600 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent-600",
    "disabled:cursor-not-allowed disabled:bg-sand-100 disabled:text-sand-500",
    invalid ? "border-danger-600" : "border-line-strong",
  );
}
