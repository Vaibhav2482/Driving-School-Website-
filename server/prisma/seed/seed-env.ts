import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ quiet: true });

const PLACEHOLDER_PATTERN = /change-?me|replace-?me|your-password|<.*>/i;

const baseSchema = z.object({
  DATABASE_URL: z
    .string({ error: "DATABASE_URL is required" })
    .regex(/^postgres(ql)?:\/\//, "DATABASE_URL must be a postgresql:// connection string"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const ownerSchema = baseSchema.extend({
  SEED_OWNER_EMAIL: z.email("SEED_OWNER_EMAIL must be a valid email address"),
  SEED_OWNER_PASSWORD: z
    .string({ error: "SEED_OWNER_PASSWORD is required" })
    .min(12, "SEED_OWNER_PASSWORD must be at least 12 characters")
    .refine(
      (v) => !PLACEHOLDER_PATTERN.test(v),
      "SEED_OWNER_PASSWORD still contains the .env.example placeholder",
    ),
  SEED_OWNER_NAME: z.string().trim().min(2).default("P. Mahesh"),
  SEED_OWNER_PHONE: z
    .string()
    .regex(/^\+?[0-9]{10,13}$/, "SEED_OWNER_PHONE must be 10-13 digits, optionally starting with +")
    .optional(),
});

function parseOrExit<T extends z.ZodType>(schema: T, hint: string): z.output<T> {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    console.error("Seed configuration is invalid:");
    for (const issue of result.error.issues) {
      console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
    }
    console.error(`\n${hint}`);
    process.exit(1);
  }
  return result.data;
}

export const loadOwnerSeedEnv = () =>
  parseOrExit(
    ownerSchema,
    "Set these in server/.env (see server/.env.example). Owner credentials are never hard-coded.",
  );

export const loadBaseSeedEnv = () => parseOrExit(baseSchema, "Set DATABASE_URL in server/.env.");
