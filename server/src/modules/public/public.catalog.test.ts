import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "../../lib/prisma.js";
import { createTestApp } from "../../test/helpers.js";

/** A fake Prisma client that records queries and returns canned rows. */
function fakePrisma(overrides: Record<string, unknown> = {}) {
  const fake = {
    package: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
    },
    branch: { findMany: vi.fn().mockResolvedValue([]), findFirst: vi.fn().mockResolvedValue(null) },
    businessSetting: { findMany: vi.fn().mockResolvedValue([]) },
    rtaService: { findMany: vi.fn().mockResolvedValue([]) },
    review: { findMany: vi.fn().mockResolvedValue([]) },
    enquiry: { findFirst: vi.fn().mockResolvedValue(null), create: vi.fn().mockResolvedValue({}) },
    ...overrides,
  };
  return { fake, prisma: fake as unknown as PrismaClient };
}

const selectKeys = (mock: ReturnType<typeof vi.fn>) =>
  Object.keys((mock.mock.calls[0]?.[0] as { select: object }).select).sort();

/** Fields that must never reach the public site. */
const INTERNAL_FIELDS = [
  "id",
  "status",
  "createdAt",
  "updatedAt",
  "deletedAt",
  "displayOrder",
  "notes",
  "isActive",
];

const PACKAGE_ROW = {
  name: "Sample Plan",
  slug: "sample-plan",
  description: "A sample.",
  pricePaise: 500000,
  lessonCount: 10,
  lessonDurationMinutes: 45,
  vehicleType: "CAR",
  validityDays: 90,
  features: ["One", "Two"],
};

describe("GET /api/v1/public/packages", () => {
  it("returns only ACTIVE, non-deleted packages, in display order", async () => {
    const { fake, prisma } = fakePrisma();
    fake.package.findMany.mockResolvedValue([PACKAGE_ROW]);
    const res = await request(createTestApp({ prisma })).get("/api/v1/public/packages");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: [PACKAGE_ROW] });
    const query = fake.package.findMany.mock.calls[0]?.[0] as { where: unknown; orderBy: unknown };
    expect(query.where).toEqual({ status: "ACTIVE", deletedAt: null });
    expect(query.orderBy).toEqual([{ displayOrder: "asc" }, { name: "asc" }]);
  });

  it("selects only public display fields (an allow-list, so nothing internal is read)", async () => {
    const { fake, prisma } = fakePrisma();
    await request(createTestApp({ prisma })).get("/api/v1/public/packages");
    const keys = selectKeys(fake.package.findMany);
    expect(keys).toEqual(
      [
        "description",
        "features",
        "lessonCount",
        "lessonDurationMinutes",
        "name",
        "pricePaise",
        "slug",
        "validityDays",
        "vehicleType",
      ].sort(),
    );
    for (const field of INTERNAL_FIELDS) expect(keys).not.toContain(field);
  });

  it("returns an empty list, never fake packages, when none are active", async () => {
    const { prisma } = fakePrisma();
    const res = await request(createTestApp({ prisma })).get("/api/v1/public/packages");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: [] });
  });

  it("is cacheable briefly", async () => {
    const { prisma } = fakePrisma();
    const res = await request(createTestApp({ prisma })).get("/api/v1/public/packages");
    expect(res.headers["cache-control"]).toMatch(/public, max-age=60/);
  });
});

