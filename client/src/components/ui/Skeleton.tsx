import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/** Loading placeholder. Decorative; pair with a live region or `aria-busy` on the container. */
export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-sand-200", className)}
      {...props}
    />
  );
}
