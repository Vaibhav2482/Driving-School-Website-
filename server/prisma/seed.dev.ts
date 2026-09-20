/**
 * DEVELOPMENT seed:  npm run seed:dev
 *
 * Fills a LOCAL database with obviously fake data so the admin panel and portals have something to
 * show while they are being built. Everything created here is labelled:
 *   - names start with "[DEV]",
 *   - emails use the reserved `@example.test` domain,
 *   - phone numbers are not real numbers,
 *   - notes say "[DEV] ...".
 * Never treat any of it as real business data.
 *
 * Safety: refuses to run when NODE_ENV=production, and refuses non-local databases unless
 * ALLOW_DEV_SEED_REMOTE=true is set explicitly.
 */
import bcrypt from "bcrypt";
import { randomBytes } from "node:crypto";
import { createPrismaClient } from "../src/lib/prisma.js";
import { seedFoundation } from "./seed/foundation.js";
import { loadBaseSeedEnv } from "./seed/seed-env.js";

const DEV = "[DEV]";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

function assertSafeToRun(env: { NODE_ENV: string; DATABASE_URL: string }): void {
  if (env.NODE_ENV === "production") {
    console.error("Refusing to run the DEV seed: NODE_ENV=production.");
    process.exit(1);
  }
  const host = new URL(env.DATABASE_URL).hostname;
  if (!LOCAL_HOSTS.has(host) && process.env.ALLOW_DEV_SEED_REMOTE !== "true") {
    console.error(`Refusing to run the DEV seed against non-local database host "${host}".`);
    console.error(
      "Set ALLOW_DEV_SEED_REMOTE=true only if you are certain this is not a real business database.",
    );
    process.exit(1);
  }
}

