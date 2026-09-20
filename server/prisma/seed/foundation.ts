import { Prisma, type PrismaClient } from "../../src/generated/prisma/client.js";
import { BRANCHES, DEFAULT_SKILLS, SETTINGS } from "./business-data.js";

/**
 * Idempotent foundation data shared by the production seed and the dev seed.
 * Every write uses `update: {}` so re-running never overwrites values the owner has since edited.
 */
export async function seedFoundation(prisma: PrismaClient): Promise<void> {
  for (const branch of BRANCHES) {
    await prisma.branch.upsert({ where: { slug: branch.slug }, create: { ...branch }, update: {} });
  }

  for (const setting of SETTINGS) {
    await prisma.businessSetting.upsert({
      where: { key: setting.key },
      create: {
        key: setting.key,
        value: setting.value === null ? Prisma.JsonNull : (setting.value as Prisma.InputJsonValue),
        isPublic: setting.isPublic,
        description: setting.description,
      },
      update: {},
    });
  }

  for (const [index, name] of DEFAULT_SKILLS.entries()) {
    await prisma.skill.upsert({
      where: { name },
      create: { name, displayOrder: index + 1 },
      update: {},
    });
  }
}
