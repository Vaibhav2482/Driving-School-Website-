import { Router, type Request, type RequestHandler } from "express";
import { AppError } from "../../lib/errors.js";
import type { PrismaClient } from "../../lib/prisma.js";
import { sendData } from "../../lib/response.js";
import { getAuth } from "../../middleware/authenticate.js";
import { requirePermission } from "../../middleware/requirePermission.js";
import { getValidated, validate } from "../../middleware/validate.js";
import { canSeeStudentContact, studentAccessFilter } from "../access.js";
import { idParamsSchema } from "../schemas.js";

export interface StudentsRouterDeps {
  authenticate: RequestHandler;
  prisma: Pick<PrismaClient, "student">;
}

/**
 * `GET /students/:id`: the reference example of authorisation + OWNERSHIP.
 *  1. `requirePermission` says the role may read students in some scope.
 *  2. `studentAccessFilter` turns the SESSION identity into a query filter (all / assigned / self).
 *  3. The requested id is only an extra condition ANDed onto that filter, so changing /students/123 to
 *     /students/124 finds nothing (404) rather than someone else's record.
 * Instructors get a reduced view (no contact details).
 */
export function studentsRouter({ authenticate, prisma }: StudentsRouterDeps) {
  const router = Router();
  router.use(authenticate);

  router.get(
    "/:id",
    requirePermission("student:read", "student:read:self", "student:read:assigned"),
    validate({ params: idParamsSchema }),
    async (req: Request, res) => {
      const auth = getAuth(req);
      const { params } = getValidated(req, { params: idParamsSchema });

      const student = await prisma.student.findFirst({
        where: { AND: [studentAccessFilter(auth), { id: params.id }] },
        select: {
          id: true,
          status: true,
          user: { select: { fullName: true, email: true, phone: true } },
          branch: { select: { name: true } },
        },
      });
      if (!student) throw AppError.notFound("Student not found.");

      sendData(res, {
        id: student.id,
        name: student.user.fullName,
        status: student.status,
        ...(canSeeStudentContact(auth)
          ? { email: student.user.email, phone: student.user.phone, branch: student.branch.name }
          : {}),
      });
    },
  );

  return router;
}
