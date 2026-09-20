import type { Prisma } from "../../generated/prisma/client.js";
import { AppError } from "../../lib/errors.js";
import type { PrismaClient } from "../../lib/prisma.js";

export type CatalogPrisma = Pick<
  PrismaClient,
  "package" | "branch" | "businessSetting" | "rtaService" | "review"
>;

/*
 * Every query here uses an explicit `select` allow-list, so a field that is not listed is never even
 * read from the database. Nothing internal (ids, timestamps, audit data, notes, status, soft-delete
 * markers) can leak to the public site by accident, and new columns stay private by default.
 */

const packageSelect = {
  name: true,
  slug: true,
  description: true,
  pricePaise: true,
  lessonCount: true,
  lessonDurationMinutes: true,
  vehicleType: true,
  validityDays: true,
  features: true,
} satisfies Prisma.PackageSelect;

const branchSelect = {
  name: true,
  slug: true,
  address: true,
  phone: true,
  mapUrl: true,
} satisfies Prisma.BranchSelect;

const rtaServiceSelect = {
  name: true,
  slug: true,
  description: true,
  pricePaise: true,
  requiredDocuments: true,
} satisfies Prisma.RtaServiceSelect;

const reviewSelect = {
  authorName: true,
  rating: true,
  body: true,
} satisfies Prisma.ReviewSelect;

/** Only these packages are visible publicly. */
const PUBLIC_PACKAGE_WHERE = {
  status: "ACTIVE",
  deletedAt: null,
} satisfies Prisma.PackageWhereInput;
const MAX_PUBLIC_REVIEWS = 24;

/** Read-only catalogue for the public website (packages, branches, settings, RTA services, reviews). */
export function createCatalogService(prisma: CatalogPrisma) {
  return {
    listPackages() {
      return prisma.package.findMany({
        where: PUBLIC_PACKAGE_WHERE,
        orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
        select: packageSelect,
      });
    },

    async getPackage(slug: string) {
      const pkg = await prisma.package.findFirst({
        where: { ...PUBLIC_PACKAGE_WHERE, slug },
        select: packageSelect,
      });
      if (!pkg) throw AppError.notFound("This package could not be found.");
      return pkg;
    },

    listBranches() {
      return prisma.branch.findMany({
        where: { isActive: true },
        orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
        select: branchSelect,
      });
    },

    /** Settings the owner marked public, as a flat `{ key: value }` object. */
    async getSettings(): Promise<Record<string, unknown>> {
      const rows = await prisma.businessSetting.findMany({
        where: { isPublic: true },
        orderBy: { key: "asc" },
        select: { key: true, value: true },
      });
      return Object.fromEntries(rows.map((row) => [row.key, row.value]));
    },

    listRtaServices() {
      return prisma.rtaService.findMany({
        where: { status: "ACTIVE", deletedAt: null },
        orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
        select: rtaServiceSelect,
      });
    },

    /** Approved reviews only. Never fabricated: an empty list is a normal, expected answer. */
    listReviews() {
      return prisma.review.findMany({
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        take: MAX_PUBLIC_REVIEWS,
        select: reviewSelect,
      });
    },

    /** Slugs of public packages, for the sitemap. */
    listPackageSlugs() {
      return prisma.package.findMany({
        where: PUBLIC_PACKAGE_WHERE,
        orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
        select: { slug: true },
      });
    },
  };
}

export type CatalogService = ReturnType<typeof createCatalogService>;
