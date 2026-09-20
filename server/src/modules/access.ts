import type { Prisma } from "../generated/prisma/client.js";
import { hasPermission } from "../config/permissions.js";
import { AppError } from "../lib/errors.js";
import type { AuthContext } from "../middleware/authenticate.js";

/**
 * OWNERSHIP RULES. Permissions say what KIND of thing a role may touch; these functions say WHICH
 * records. They turn the authenticated identity (never a client-supplied id) into a database filter, and
 * services apply that filter to the query itself, so a record you may not see is simply not found (404)
 * and existence is not leaked.
 *
 *   staff (student:read)        → every student
 *   instructor                  → only students who have a lesson with them
 *   student (student:read:self) → only their own record
 */
export function studentAccessFilter(auth: AuthContext): Prisma.StudentWhereInput {
  if (hasPermission(auth.role, "student:read")) return { deletedAt: null };
  if (hasPermission(auth.role, "student:read:assigned") && auth.instructorId) {
    return { deletedAt: null, lessons: { some: { instructorId: auth.instructorId } } };
  }
  if (hasPermission(auth.role, "student:read:self") && auth.studentId) {
    return { deletedAt: null, id: auth.studentId };
  }
  throw AppError.forbidden();
}

/**
 *   staff (instructor:read)          → every instructor
 *   instructor (instructor:read:self) → only themselves
 */
export function instructorAccessFilter(auth: AuthContext): Prisma.InstructorWhereInput {
  if (hasPermission(auth.role, "instructor:read")) return { deletedAt: null };
  if (hasPermission(auth.role, "instructor:read:self") && auth.instructorId) {
    return { deletedAt: null, id: auth.instructorId };
  }
  throw AppError.forbidden();
}

/** Whether the caller may see a learner's contact details (staff and the learner themself, not instructors). */
export const canSeeStudentContact = (auth: AuthContext): boolean =>
  hasPermission(auth.role, "student:read") || hasPermission(auth.role, "student:read:self");
