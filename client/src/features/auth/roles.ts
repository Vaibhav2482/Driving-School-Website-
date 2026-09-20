import type { Role } from "./types";

/**
 * Which roles may enter each area of the app. These drive route guards for UX ONLY:
 * the API enforces every permission itself, and hiding a page is never a security control.
 */
export const ADMIN_AREA_ROLES: readonly Role[] = ["SUPER_ADMIN", "OWNER", "ADMIN"];
export const INSTRUCTOR_AREA_ROLES: readonly Role[] = ["INSTRUCTOR"];
export const STUDENT_AREA_ROLES: readonly Role[] = ["STUDENT"];
