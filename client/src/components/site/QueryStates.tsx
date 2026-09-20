import { RefreshCw } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";

/** Placeholder cards while a list loads. Same footprint as the real cards, so nothing jumps. */
export function CardGridSkeleton({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading"
      className={cn("grid gap-6 md:grid-cols-2 lg:grid-cols-3", className)}
    >
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="rounded-2xl border border-line bg-surface p-7">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="mt-6 h-7 w-3/4" />
          <Skeleton className="mt-4 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-5/6" />
          <Skeleton className="mt-8 h-10 w-32" />
          <Skeleton className="mt-8 h-11 w-full" />
        </div>
      ))}
    </div>
  );
}

/** A friendly, recoverable error with a retry action. */
export function LoadError({
  what = "this",
  onRetry,
  className,
}: {
  what?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <Alert variant="danger" title={`We couldn't load ${what} just now`} className={className}>
      <p>Please check your connection and try again. You can also call or WhatsApp us directly.</p>
      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          className="mt-3"
          onClick={onRetry}
          leadingIcon={<RefreshCw aria-hidden="true" className="size-4" />}
        >
          Try again
        </Button>
      )}
    </Alert>
  );
}
