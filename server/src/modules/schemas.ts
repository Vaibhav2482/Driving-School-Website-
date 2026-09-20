import { z } from "zod";

/** `/:id` path parameter for records keyed by UUID. */
export const idParamsSchema = z.object({ id: z.uuid("Invalid identifier.") });
