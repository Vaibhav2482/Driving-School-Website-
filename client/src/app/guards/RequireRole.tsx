import { Navigate, Outlet, useLocation } from "react-router";
import { FullPageSpinner } from "@/components/common/FullPageSpinner";
import { isDevAuthBypassEnabled } from "@/config/env";
import { useAuth } from "@/features/auth/useAuth";
import type { Role } from "@/features/auth/types";

interface RequireRoleProps {
  roles: readonly Role[];
}

/**
 * Route guard used as a layout route: `{ element: <RequireRole roles={...} />, children: [...] }`.
 *
 * This is a USER-EXPERIENCE gate only. It keeps people out of screens they cannot use, but every
 * API call is authorised again on the server, which is what actually protects the data.
 */
export function RequireRole({ roles }: RequireRoleProps) {
  const { status, user } = useAuth();
  const location = useLocation();

  if (isDevAuthBypassEnabled()) return <Outlet />; // Phase 1 development aid; see config/env.ts

  if (status === "loading") return <FullPageSpinner />;

  if (status === "anonymous" || !user) {
    return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />;
  }

  if (!roles.includes(user.role)) return <Navigate to="/" replace />;

  return <Outlet />;
}