async function main(): Promise<void> {
  const env = loadBaseSeedEnv();
  assertSafeToRun(env);

  const prisma = createPrismaClient(env.DATABASE_URL);
  const password = process.env.SEED_DEV_PASSWORD ?? randomBytes(12).toString("base64url");
  const passwordHash = await bcrypt.hash(password, 10);
  const created: string[] = [];

  try {
    await seedFoundation(prisma);
    const kondapur = await prisma.branch.findUniqueOrThrow({ where: { slug: "kondapur" } });
    const hafeezpet = await prisma.branch.findUniqueOrThrow({ where: { slug: "hafeezpet" } });

    async function devUser(
      email: string,
      fullName: string,
      role: "ADMIN" | "INSTRUCTOR" | "STUDENT",
      phone: string,
    ) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return existing;
      created.push(`${role.padEnd(10)} ${email}`);
      return prisma.user.create({
        data: { email, phone, fullName: `${DEV} ${fullName}`, role, passwordHash },
      });
    }

    await devUser("dev.admin@example.test", "Admin", "ADMIN", "+910000000001");
    const instructorUsers = [
      await devUser(
        "dev.instructor1@example.test",
        "Instructor One",
        "INSTRUCTOR",
        "+910000000002",
      ),
      await devUser(
        "dev.instructor2@example.test",
        "Instructor Two",
        "INSTRUCTOR",
        "+910000000003",
      ),
    ];
    const studentUsers = [
      await devUser("dev.student1@example.test", "Student One", "STUDENT", "+910000000004"),
      await devUser("dev.student2@example.test", "Student Two", "STUDENT", "+910000000005"),
    ];

    const instructors = [];
    for (const [i, user] of instructorUsers.entries()) {
      instructors.push(
        await prisma.instructor.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            branchId: i === 0 ? kondapur.id : hafeezpet.id,
            bio: `${DEV} sample instructor`,
          },
          update: {},
        }),
      );
    }

    const students = [];
    for (const user of studentUsers) {
      students.push(
        await prisma.student.upsert({
          where: { userId: user.id },
          create: { userId: user.id, branchId: kondapur.id, notes: `${DEV} sample student` },
          update: {},
        }),
      );
    }

    const vehicles = [];
    for (const [i, instructor] of instructors.entries()) {
      vehicles.push(
        await prisma.vehicle.upsert({
          where: { registrationNumber: `DEV-TEST-000${i + 1}` },
          create: {
            branchId: instructor.branchId,
            registrationNumber: `DEV-TEST-000${i + 1}`,
            model: `${DEV} Sample Car ${i + 1}`,
            type: "CAR",
            transmission: "MANUAL",
            assignedInstructorId: instructor.id,
            notes: `${DEV} sample vehicle`,
          },
          update: {},
        }),
      );
    }

    const beginner = await prisma.package.upsert({
      where: { slug: "dev-sample-package" },
      create: {
        name: `${DEV} Sample Package`,
        slug: "dev-sample-package",
        description: `${DEV} Fake package for development only. Not a real offering or price.`,
        pricePaise: 500000, // ₹5,000
        lessonCount: 10,
        lessonDurationMinutes: 45,
        vehicleType: "CAR",
        validityDays: 90,
        features: [`${DEV} feature one`, `${DEV} feature two`],
        status: "ACTIVE",
        displayOrder: 1,
      },
      update: {},
    });

    for (const [i, fullName] of ["Enquirer One", "Enquirer Two"].entries()) {
      const phone = `+91000000010${i}`;
      const exists = await prisma.enquiry.findFirst({ where: { phone } });
      if (!exists) {
        await prisma.enquiry.create({
          data: {
            fullName: `${DEV} ${fullName}`,
            phone,
            packageId: beginner.id,
            preferredBranchId: kondapur.id,
            message: `${DEV} sample enquiry`,
            consentGivenAt: new Date(),
          },
        });
        created.push(`ENQUIRY    ${DEV} ${fullName}`);
      }
    }

    // One enrollment with one upcoming lesson and one payment for the first student.
    const [student, instructor, vehicle] = [students[0], instructors[0], vehicles[0]];
    if (student && instructor && vehicle) {
      let enrollment = await prisma.enrollment.findFirst({
        where: { studentId: student.id, notes: { startsWith: DEV } },
      });
      if (!enrollment) {
        enrollment = await prisma.enrollment.create({
          data: {
            studentId: student.id,
            packageId: beginner.id,
            pricePaise: beginner.pricePaise,
            lessonCount: beginner.lessonCount,
            lessonDurationMinutes: beginner.lessonDurationMinutes,
            startDate: new Date(),
            notes: `${DEV} sample enrollment`,
          },
        });
        const now = new Date();
        // Tomorrow 10:00 India time (UTC+5:30) = 04:30 UTC.
        const startAt = new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 4, 30),
        );
        await prisma.lesson.create({
          data: {
            enrollmentId: enrollment.id,
            studentId: student.id,
            instructorId: instructor.id,
            vehicleId: vehicle.id,
            startAt,
            endAt: new Date(startAt.getTime() + enrollment.lessonDurationMinutes * 60_000),
            instructorNotes: `${DEV} sample lesson`,
          },
        });
        await prisma.payment.create({
          data: {
            studentId: student.id,
            enrollmentId: enrollment.id,
            amountPaise: 200000,
            method: "CASH",
            status: "PAID",
            paidAt: new Date(),
            notes: `${DEV} sample payment (fake)`,
          },
        });
        created.push(`ENROLLMENT ${DEV} sample enrollment + lesson + payment`);
      }
    }

    console.log(`\n${DEV} Development seed complete.`);
    if (created.length > 0) {
      console.log("Created:\n  " + created.join("\n  "));
      console.log(
        process.env.SEED_DEV_PASSWORD
          ? "\nAll dev users share the password from SEED_DEV_PASSWORD."
          : `\nAll new dev users share this generated password (shown once): ${password}`,
      );
    } else {
      console.log("Nothing new to create; dev data already present.");
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err: unknown) => {
  console.error("Dev seed failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
