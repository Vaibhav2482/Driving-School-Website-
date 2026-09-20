import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

/**
 * Create a Prisma client. Prisma 7 requires a driver adapter; we use the official `pg` adapter.
 * The connection is opened lazily, so constructing a client never touches the database.
 */
export function createPrismaClient(databaseUrl: string): PrismaClient {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
}

export type { PrismaClient };
