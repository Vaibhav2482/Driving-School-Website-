import { useNavigation } from "react-router";
import { cn } from "@/lib/cn";

/** A thin bar at the top of the page while a lazy route is loading. */
export function NavigationProgress() {
  const { state } = useNavigation();
  const loading = state !== "idle";
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-accent-600 transition-[transform,opacity] duration-500",
        loading ? "scale-x-75 opacity-100" : "scale-x-100 opacity-0",
      )}
    />
  );
}
