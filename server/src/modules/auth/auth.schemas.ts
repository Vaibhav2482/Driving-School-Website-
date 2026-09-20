import { z } from "zod";
import { newPasswordSchema } from "../../lib/passwords.js";

/**
 * Login deliberately does NOT apply the password policy: it must accept whatever the person set
 * (including passwords created before a policy change) and reveal nothing about the rules.
 */
export const loginBodySchema = z.object({
  /** An email address or an Indian mobile number. */
  identifier: z
    .string({ error: "Please enter your email or mobile number." })
    .trim()
    .min(1, "Please enter your email or mobile number.")
    .max(254),
  password: z
    .string({ error: "Please enter your password." })
    .min(1, "Please enter your password.")
    .max(200),
});

export const changePasswordBodySchema = z.object({
  currentPassword: z
    .string({ error: "Please enter your current password." })
    .min(1, "Please enter your current password.")
    .max(200),
  newPassword: newPasswordSchema,
});

export const forgotPasswordBodySchema = z.object({
  email: z
    .string({ error: "Please enter your email address." })
    .trim()
    .toLowerCase()
    .pipe(z.email("Please enter a valid email address.").max(254)),
});

const oneTimeToken = z
  .string({ error: "This link is invalid or has expired." })
  .trim()
  .min(20, "This link is invalid or has expired.")
  .max(200, "This link is invalid or has expired.");

export const resetPasswordBodySchema = z.object({
  token: oneTimeToken,
  newPassword: newPasswordSchema,
});

export const acceptInviteBodySchema = z.object({
  token: oneTimeToken,
  password: newPasswordSchema,
});
