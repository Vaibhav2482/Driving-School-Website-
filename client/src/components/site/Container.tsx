import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/** Page-width wrapper: consistent gutters (16px on phones, up to 32px on desktop) and max width. */
export function Container({ className, ...props }: ComponentProps<"div">) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)} {...props} />
  );
}
