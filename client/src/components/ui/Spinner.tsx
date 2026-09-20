import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

interface SpinnerProps {
  /** Screen-reader label. */
  label?: string;
  className?: string;
}

export function Spinner({ label = "Loading", className }: SpinnerProps) {
  return (
    <span role="status" className="inline-flex items-center">
      <Loader2 aria-hidden="true" className={cn("size-5 animate-spin", className)} />
      <span className="sr-only">{label}</span>
    </span>
  );
}
