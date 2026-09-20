import { useMemo, type ReactNode } from "react";
import { AuthContext, type AuthContextValue } from "./auth-context";
import type { AuthState } from "./types";

/**
 * PHASE 1 FOUNDATION: holds auth state and exposes it through `useAuth`, so route guards and
 * layouts can already be written against the final shape. There is no sign-in yet, so the state is
 * always "anonymous". Phase 3 replaces the constant below with real session restore (refresh-token
 * cookie → short-lived access token kept in memory), plus signIn/signOut.
 */
const ANONYMOUS: AuthState = { status: "anonymous", user: null };

export function AuthProvider({ children }: { children: ReactNode }) {
  const value = useMemo<AuthContextValue>(
    () => ({
      ...ANONYMOUS,
      hasRole: (roles) => ANONYMOUS.user !== null && roles.includes(ANONYMOUS.user.role),
    }),
    [],
  );
  return <AuthContext value={value}>{children}</AuthContext>;
}
