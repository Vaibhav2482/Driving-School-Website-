import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "../../lib/prisma.js";
import { addDaysIso, todayInTimeZone } from "../../lib/time.js";
import { createTestApp, testEnv } from "../../test/helpers.js";

const URL = "/api/v1/public/enquiries";
const TZ = "Asia/Kolkata";

function fakePrisma() {
  const fake = {
    enquiry: { findFirst: vi.fn().mockResolvedValue(null), create: vi.fn().mockResolvedValue({}) },
    package: { findFirst: vi.fn().mockResolvedValue(null) },
    branch: { findFirst: vi.fn().mockResolvedValue(null) },
  };
  return { fake, prisma: fake as unknown as PrismaClient };
}

const valid = { fullName: "Asha Reddy", phone: "96661 46913", consent: true };

const createdData = (fake: ReturnType<typeof fakePrisma>["fake"]) =>
  (fake.enquiry.create.mock.calls[0]?.[0] as { data: Record<string, unknown> }).data;

const paths = (res: request.Response) =>
  (res.body.error.details as { path: string }[]).map((d) => d.path);

describe("POST /api/v1/public/enquiries: success", () => {
  it("creates an enquiry and answers with a minimal confirmation (no ids, no echo)", async () => {
    const { fake, prisma } = fakePrisma();
    const res = await request(createTestApp({ prisma })).post(URL).send(valid);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ data: { received: true } });
    expect(fake.enquiry.create).toHaveBeenCalledOnce();
  });

  it("normalises the phone number to E.164 and records consent with a timestamp", async () => {
    const { fake, prisma } = fakePrisma();
    const before = Date.now();
    await request(createTestApp({ prisma })).post(URL).send(valid);
    const data = createdData(fake);

    expect(data.phone).toBe("+919666146913");
    expect(data.consentGivenAt).toBeInstanceOf(Date);
    expect((data.consentGivenAt as Date).getTime()).toBeGreaterThanOrEqual(before);
    expect(data.source).toBe("WEBSITE");
  });

  it.each([
    "9666146913",
    "96661 46913",
    "+91 96661 46913",
    "+91-9666146913",
    "919666146913",
    "09666146913",
    "(96661) 46913",
  ])("accepts the phone format %j", async (phone) => {
    const { fake, prisma } = fakePrisma();
    const res = await request(createTestApp({ prisma }))
      .post(URL)
      .send({ ...valid, phone });
    expect(res.status).toBe(201);
    expect(createdData(fake).phone).toBe("+919666146913");
  });

  it("strips HTML and control characters and collapses whitespace in text fields", async () => {
    const { fake, prisma } = fakePrisma();
    await request(createTestApp({ prisma }))
      .post(URL)
      .send({
        ...valid,
        fullName: "  <b>Asha</b>   Reddy\u0000 ",
        message: "Hello <script>alert(1)</script>\r\n\r\n\r\n\r\nWorld",
        pickupAddress: "  Flat 4,\n  Kondapur  ",
      });
    const data = createdData(fake);
    expect(data.fullName).toBe("Asha Reddy");
    expect(data.message).toBe("Hello alert(1)\n\nWorld");
    expect(data.pickupAddress).toBe("Flat 4,\nKondapur");
    expect(data.pickupRequested).toBe(true);
  });

  it("stores optional fields as null when they are not provided", async () => {
    const { fake, prisma } = fakePrisma();
    await request(createTestApp({ prisma })).post(URL).send(valid);
    expect(createdData(fake)).toMatchObject({
      packageId: null,
      preferredBranchId: null,
      preferredDate: null,
      preferredTimeWindow: null,
      pickupRequested: false,
      pickupAddress: null,
      message: null,
    });
  });

  it("treats empty strings from an HTML form as 'not provided'", async () => {
    const { fake, prisma } = fakePrisma();
    const res = await request(createTestApp({ prisma }))
      .post(URL)
      .send({
        ...valid,
        packageSlug: "",
        preferredBranchSlug: "",
        preferredDate: "",
        pickupAddress: "  ",
        message: "",
      });
    expect(res.status).toBe(201);
    expect(createdData(fake).preferredDate).toBeNull();
  });

  it("links a valid, active package and branch by slug", async () => {
    const { fake, prisma } = fakePrisma();
    fake.package.findFirst.mockResolvedValue({ id: "pkg-1" });
    fake.branch.findFirst.mockResolvedValue({ id: "branch-1" });
    await request(createTestApp({ prisma }))
      .post(URL)
      .send({ ...valid, packageSlug: "sample-plan", preferredBranchSlug: "kondapur" });

    expect(createdData(fake)).toMatchObject({ packageId: "pkg-1", preferredBranchId: "branch-1" });
    expect((fake.package.findFirst.mock.calls[0]?.[0] as { where: unknown }).where).toEqual({
      slug: "sample-plan",
      status: "ACTIVE",
      deletedAt: null,
    });
  });

  it("still saves the lead when the chosen package no longer exists (never lose a lead)", async () => {
    const { fake, prisma } = fakePrisma();
    const res = await request(createTestApp({ prisma }))
      .post(URL)
      .send({ ...valid, packageSlug: "archived-plan" });
    expect(res.status).toBe(201);
    expect(createdData(fake).packageId).toBeNull();
  });

  it("stores a preferred date as a calendar date and a time window", async () => {
    const { fake, prisma } = fakePrisma();
    const date = addDaysIso(todayInTimeZone(TZ), 3);
    await request(createTestApp({ prisma }))
      .post(URL)
      .send({ ...valid, preferredDate: date, preferredTimeWindow: "MORNING" });
    const data = createdData(fake);
    expect((data.preferredDate as Date).toISOString()).toBe(`${date}T00:00:00.000Z`);
    expect(data.preferredTimeWindow).toBe("MORNING");
  });

  it("ignores unknown fields, so a client cannot set status, ids or internal notes", async () => {
    const { fake, prisma } = fakePrisma();
    await request(createTestApp({ prisma }))
      .post(URL)
      .send({
        ...valid,
        status: "CONVERTED",
        id: "x",
        internalNotes: "hax",
        source: "PHONE",
        convertedStudentId: "y",
      });
    const data = createdData(fake);
    for (const key of ["status", "id", "internalNotes", "convertedStudentId"])
      expect(data).not.toHaveProperty(key);
    expect(data.source).toBe("WEBSITE");
  });

  it("accepts today's date in the business time zone", async () => {
    const { prisma } = fakePrisma();
    const res = await request(createTestApp({ prisma }))
      .post(URL)
      .send({ ...valid, preferredDate: todayInTimeZone(TZ) });
    expect(res.status).toBe(201);
  });
});

