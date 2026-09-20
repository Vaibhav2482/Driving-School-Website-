import bcrypt from "bcrypt";
import { randomBytes } from "node:crypto";
import { z } from "zod";

/**
 * Password policy (documented in docs/architecture.md):
 *  - at least 10 characters and at most 72 bytes (bcrypt ignores everything after 72 bytes, so longer
 *    passwords are refused instead of being silently truncated),
 *  - not made only of digits (phone-number-like secrets are trivially guessed),
 *  - not on a short list of the most common passwords,
 *  - not the same character repeated,
 *  - never the account's own email address or phone number.
 * Length is preferred over composition rules; passphrases are welcome.
 */
export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_BYTES = 72;

const COMMON_PASSWORDS = new Set([
  "password",
  "password1",
  "password12",
  "password123",
  "passw0rd123",
  "1234567890",
  "12345678910",
  "qwertyuiop",
  "qwerty12345",
  "qwerty123456",
  "1q2w3e4r5t",
  "iloveyou123",
  "welcome123",
  "welcome1234",
  "admin12345",
  "administrator",
  "letmein1234",
  "abcdefghij",
  "abc1234567",
  "abcd123456",
  "changeme123",
  "srisaibalaji",
  "sai balaji",
  "saibalaji123",
]);

export interface PasswordContext {
  email?: string | null;
  phone?: string | null;
}

/** Returns a list of human-readable problems; empty means the password is acceptable. */
export function checkPasswordPolicy(password: string, context: PasswordContext = {}): string[] {
  const problems: string[] = [];
  if (password.length < PASSWORD_MIN_LENGTH) {
    problems.push(`Use at least ${PASSWORD_MIN_LENGTH} characters.`);
  }
  if (Buffer.byteLength(password, "utf8") > PASSWORD_MAX_BYTES) {
    problems.push(
      `Use no more than ${PASSWORD_MAX_BYTES} bytes (about ${PASSWORD_MAX_BYTES} characters).`,
    );
  }
  if (/^\d+$/.test(password)) problems.push("Do not use only numbers.");
  if (/^(.)\1+$/.test(password)) problems.push("Do not repeat a single character.");

  const lowered = password.toLowerCase();
  if (COMMON_PASSWORDS.has(lowered)) problems.push("That password is too common.");

  const own = [context.email, context.phone]
    .filter((v): v is string => Boolean(v))
    .map((v) => v.toLowerCase());
  const digitsOfPhone = context.phone?.replace(/\D/g, "");
  if (
    own.includes(lowered) ||
    (digitsOfPhone && lowered.replace(/\D/g, "") === digitsOfPhone && /\d{8,}/.test(lowered))
  ) {
    problems.push("Do not use your own email address or phone number.");
  }
  return problems;
}

/** Zod schema for a NEW password. Context-specific checks (own email/phone) happen in the service. */
export const newPasswordSchema = z
  .string({ error: "Please enter a password." })
  .superRefine((value, ctx) => {
    for (const message of checkPasswordPolicy(value)) ctx.addIssue({ code: "custom", message });
  });

export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  verify(plain: string, hash: string): Promise<boolean>;
  /**
   * Spend the same time as a real verification. Called when no account matched, so response time does
   * not reveal whether an account exists.
   */
  verifyAgainstDummy(plain: string): Promise<void>;
}

export function createPasswordHasher(cost: number): PasswordHasher {
  let dummy: Promise<string> | undefined;
  return {
    hash: (plain) => bcrypt.hash(plain, cost),
    verify: async (plain, hash) => {
      try {
        return await bcrypt.compare(plain, hash);
      } catch {
        return false; // a malformed stored hash must never authenticate
      }
    },
    verifyAgainstDummy: async (plain) => {
      dummy ??= bcrypt.hash(randomBytes(24).toString("base64url"), cost);
      await bcrypt.compare(plain, await dummy);
    },
  };
}

/** A random, unguessable password hash for accounts that have not yet set a password (invited users). */
export async function unusablePasswordHash(hasher: PasswordHasher): Promise<string> {
  return hasher.hash(randomBytes(32).toString("base64url"));
}
