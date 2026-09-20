import type { PrismaClient } from "../../lib/prisma.js";
import type { NotificationService } from "../notifications/notification.service.js";
import type { EnquiryInput } from "./public.schemas.js";

export type EnquiryPrisma = Pick<PrismaClient, "enquiry" | "package" | "branch">;

/** A repeat submission from the same number within this window is treated as a double-click. */
const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;

/**
 * Creates leads from the public enquiry form and tells the owner about them.
 *
 * Consent is recorded as a timestamp. The IP address is used for rate limiting only (in memory) and is
 * not stored, so no schema change or extra personal data is needed.
 *
 * Order matters: the enquiry is saved FIRST. The owner's email is then queued in the outbox and sent in
 * the background, so a mail-server problem can never lose or fail a customer's enquiry.
 */
export function createEnquiryService(
  prisma: EnquiryPrisma,
  notifier: Pick<NotificationService, "notifyOwnerOfEnquiry">,
  clock: () => Date = () => new Date(),
) {
  return {
    async create(input: EnquiryInput): Promise<void> {
      const now = clock();

      // Repeat submission (double-click, impatient retry): succeed without creating a second lead.
      const recent = await prisma.enquiry.findFirst({
        where: {
          phone: input.phone,
          createdAt: { gte: new Date(now.getTime() - DUPLICATE_WINDOW_MS) },
        },
        select: { id: true },
      });
      if (recent) return;

      // A package or branch that has since been archived is dropped rather than failing the whole
      // enquiry: losing a lead is worse than losing a preference.
      const [pkg, branch] = await Promise.all([
        input.packageSlug
          ? prisma.package.findFirst({
              where: { slug: input.packageSlug, status: "ACTIVE", deletedAt: null },
              select: { id: true, name: true },
            })
          : null,
        input.preferredBranchSlug
          ? prisma.branch.findFirst({
              where: { slug: input.preferredBranchSlug, isActive: true },
              select: { id: true, name: true },
            })
          : null,
      ]);

      await prisma.enquiry.create({
        data: {
          fullName: input.fullName,
          phone: input.phone,
          packageId: pkg?.id ?? null,
          preferredBranchId: branch?.id ?? null,
          // A calendar date, stored as `date` (no time zone shift).
          preferredDate: input.preferredDate ? new Date(`${input.preferredDate}T00:00:00Z`) : null,
          preferredTimeWindow: input.preferredTimeWindow ?? null,
          pickupRequested: Boolean(input.pickupAddress),
          pickupAddress: input.pickupAddress ?? null,
          message: input.message ?? null,
          source: "WEBSITE",
          consentGivenAt: now,
        },
      });

      // The email carries names and the visitor's own answers only: no database ids, no IP address.
      await notifier.notifyOwnerOfEnquiry({
        fullName: input.fullName,
        phone: input.phone,
        packageName: pkg?.name ?? null,
        branchName: branch?.name ?? null,
        preferredDate: input.preferredDate ?? null,
        preferredTimeWindow: input.preferredTimeWindow ?? null,
        pickupAddress: input.pickupAddress ?? null,
        message: input.message ?? null,
        receivedAt: now.toISOString(),
      });
    },
  };
}

export type EnquiryService = ReturnType<typeof createEnquiryService>;
