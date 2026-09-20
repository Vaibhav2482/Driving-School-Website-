/** Mirrors the server's `Role` enum. */
export type Role = "SUPER_ADMIN" | "OWNER" | "ADMIN" | "INSTRUCTOR" | "STUDENT";

/** The signed-in user as returned by the API (`GET /auth/me`, added in Phase 3). */
export interface AuthUser {
  id: string;
  fullName: string;
  email: string | null;
  role: Role;
}

/**
 * - `loading`: restoring a session (Phase 3: call refresh using the httpOnly cookie).
 * - `anonymous`: nobody is signed in.
 * - `authenticated`: `user` is set.
 */
export type AuthStatus = "loading" | "anonymous" | "authenticated";

export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
}
