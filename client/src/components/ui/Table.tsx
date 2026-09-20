import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/**
 * Basic styled table primitives. The wrapper scrolls horizontally on narrow screens so the page
 * itself never overflows. Data-heavy admin lists will layer sorting, pagination and a mobile
 * card layout on top of these in the phases that introduce them.
 */
export function Table({ className, children, ...props }: ComponentProps<"table">) {
  return (
    <div className="overflow-x-auto rounded-card border border-line bg-surface shadow-card">
      <table
        className={cn("w-full min-w-max border-collapse text-left text-sm", className)}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

export function TableHead({ className, ...props }: ComponentProps<"thead">) {
  return <thead className={cn("border-b border-line bg-sand-50", className)} {...props} />;
}

export function TableBody({ className, ...props }: ComponentProps<"tbody">) {
  return <tbody className={cn("divide-y divide-line", className)} {...props} />;
}

export function TableRow({ className, ...props }: ComponentProps<"tr">) {
  return <tr className={cn("hover:bg-sand-50", className)} {...props} />;
}

export function TableHeaderCell({ className, scope = "col", ...props }: ComponentProps<"th">) {
  return (
    <th
      scope={scope}
      className={cn(
        "px-4 py-3 text-xs font-semibold tracking-wide text-muted uppercase",
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: ComponentProps<"td">) {
  return <td className={cn("px-4 py-3 align-middle text-ink", className)} {...props} />;
}
