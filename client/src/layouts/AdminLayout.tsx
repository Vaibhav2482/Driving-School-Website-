import { adminNav } from "@/config/navigation";
import { DashboardShell } from "./DashboardShell";

export function AdminLayout() {
  return <DashboardShell area="Admin" nav={adminNav} />;
}