describe("GET /api/v1/public/packages/:slug", () => {
  it("returns the package when it is ACTIVE", async () => {
    const { fake, prisma } = fakePrisma();
    fake.package.findFirst.mockResolvedValue(PACKAGE_ROW);
    const res = await request(createTestApp({ prisma })).get("/api/v1/public/packages/sample-plan");
    expect(res.status).toBe(200);
    expect(res.body.data.slug).toBe("sample-plan");
    const query = fake.package.findFirst.mock.calls[0]?.[0] as { where: unknown };
    expect(query.where).toEqual({ status: "ACTIVE", deletedAt: null, slug: "sample-plan" });
  });

  it("returns 404 in the standard envelope for a missing, draft or archived package", async () => {
    const { prisma } = fakePrisma();
    const res = await request(createTestApp({ prisma })).get("/api/v1/public/packages/nope");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it.each(["Bad_Slug", "has space", "UPPER", "a--b--"])(
    "rejects the malformed slug %j with 400",
    async (slug) => {
      const { fake, prisma } = fakePrisma();
      const res = await request(createTestApp({ prisma })).get(
        `/api/v1/public/packages/${encodeURIComponent(slug)}`,
      );
      expect(res.status).toBe(400);
      expect(fake.package.findFirst).not.toHaveBeenCalled();
    },
  );
});

describe("GET /api/v1/public/branches", () => {
  it("returns active branches with public fields only", async () => {
    const { fake, prisma } = fakePrisma();
    const rows = [
      { name: "Kondapur", slug: "kondapur", address: "Line 1\nLine 2", phone: null, mapUrl: null },
      { name: "Hafeezpet", slug: "hafeezpet", address: null, phone: null, mapUrl: null },
    ];
    fake.branch.findMany.mockResolvedValue(rows);
    const res = await request(createTestApp({ prisma })).get("/api/v1/public/branches");

    expect(res.body).toEqual({ data: rows });
    expect((fake.branch.findMany.mock.calls[0]?.[0] as { where: unknown }).where).toEqual({
      isActive: true,
    });
    const keys = selectKeys(fake.branch.findMany);
    expect(keys).toEqual(["address", "mapUrl", "name", "phone", "slug"]);
  });

  it("does not invent an address for a branch that has none", async () => {
    const { fake, prisma } = fakePrisma();
    fake.branch.findMany.mockResolvedValue([
      { name: "Hafeezpet", slug: "hafeezpet", address: null, phone: null, mapUrl: null },
    ]);
    const res = await request(createTestApp({ prisma })).get("/api/v1/public/branches");
    expect(res.body.data[0].address).toBeNull();
  });
});

describe("GET /api/v1/public/settings", () => {
  it("returns only settings marked public, as a flat key/value object", async () => {
    const { fake, prisma } = fakePrisma();
    fake.businessSetting.findMany.mockResolvedValue([
      { key: "business.name", value: "Sri Sai Balaji Driving School" },
      { key: "business.email", value: null },
    ]);
    const res = await request(createTestApp({ prisma })).get("/api/v1/public/settings");

    expect(res.body).toEqual({
      data: { "business.name": "Sri Sai Balaji Driving School", "business.email": null },
    });
    const query = fake.businessSetting.findMany.mock.calls[0]?.[0] as {
      where: unknown;
      select: object;
    };
    expect(query.where).toEqual({ isPublic: true });
    expect(Object.keys(query.select).sort()).toEqual(["key", "value"]);
  });

  it("returns an empty object when nothing is public", async () => {
    const { prisma } = fakePrisma();
    const res = await request(createTestApp({ prisma })).get("/api/v1/public/settings");
    expect(res.body).toEqual({ data: {} });
  });
});

describe("GET /api/v1/public/rta-services", () => {
  it("returns only ACTIVE services and exposes only display fields", async () => {
    const { fake, prisma } = fakePrisma();
    fake.rtaService.findMany.mockResolvedValue([
      {
        name: "Example",
        slug: "example",
        description: null,
        pricePaise: null,
        requiredDocuments: [],
      },
    ]);
    const res = await request(createTestApp({ prisma })).get("/api/v1/public/rta-services");
    expect(res.status).toBe(200);
    expect((fake.rtaService.findMany.mock.calls[0]?.[0] as { where: unknown }).where).toEqual({
      status: "ACTIVE",
      deletedAt: null,
    });
    expect(selectKeys(fake.rtaService.findMany)).toEqual([
      "description",
      "name",
      "pricePaise",
      "requiredDocuments",
      "slug",
    ]);
  });

  it("returns an empty list, not an invented service list, when the owner has added none", async () => {
    const { prisma } = fakePrisma();
    const res = await request(createTestApp({ prisma })).get("/api/v1/public/rta-services");
    expect(res.body).toEqual({ data: [] });
  });
});

describe("GET /api/v1/public/reviews", () => {
  it("returns only APPROVED reviews with author, rating and text", async () => {
    const { fake, prisma } = fakePrisma();
    fake.review.findMany.mockResolvedValue([
      { authorName: "A. Student", rating: 5, body: "Good." },
    ]);
    const res = await request(createTestApp({ prisma })).get("/api/v1/public/reviews");

    expect(res.body).toEqual({ data: [{ authorName: "A. Student", rating: 5, body: "Good." }] });
    const query = fake.review.findMany.mock.calls[0]?.[0] as { where: unknown; take: number };
    expect(query.where).toEqual({ status: "APPROVED" });
    expect(query.take).toBeLessThanOrEqual(50);
    expect(selectKeys(fake.review.findMany)).toEqual(["authorName", "body", "rating"]);
  });

  it("returns an empty list, never fabricated reviews, when none are approved", async () => {
    const { prisma } = fakePrisma();
    const res = await request(createTestApp({ prisma })).get("/api/v1/public/reviews");
    expect(res.body).toEqual({ data: [] });
  });
});

describe("public API failure behaviour", () => {
  it("reports a database failure as a generic 500 with no internals", async () => {
    const { fake, prisma } = fakePrisma();
    fake.package.findMany.mockRejectedValue(
      new Error("connect ECONNREFUSED 127.0.0.1:5432 user=srisaibalaji"),
    );
    const res = await request(createTestApp({ prisma })).get("/api/v1/public/packages");
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("INTERNAL_ERROR");
    expect(JSON.stringify(res.body)).not.toMatch(/ECONNREFUSED|5432|srisaibalaji/);
  });
});
