import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "../../lib/prisma.js";
import { createTestApp, testEnv } from "../../test/helpers.js";

const prismaWithSlugs = (slugs: string[] | Error) => {
  const findMany = vi.fn(() =>
    slugs instanceof Error
      ? Promise.reject(slugs)
      : Promise.resolve(slugs.map((slug) => ({ slug }))),
  );
  return { findMany, prisma: { package: { findMany } } as unknown as PrismaClient };
};

const env = testEnv({ CLIENT_URL: "https://www.example.org/" });

describe("GET /robots.txt", () => {
  it("allows the public site, blocks private areas and points at the sitemap on the configured origin", async () => {
    const { prisma } = prismaWithSlugs([]);
    const res = await request(createTestApp({ prisma, env })).get("/robots.txt");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/plain/);
    expect(res.text).toContain("Allow: /");
    for (const path of ["/admin", "/student", "/instructor", "/auth", "/api/"]) {
      expect(res.text).toContain(`Disallow: ${path}`);
    }
    expect(res.text).toContain("Sitemap: https://www.example.org/sitemap.xml");
  });
});

describe("GET /sitemap.xml", () => {
  it("lists the public pages and one URL per ACTIVE package, using clean URLs on the configured origin", async () => {
    const { findMany, prisma } = prismaWithSlugs(["beginner-plan", "refresher"]);
    const res = await request(createTestApp({ prisma, env })).get("/sitemap.xml");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/application\/xml/);
    for (const path of [
      "/",
      "/about",
      "/courses",
      "/packages",
      "/rta-services",
      "/contact",
      "/book",
      "/faq",
      "/reviews",
    ]) {
      expect(res.text).toContain(`<loc>https://www.example.org${path}</loc>`);
    }
    expect(res.text).toContain("<loc>https://www.example.org/packages/beginner-plan</loc>");
    expect(res.text).toContain("<loc>https://www.example.org/packages/refresher</loc>");
    expect((findMany.mock.calls[0] as unknown as [{ where: unknown }])[0].where).toEqual({
      status: "ACTIVE",
      deletedAt: null,
    });
  });

  it("never lists private areas", async () => {
    const { prisma } = prismaWithSlugs([]);
    const res = await request(createTestApp({ prisma, env })).get("/sitemap.xml");
    expect(res.text).not.toMatch(/\/admin|\/student|\/instructor|\/auth|\/api\//);
  });

  it("still serves the static pages when the database is down", async () => {
    const { prisma } = prismaWithSlugs(new Error("db down"));
    const res = await request(createTestApp({ prisma, env })).get("/sitemap.xml");
    expect(res.status).toBe(200);
    expect(res.text).toContain("<loc>https://www.example.org/contact</loc>");
  });
});
