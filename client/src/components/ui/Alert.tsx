import { AlertTriangle, CheckCircle2, Info, XCircle, type LucideIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type AlertVariant = "info" | "success" | "warning" | "danger";

const styles: Record<AlertVariant, { box: string; icon: LucideIcon; iconColor: string }> = {
  info: {
    box: "border-brand-200 bg-brand-50 text-brand-900",
    icon: Info,
    iconColor: "text-brand-600",
  },
  success: {
    box: "border-success-200 bg-success-50 text-success-700",
    icon: CheckCircle2,
    iconColor: "text-success-700",
  },
  warning: {
    box: "border-warning-200 bg-warning-50 text-warning-800",
    icon: AlertTriangle,
    iconColor: "text-warning-800",
  },
  danger: {
    box: "border-danger-200 bg-danger-50 text-danger-700",
    icon: XCircle,
    iconColor: "text-danger-600",
  },
};

export interface AlertProps extends Omit<ComponentProps<"div">, "title"> {
  variant?: AlertVariant;
  title?: ReactNode;
}

/** Errors and warnings are announced immediately (role="alert"); info and success politely (role="status"). */
export function Alert({ variant = "info", title, className, children, ...props }: AlertProps) {
  const { box, icon: Icon, iconColor } = styles[variant];
  const urgent = variant === "danger" || variant === "warning";
  return (
    <div
      role={urgent ? "alert" : "status"}
      className={cn("flex gap-3 rounded-control border p-4 text-sm", box, className)}
      {...props}
    >
      <Icon aria-hidden="true" className={cn("mt-0.5 size-5 shrink-0", iconColor)} />
      <div className="min-w-0">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={cn(!!title && "mt-1")}>{children}</div> : null}
      </div>
    </div>
  );
}
