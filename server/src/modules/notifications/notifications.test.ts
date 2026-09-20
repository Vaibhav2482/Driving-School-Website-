import { describe, expect, it, vi } from "vitest";
import { startNotificationWorker } from "../../jobs/worker.js";
import { addDaysIso, todayInTimeZone } from "../../lib/time.js";
import { createAuthHarness, type AuthHarness } from "../../test/authHarness.js";
import { capturingLogger } from "../../test/helpers.js";
import { MAX_ATTEMPTS } from "./notification.service.js";
import { renderEnquiryEmail, renderTemplate } from "./templates.js";

const ENQUIRY_URL = "/public/enquiries";

async function seedCatalogue(h: AuthHarness) {
  const pkg = await h.db.package.create({
    data: { name: "Beginner Course", slug: "beginner-course", status: "ACTIVE", deletedAt: null },
  });
  const branch = await h.db.branch.create({ data: { name: "Hafeezpet", slug: "hafeezpet" } });
  return { pkg, branch };
}

const fullEnquiry = () => ({
  fullName: "Asha Reddy",
  phone: "96661 46913",
  packageSlug: "beginner-course",
  preferredBranchSlug: "hafeezpet",
  preferredDate: addDaysIso(todayInTimeZone("Asia/Kolkata"), 3),
  preferredTimeWindow: "MORNING",
  pickupAddress: "Flat 4, Kondapur",
  message: "Please call after 6pm.",
  consent: true,
});

