import { Router } from "express";
import type { Logger } from "pino";
import type { Env } from "../../config/env.js";
import type { PrismaClient } from "../../lib/prisma.js";
import { createCatalogService } from "../public/catalog.service.js";

/** Public pages that always exist. Package pages are added from the database. */
const STATIC_PATHS = [
  "/",
  "/about",
  "/courses",
  "/packages",
  "/rta-services",
  "/contact",
  "/book",
  "/faq",
  "/reviews",
];

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export interface SeoDependencies {
  env: Env;
  logger: Logger;
  prisma: PrismaClient;
}

/**
 * `/robots.txt` and `/sitemap.xml`, generated from configuration and data so no domain is hard-coded:
 * URLs are built from CLIENT_URL, and package pages come from the database (ACTIVE packages only).
 * In production the reverse proxy must route these two paths to the API.
 */
export function seoRouter({ env, logger, prisma }: SeoDependencies): Router {
  const catalog = createCatalogService(prisma);
  const origin = env.clientOrigin;
  const router = Router();

  router.get("/robots.txt", (_req, res) => {
    res
      .type("text/plain")
      .set("Cache-Control", "public, max-age=3600")
      .send(
        [
          "User-agent: *",
          "Allow: /",
          "Disallow: /admin",
          "Disallow: /student",
          "Disallow: /instructor",
          "Disallow: /auth",
          "Disallow: /api/",
          "",
          `Sitemap: ${origin}/sitemap.xml`,
          "",
        ].join("\n"),
      );
  });

  router.get("/sitemap.xml", async (req, res) => {
    let slugs: string[] = [];
    try {
      slugs = (await catalog.listPackageSlugs()).map((pkg) => pkg.slug);
    } catch (err) {
      // A database hiccup must not break the sitemap; serve the static pages.
      logger.error({ err, requestId: req.id }, "Could not load package slugs for the sitemap");
    }

    const paths = [...STATIC_PATHS, ...slugs.map((slug) => `/packages/${slug}`)];
    const urls = paths
      .map((path) => `  <url><loc>${escapeXml(origin + path)}</loc></url>`)
      .join("\n");

    res
      .type("application/xml")
      .set("Cache-Control", "public, max-age=3600")
      .send(
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      );
  });

  return router;
}
