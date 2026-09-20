import type { Logger } from "pino";
import type { NotificationService } from "../modules/notifications/notification.service.js";

/**
 * Background worker: every minute, retry emails that are due (failed earlier, or queued while the
 * process was down). Runs inside the API process; there is deliberately no external queue.
 * Returns a function that stops it.
 */
export function startNotificationWorker(
  notifications: Pick<NotificationService, "dispatchDue">,
  logger: Logger,
  intervalMs = 60_000,
): () => void {
  let running = false;

  const tick = async () => {
    if (running) return; // never overlap runs
    running = true;
    try {
      const attempted = await notifications.dispatchDue();
      if (attempted > 0) logger.info({ attempted }, "Notification worker processed due emails");
    } catch (err) {
      logger.error({ err }, "Notification worker run failed");
    } finally {
      running = false;
    }
  };

  const timer = setInterval(() => void tick(), intervalMs);
  timer.unref(); // never keep the process alive just for the worker
  void tick(); // pick up anything left over from before this start
  return () => clearInterval(timer);
}
