import { Router, type Request, type RequestHandler } from "express";
import { sendData } from "../../lib/response.js";
import { getAuth } from "../../middleware/authenticate.js";
import { requirePermission } from "../../middleware/requirePermission.js";
import { getValidated, validate } from "../../middleware/validate.js";
import { createUserBodySchema } from "./users.schemas.js";
import type { UsersService } from "./users.service.js";

export interface UsersRouterDeps {
  authenticate: RequestHandler;
  usersService: UsersService;
}

export function usersRouter({ authenticate, usersService }: UsersRouterDeps) {
  const router = Router();
  // Everything under /users needs a signed-in user. Each route then declares its own permission.
  router.use(authenticate);

  router.post(
    "/",
    requirePermission("user:create"),
    validate({ body: createUserBodySchema }),
    async (req: Request, res) => {
      const { body } = getValidated(req, { body: createUserBodySchema });
      const result = await usersService.create(getAuth(req), body, {
        ip: req.ip ?? null,
        userAgent: req.get("user-agent") ?? null,
      });
      sendData(res, result, { status: 201 });
    },
  );

  return router;
}