describe("POST /api/v1/public/enquiries: validation", () => {
  it("requires name, phone and consent, reporting every problem at once", async () => {
    const { fake, prisma } = fakePrisma();
    const res = await request(createTestApp({ prisma })).post(URL).send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(paths(res).sort()).toEqual(["body.consent", "body.fullName", "body.phone"]);
    expect(fake.enquiry.create).not.toHaveBeenCalled();
  });

  it.each([false, "true", "yes", 1, null])(
    "rejects consent value %j: consent must be exactly true",
    async (consent) => {
      const { fake, prisma } = fakePrisma();
      const res = await request(createTestApp({ prisma }))
        .post(URL)
        .send({ ...valid, consent });
      expect(res.status).toBe(400);
      expect(paths(res)).toContain("body.consent");
      expect(fake.enquiry.create).not.toHaveBeenCalled();
    },
  );

  it("does not store anything when consent is missing", async () => {
    const { fake, prisma } = fakePrisma();
    await request(createTestApp({ prisma }))
      .post(URL)
      .send({ fullName: valid.fullName, phone: valid.phone });
    expect(fake.enquiry.create).not.toHaveBeenCalled();
  });

  it.each(["12345", "5666146913", "96661", "abcdefghij", "9666146913999", "+1 415 555 0100"])(
    "rejects the invalid phone number %j",
    async (phone) => {
      const { prisma } = fakePrisma();
      const res = await request(createTestApp({ prisma }))
        .post(URL)
        .send({ ...valid, phone });
      expect(res.status).toBe(400);
      expect(paths(res)).toContain("body.phone");
    },
  );

  it.each(["", " ", "A", "12345", "<b></b>"])("rejects the invalid name %j", async (fullName) => {
    const { prisma } = fakePrisma();
    const res = await request(createTestApp({ prisma }))
      .post(URL)
      .send({ ...valid, fullName });
    expect(res.status).toBe(400);
    expect(paths(res)).toContain("body.fullName");
  });

  it("rejects a date in the past, an impossible date, a bad format and a date too far ahead", async () => {
    const { prisma } = fakePrisma();
    const app = createTestApp({ prisma });
    const today = todayInTimeZone(TZ);
    for (const preferredDate of [
      addDaysIso(today, -1),
      "2026-02-30",
      "20-09-2026",
      "tomorrow",
      addDaysIso(today, 400),
    ]) {
      const res = await request(app)
        .post(URL)
        .send({ ...valid, preferredDate });
      expect(res.status, preferredDate).toBe(400);
      expect(paths(res)).toContain("body.preferredDate");
    }
  });

  it("rejects an unknown time window and malformed slugs", async () => {
    const { prisma } = fakePrisma();
    const app = createTestApp({ prisma });
    expect(
      paths(
        await request(app)
          .post(URL)
          .send({ ...valid, preferredTimeWindow: "NIGHT" }),
      ),
    ).toContain("body.preferredTimeWindow");
    expect(
      paths(
        await request(app)
          .post(URL)
          .send({ ...valid, packageSlug: "Bad Slug!" }),
      ),
    ).toContain("body.packageSlug");
  });

  it("enforces maximum lengths", async () => {
    const { prisma } = fakePrisma();
    const res = await request(createTestApp({ prisma }))
      .post(URL)
      .send({
        ...valid,
        fullName: "A".repeat(101),
        message: "x".repeat(1001),
        pickupAddress: "y".repeat(301),
      });
    expect(res.status).toBe(400);
    expect(paths(res).sort()).toEqual(["body.fullName", "body.message", "body.pickupAddress"]);
  });

  it("rejects non-string values for text fields instead of crashing", async () => {
    const { prisma } = fakePrisma();
    const res = await request(createTestApp({ prisma }))
      .post(URL)
      .send({ ...valid, fullName: { $ne: null }, message: ["a"], phone: 9666146913 });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/v1/public/enquiries: honeypot", () => {
  it("discards a submission whose hidden field is filled, but answers with the normal success response", async () => {
    const { fake, prisma } = fakePrisma();
    const res = await request(createTestApp({ prisma }))
      .post(URL)
      .send({ ...valid, website: "http://spam.example" });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ data: { received: true } });
    expect(fake.enquiry.create).not.toHaveBeenCalled();
    expect(fake.enquiry.findFirst).not.toHaveBeenCalled();
  });

  it("discards it even when the rest of the payload is invalid (bots send junk)", async () => {
    const { fake, prisma } = fakePrisma();
    const res = await request(createTestApp({ prisma })).post(URL).send({ website: "x" });
    expect(res.status).toBe(201);
    expect(fake.enquiry.create).not.toHaveBeenCalled();
  });

  it("accepts a real submission whose hidden field is empty", async () => {
    const { fake, prisma } = fakePrisma();
    const res = await request(createTestApp({ prisma }))
      .post(URL)
      .send({ ...valid, website: "" });
    expect(res.status).toBe(201);
    expect(fake.enquiry.create).toHaveBeenCalledOnce();
  });
});