describe("enquiry → owner notification (outbox)", () => {
  it("stores the enquiry, queues a notification for the owner, and answers the visitor immediately", async () => {
    const h = createAuthHarness();
    await seedCatalogue(h);

    const res = await h.api.post(ENQUIRY_URL).send(fullEnquiry());

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ data: { received: true } });
    expect(h.db.enquiry.rows).toHaveLength(1);

    // Queued but not yet sent: sending happens after the response, in the background.
    expect(h.db.notification.rows).toHaveLength(1);
    const row = h.db.notification.rows[0]!;
    expect(row).toMatchObject({
      channel: "EMAIL",
      template: "enquiry.new",
      status: "PENDING",
      recipient: "owner@example.test",
    });
    expect(h.sent).toHaveLength(0);
    expect(h.scheduled).toHaveLength(1);

    await h.flush();
    expect(h.db.notification.rows[0]!.status).toBe("SENT");
    expect(h.db.notification.rows[0]!.sentAt).toBeInstanceOf(Date);
    expect(h.sent).toHaveLength(1);
  });

  it("sends a clean email with the requested subject and fields", async () => {
    const h = createAuthHarness();
    await seedCatalogue(h);
    await h.api.post(ENQUIRY_URL).send(fullEnquiry());
    await h.flush();

    const mail = h.sent[0]!;
    expect(mail.to).toBe("owner@example.test");
    expect(mail.subject).toBe("New Driving School Enquiry");
    expect(mail.text).toContain("New enquiry received for Sri Sai Balaji Driving School.");
    for (const line of [
      "Name: Asha Reddy",
      "Phone: +919666146913",
      "Preferred Package: Beginner Course",
      "Preferred Branch: Hafeezpet",
      "Preferred Time: Morning",
      "Pickup Address: Flat 4, Kondapur",
      "Message: Please call after 6pm.",
    ]) {
      expect(mail.text).toContain(line);
    }
    expect(mail.text).toMatch(/Preferred Date: \d{1,2} \w+ \d{4}/);
    // 05:00 UTC is 10:30 in India.
    expect(mail.text).toMatch(/Received At: 20 Sep(t)? 2026, 10:30\s?am IST/i);
    expect(mail.html).toContain("Asha Reddy");
    expect(mail.sensitive).toBe(false);
  });

  it("shows 'Not specified' for optional details the visitor left out", async () => {
    const h = createAuthHarness();
    await h.api
      .post(ENQUIRY_URL)
      .send({ fullName: "Asha Reddy", phone: "9666146913", consent: true });
    await h.flush();
    const text = h.sent[0]!.text;
    for (const label of [
      "Preferred Package",
      "Preferred Date",
      "Preferred Time",
      "Pickup Address",
      "Message",
    ]) {
      expect(text).toContain(`${label}: Not specified`);
    }
    expect(text).not.toContain("Preferred Branch"); // only shown when chosen
  });

  it("contains only safe fields: no database ids, no IP address, nothing technical", async () => {
    const h = createAuthHarness();
    const { pkg, branch } = await seedCatalogue(h);
    await h.api.post(ENQUIRY_URL).set("X-Forwarded-For", "203.0.113.77").send(fullEnquiry());
    await h.flush();

    const payload = h.db.notification.rows[0]!.payload as Record<string, unknown>;
    expect(Object.keys(payload).sort()).toEqual(
      [
        "branchName",
        "fullName",
        "message",
        "packageName",
        "phone",
        "pickupAddress",
        "preferredDate",
        "preferredTimeWindow",
        "receivedAt",
      ].sort(),
    );

    const everything = JSON.stringify(payload) + h.sent[0]!.text + h.sent[0]!.html;
    for (const forbidden of [
      pkg.id as string,
      branch.id as string,
      "127.0.0.1",
      "::1",
      "::ffff",
      "203.0.113.77",
      "userAgent",
      "user-agent",
      "supertest",
    ]) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
    expect(everything).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/); // no UUIDs at all
  });

  it("reads the owner's address from configuration (never hard-coded or guessed)", async () => {
    const h = createAuthHarness({ env: { OWNER_NOTIFICATION_EMAIL: "someone.else@example.test" } });
    await h.api
      .post(ENQUIRY_URL)
      .send({ fullName: "Asha Reddy", phone: "9666146913", consent: true });
    await h.flush();
    expect(h.sent[0]!.to).toBe("someone.else@example.test");
    expect(h.db.notification.rows[0]!.recipient).toBe("someone.else@example.test");
  });

  it("skips the email, loudly, when no owner address is configured, and still saves the enquiry", async () => {
    const { logger, lines } = capturingLogger();
    const h = createAuthHarness({ env: { OWNER_NOTIFICATION_EMAIL: "" }, logger });
    const res = await h.api
      .post(ENQUIRY_URL)
      .send({ fullName: "Asha Reddy", phone: "9666146913", consent: true });
    expect(res.status).toBe(201);
    expect(h.db.enquiry.rows).toHaveLength(1);
    expect(h.db.notification.rows).toHaveLength(0);
    expect(JSON.stringify(lines)).toContain("OWNER_NOTIFICATION_EMAIL is not set");
  });

  it("does not email for a duplicate submission, an invalid one, or a honeypot hit", async () => {
    const h = createAuthHarness();
    const body = { fullName: "Asha Reddy", phone: "9666146913", consent: true };
    await h.api.post(ENQUIRY_URL).send(body);
    await h.api.post(ENQUIRY_URL).send(body); // double-click
    await h.api.post(ENQUIRY_URL).send({ fullName: "x" }); // invalid
    await h.api.post(ENQUIRY_URL).send({ ...body, phone: "9000574542", website: "http://spam" }); // bot
    await h.flush();
    expect(h.db.enquiry.rows).toHaveLength(1);
    expect(h.sent).toHaveLength(1);
  });

  it("escapes visitor-supplied text in the HTML email", () => {
    const { html } = renderEnquiryEmail(
      {
        fullName: "<script>alert(1)</script>",
        phone: "+919666146913",
        message: "a & b < c",
        receivedAt: "2026-09-20T05:00:00.000Z",
      },
      { timeZone: "Asia/Kolkata" },
    );
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("a &amp; b &lt; c");
  });
});

