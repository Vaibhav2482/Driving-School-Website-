import { studentNav } from "@/config/navigation";
import { DashboardShell } from "./DashboardShell";

export function StudentLayout() {
  return <DashboardShell area="Student portal" nav={studentNav} />;
}
