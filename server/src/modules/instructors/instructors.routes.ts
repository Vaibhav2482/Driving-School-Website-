import { Router, type Request, type RequestHandler } from "express";
import { AppError } from "../../lib/errors.js";
import type { PrismaClient } from "../../lib/prisma.js";
import { sendData } from "../../lib/response.js";
import { getAuth } from "../../middleware/authenticate.js";
import { requirePermission } from "../../middleware/requirePermission.js";
import { getValidated, validate } from "../../middleware/validate.js";
import { instructorAccessFilter } from "../access.js";
import { idParamsSchema } from "../schemas.js";

export interface InstructorsRouterDeps {
  authenticate: RequestHandler;
  prisma: Pick<PrismaClient, "instructor">;
}

/** `GET /instructors/:id`: staff see any instructor; an instructor sees only their own profile. */
export function instructorsRouter({ authenticate, prisma }: InstructorsRouterDeps) {
  const router = Router();
  router.use(authenticate);

  router.get(
    "/:id",
    requirePermission("instructor:read", "instructor:read:self"),
    validate({ params: idParamsSchema }),
    async (req: Request, res) => {
      const auth = getAuth(req);
      const { params } = getValidated(req, { params: idParamsSchema });

      const instructor = await prisma.instructor.findFirst({
        where: { AND: [instructorAccessFilter(auth), { id: params.id }] },
        select: {
          id: true,
          bio: true,
          experienceYears: true,
          isActive: true,
          user: { select: { fullName: true, email: true, phone: true } },
          branch: { select: { name: true } },
        },
      });
      if (!instructor) throw AppError.notFound("Instructor not found.");

      sendData(res, {
        id: instructor.id,
        name: instructor.user.fullName,
        email: instructor.user.email,
        phone: instructor.user.phone,
        bio: instructor.bio,
        experienceYears: instructor.experienceYears,
        isActive: instructor.isActive,
        branch: instructor.branch.name,
      });
    },
  );

  return router;
}
