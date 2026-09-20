import { z } from "zod";
import { normalizeIndianMobile, normalizeText } from "../../lib/text.js";

const ROLES = ["SUPER_ADMIN", "OWNER", "ADMIN", "INSTRUCTOR", "STUDENT"] as const;

/**
 * Body of `POST /users` (create an account and send an invitation). The role is validated here but WHETHER
 * the caller may create that role is decided by the service (privilege-escalation rules).
 */
export const createUserBodySchema = z
  .object({
    role: z.enum(ROLES, { error: "Please choose a valid role." }),
    fullName: z
      .string({ error: "Please enter a name." })
      .transform((value) => normalizeText(value))
      .pipe(z.string().min(2, "Please enter a name.").max(100)),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .pipe(z.email("Please enter a valid email address.").max(254))
      .optional(),
    phone: z
      .string()
      .transform(normalizeIndianMobile)
      .pipe(z.string().min(1, "Please enter a valid 10-digit Indian mobile number."))
      .optional(),
    /** Students and instructors belong to one branch. */
    branchId: z.uuid("Please choose a branch.").optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.email && !value.phone) {
      ctx.addIssue({
        code: "custom",
        path: ["email"],
        message: "Provide an email address or a mobile number.",
      });
    }
    if ((value.role === "STUDENT" || value.role === "INSTRUCTOR") && !value.branchId) {
      ctx.addIssue({ code: "custom", path: ["branchId"], message: "Please choose a branch." });
    }
  });

export type CreateUserInput = z.output<typeof createUserBodySchema>;
