/**
 * PRODUCTION-SAFE seed:  npm run seed
 *
 * Creates only what a fresh installation needs:
 *   - the OWNER bootstrap account (credentials come from environment variables, never from code),
 *   - the two branches, the confirmed business contact settings, and the default skill list.
 *
 * It creates NO students, reviews, payments, revenue or statistics. It is idempotent: running it
 * again never overwrites anything the owner has edited, and never touches an existing account.
 * For fake development data use `npm run seed:dev` instead.
 */
import bcrypt from "bcrypt";
import { createPrismaClient } from "../src/lib/prisma.js";
import { seedFoundation } from "./seed/foundation.js";
import { loadOwnerSeedEnv } from "./seed/seed-env.js";

const BCRYPT_COST = 12;

async function main(): Promise<void> {
  const env = loadOwnerSeedEnv();
  const prisma = createPrismaClient(env.DATABASE_URL);

  try {
    await seedFoundation(prisma);
    console.log("✔ Branches, business settings and default skills are in place.");

    const email = env.SEED_OWNER_EMAIL.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      console.log(`• Account ${email} already exists (role ${existing.role}); left unchanged.`);
    } else {
      await prisma.user.create({
        data: {
          email,
          phone: env.SEED_OWNER_PHONE ?? null,
          fullName: env.SEED_OWNER_NAME,
          role: "OWNER",
          passwordHash: await bcrypt.hash(env.SEED_OWNER_PASSWORD, BCRYPT_COST),
          // The bootstrap password lives in an env file, so it must be replaced at first login.
          mustChangePassword: true,
        },
      });
      console.log(
        `✔ Created OWNER account ${email}. The password must be changed at first sign-in.`,
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err: unknown) => {
  console.error("Seed failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
