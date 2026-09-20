import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

export interface StatCardProps {
  label: string;
  /** Real data only. `undefined` renders a dash rather than an invented number. */
  value?: string | number;
  hint?: string;
  icon?: LucideIcon;
  isLoading?: boolean;
}

/** A dashboard metric. It never fabricates a value: loading shows a skeleton, no data shows "—". */
export function StatCard({ label, value, hint, icon: Icon, isLoading = false }: StatCardProps) {
  return (
    <Card
      padding="sm"
      className="flex items-start justify-between gap-3"
      aria-busy={isLoading || undefined}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-muted">{label}</p>
        {isLoading ? (
          <Skeleton className="mt-2 h-8 w-20" />
        ) : (
          <p className="mt-1 font-display text-2xl font-semibold text-ink tabular-nums">
            {value ?? "—"}
          </p>
        )}
        {hint && !isLoading && <p className="mt-1 text-xs text-muted">{hint}</p>}
      </div>
      {Icon && (
        <span className="grid size-10 shrink-0 place-items-center rounded-control bg-brand-50 text-brand-700">
          <Icon aria-hidden="true" className="size-5" />
        </span>
      )}
    </Card>
  );
}
