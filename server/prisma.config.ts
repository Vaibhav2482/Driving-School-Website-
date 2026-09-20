import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// Prisma 7 no longer loads .env files itself.
dotenv.config({ quiet: true });

const databaseUrl = process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // `prisma generate` and `prisma validate` work without a database, so the URL is
  // only attached when configured. Migrate commands fail with a clear error if it is missing.
  ...(databaseUrl ? { datasource: { url: databaseUrl } } : {}),
});
