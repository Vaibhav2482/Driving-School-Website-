import { instructorNav } from "@/config/navigation";
import { DashboardShell } from "./DashboardShell";

export function InstructorLayout() {
  return <DashboardShell area="Instructor portal" nav={instructorNav} />;
}