describe("email failure never fails the customer's enquiry", () => {
  it("returns success, keeps the enquiry, records the failure and schedules a retry", async () => {
    const h = createAuthHarness();
    h.mail.fail = true;

    const res = await h.api
      .post(ENQUIRY_URL)
      .send({ fullName: "Asha Reddy", phone: "9666146913", consent: true });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ data: { received: true } }); // no mention of email
    expect(JSON.stringify(res.body)).not.toMatch(/mail|smtp|fail/i);
    expect(h.db.enquiry.rows).toHaveLength(1);

    await h.flush();
    const row = h.db.notification.rows[0]!;
    expect(row.status).toBe("PENDING"); // marked for retry, not lost
    expect(row.attempts).toBe(1);
    expect(row.lastError).toContain("SMTP connection refused");
    expect((row.scheduledFor as Date).getTime()).toBeGreaterThan(h.clock.now().getTime()); // backed off
  });

  it("delivers on retry once the mail server recovers", async () => {
    const h = createAuthHarness();
    h.mail.fail = true;
    await h.api
      .post(ENQUIRY_URL)
      .send({ fullName: "Asha Reddy", phone: "9666146913", consent: true });
    await h.flush();
    expect(h.sent).toHaveLength(0);

    h.mail.fail = false;
    expect(await h.notifications.dispatchDue()).toBe(0); // not due yet
    h.clock.advance(2 * 60_000);
    expect(await h.notifications.dispatchDue()).toBe(1);
    expect(h.sent).toHaveLength(1);
    expect(h.db.notification.rows[0]!.status).toBe("SENT");
    expect(h.db.notification.rows[0]!.lastError).toBeNull();
  });

  it(`gives up after ${MAX_ATTEMPTS} attempts and marks the notification FAILED for a person to look at`, async () => {
    const h = createAuthHarness();
    h.mail.fail = true;
    await h.api
      .post(ENQUIRY_URL)
      .send({ fullName: "Asha Reddy", phone: "9666146913", consent: true });
    await h.flush();
    for (let i = 1; i < MAX_ATTEMPTS; i++) {
      h.clock.advance(2 * 60 * 60_000);
      await h.notifications.dispatchDue();
    }
    const row = h.db.notification.rows[0]!;
    expect(row.attempts).toBe(MAX_ATTEMPTS);
    expect(row.status).toBe("FAILED");
    h.clock.advance(24 * 60 * 60_000);
    expect(await h.notifications.dispatchDue()).toBe(0); // no more retries
  });

  it("does not send the same email twice when two workers race for it", async () => {
    const h = createAuthHarness();
    await h.api
      .post(ENQUIRY_URL)
      .send({ fullName: "Asha Reddy", phone: "9666146913", consent: true });
    const id = h.db.notification.rows[0]!.id as string;
    const results = await Promise.all([
      h.notifications.dispatchOne(id),
      h.notifications.dispatchOne(id),
      h.notifications.dispatchOne(id),
    ]);
    expect(results.filter((r) => r === "sent")).toHaveLength(1);
    expect(h.sent).toHaveLength(1);
  });

  it("removes SMTP credentials from stored error text and logs", async () => {
    const { logger, lines } = capturingLogger();
    const h = createAuthHarness({
      logger,
      env: { SMTP_USER: "mailer-user", SMTP_PASSWORD: "hunter2-smtp-secret" },
    });
    h.mail.fail = true;
    h.mail.failWith = "Invalid login for mailer-user using hunter2-smtp-secret";
    await h.api
      .post(ENQUIRY_URL)
      .send({ fullName: "Asha Reddy", phone: "9666146913", consent: true });
    await h.flush();
    const stored = String(h.db.notification.rows[0]!.lastError);
    expect(stored).not.toContain("hunter2-smtp-secret");
    expect(stored).not.toContain("mailer-user");
    expect(JSON.stringify(lines)).not.toContain("hunter2-smtp-secret");
  });

  it("a failure while queueing the notification still does not fail the enquiry", async () => {
    const h = createAuthHarness();
    h.db.notification.create = () => Promise.reject(new Error("outbox table unavailable"));
    const res = await h.api
      .post(ENQUIRY_URL)
      .send({ fullName: "Asha Reddy", phone: "9666146913", consent: true });
    expect(res.status).toBe(201);
    expect(h.db.enquiry.rows).toHaveLength(1);
  });
});

