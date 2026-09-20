import { createApp } from "./app.js";
import { EnvValidationError, loadEnv, type Env } from "./config/env.js";
import { startNotificationWorker } from "./jobs/worker.js";
import { createLogger } from "./lib/logger.js";
import { createPrismaClient } from "./lib/prisma.js";
import { createServices } from "./services.js";

function readEnvOrExit(): Env {
  try {
    return loadEnv();
  } catch (err) {
    if (err instanceof EnvValidationError) {
      // The logger needs a valid env, so report configuration problems directly and stop.
      console.error(err.message);
      console.error("\nSee server/.env.example for the required variables.");
      process.exit(1);
    }
    throw err;
  }
}

const env = readEnvOrExit();
const logger = createLogger(env);
const prisma = createPrismaClient(env.DATABASE_URL);
const services = createServices({ env, logger, prisma });
const app = createApp({ env, logger, prisma, services });

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, nodeEnv: env.NODE_ENV }, "API listening");
});

// Say plainly how email is configured, so nobody assumes messages are being delivered when they are not.
if (services.emailProvider.deliversMail) {
  logger.info({ provider: services.emailProvider.name }, "Email delivery is enabled (SMTP)");
} else {
  logger.warn("Email is in DEVELOPMENT mode: messages are written to this log and NOT sent");
}
if (!env.OWNER_NOTIFICATION_EMAIL) {
  logger.warn(
    "OWNER_NOTIFICATION_EMAIL is not set: the owner will NOT be emailed about new enquiries",
  );
}

const stopWorker = startNotificationWorker(services.notifications, logger);

function shutdown(signal: string): void {
  logger.info({ signal }, "Shutting down");
  stopWorker();
  // Give in-flight requests a chance to finish, but never hang forever.
  setTimeout(() => process.exit(1), 10_000).unref();
  server.close(() => {
    prisma
      .$disconnect()
      .catch((err: unknown) => logger.error({ err }, "Error while disconnecting Prisma"))
      .finally(() => process.exit(0));
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "Unhandled promise rejection");
});
process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught exception; exiting");
  process.exit(1);
});