describe("POST /api/v1/public/enquiries: abuse protection", () => {
  it("rate limits repeated submissions from one client with 429 RATE_LIMITED", async () => {
    const { fake, prisma } = fakePrisma();
    const app = createTestApp({ prisma, env: testEnv({ ENQUIRY_RATE_LIMIT_MAX: "3" }) });

    const statuses: number[] = [];
    for (let i = 0; i < 5; i++) {
      // A different number each time, so de-duplication does not mask the rate limit.
      const res = await request(app)
        .post(URL)
        .send({ ...valid, phone: `96661 4691${i}` });
      statuses.push(res.status);
      if (res.status === 429) expect(res.body.error.code).toBe("RATE_LIMITED");
    }
    expect(statuses).toEqual([201, 201, 201, 429, 429]);
    expect(fake.enquiry.create).toHaveBeenCalledTimes(3);
  });

  it("counts honeypot submissions against the limit too", async () => {
    const { prisma } = fakePrisma();
    const app = createTestApp({ prisma, env: testEnv({ ENQUIRY_RATE_LIMIT_MAX: "2" }) });
    await request(app).post(URL).send({ website: "x" });
    await request(app).post(URL).send({ website: "x" });
    expect((await request(app).post(URL).send({ website: "x" })).status).toBe(429);
  });

  it("treats a repeat submission from the same number within minutes as one lead", async () => {
    const { fake, prisma } = fakePrisma();
    fake.enquiry.findFirst.mockResolvedValue({ id: "existing" });
    const res = await request(createTestApp({ prisma })).post(URL).send(valid);
    expect(res.status).toBe(201);
    expect(fake.enquiry.create).not.toHaveBeenCalled();
    const where = (fake.enquiry.findFirst.mock.calls[0]?.[0] as { where: { phone: string } }).where;
    expect(where.phone).toBe("+919666146913");
  });

  it("does not leak database details when saving fails", async () => {
    const { fake, prisma } = fakePrisma();
    fake.enquiry.create.mockRejectedValue(
      new Error('relation "Enquiry" does not exist (user=srisaibalaji)'),
    );
    const res = await request(createTestApp({ prisma })).post(URL).send(valid);
    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toMatch(/relation|srisaibalaji|Enquiry/);
  });
});