describe("safety: test mail never reaches real customers", () => {
  it("outside production, real SMTP delivery is limited to OWNER_NOTIFICATION_EMAIL", async () => {
    const h = createAuthHarness({ deliversMail: true });
    const id = await h.notifications.enqueueEmail({
      template: "account.invite",
      recipient: "real.customer@gmail.example",
      payload: { name: "Real Customer", link: "https://x/y?token=abc", validFor: "7 days" },
    });
    expect(await h.notifications.dispatchOne(id)).toBe("failed");
    expect(h.sent).toHaveLength(0);
    const row = h.db.notification.rows[0]!;
    expect(row.status).toBe("FAILED");
    expect(String(row.lastError)).toMatch(/only sent to OWNER_NOTIFICATION_EMAIL/);
    expect(row.payload).toEqual({ scrubbed: true }); // the link is wiped
  });

  it("still delivers the owner's own enquiry emails when real SMTP is on", async () => {
    const h = createAuthHarness({ deliversMail: true });
    await h.api
      .post(ENQUIRY_URL)
      .send({ fullName: "Asha Reddy", phone: "9666146913", consent: true });
    await h.flush();
    expect(h.sent).toHaveLength(1);
  });

  it("the development log channel never claims to deliver mail", async () => {
    const { createEmailProvider } = await import("../../integrations/email/email-provider.js");
    const { testEnv, silentLogger } = await import("../../test/helpers.js");
    const provider = createEmailProvider(testEnv({}), silentLogger); // no SMTP configured
    expect(provider.name).toBe("development-log");
    expect(provider.deliversMail).toBe(false);
  });
});

describe("templates", () => {
  it("rejects unknown templates instead of sending something wrong", () => {
    expect(() => renderTemplate("nope", {}, { timeZone: "Asia/Kolkata" })).toThrow(
      /Unknown email template/,
    );
  });
});

describe("notification worker", () => {
  it("retries due emails on an interval, never overlaps runs, and stops cleanly", async () => {
    vi.useFakeTimers();
    try {
      let release: () => void = () => undefined;
      const dispatchDue = vi.fn(
        () => new Promise<number>((resolve) => (release = () => resolve(1))),
      );
      const { logger } = capturingLogger();
      const stop = startNotificationWorker({ dispatchDue }, logger, 1000);

      expect(dispatchDue).toHaveBeenCalledTimes(1); // immediately on start
      await vi.advanceTimersByTimeAsync(3000);
      expect(dispatchDue).toHaveBeenCalledTimes(1); // the first run is still going: no overlap

      release();
      await vi.advanceTimersByTimeAsync(1000);
      expect(dispatchDue).toHaveBeenCalledTimes(2);

      stop();
      release();
      await vi.advanceTimersByTimeAsync(5000);
      expect(dispatchDue).toHaveBeenCalledTimes(2); // stopped
    } finally {
      vi.useRealTimers();
    }
  });

  it("survives a failing run", async () => {
    vi.useFakeTimers();
    try {
      const dispatchDue = vi.fn().mockRejectedValueOnce(new Error("db down")).mockResolvedValue(0);
      const { logger, lines } = capturingLogger();
      const stop = startNotificationWorker({ dispatchDue }, logger, 1000);
      await vi.advanceTimersByTimeAsync(2500);
      expect(dispatchDue.mock.calls.length).toBeGreaterThanOrEqual(2);
      expect(JSON.stringify(lines)).toContain("Notification worker run failed");
      stop();
    } finally {
      vi.useRealTimers();
    }
  });
});
