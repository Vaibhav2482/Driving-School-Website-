import { createContext } from "react";
import type { AuthState, Role } from "./types";

export interface AuthContextValue extends AuthState {
  hasRole: (roles: readonly Role[]) => boolean;
  // Phase 3 adds: signIn, signOut, and session restore via the refresh-token cookie.
}

export const AuthContext = createContext<AuthContextValue | null>(null);
