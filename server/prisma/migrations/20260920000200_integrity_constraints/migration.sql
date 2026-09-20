-- Hand-written migration: database-level integrity that Prisma's schema language cannot express.
-- Do NOT edit after it has been applied anywhere; add a new migration instead.

-- ─────────────────────────────────────────────────────────────────────────────
-- Double-booking protection
-- ─────────────────────────────────────────────────────────────────────────────
-- btree_gist lets a GiST exclusion constraint combine "equals" on a uuid with "overlaps"
-- on a time range. It is a trusted extension, so a database owner can create it.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Ranges are half-open ('[)'): a lesson ending at 10:00 and another starting at 10:00 do NOT overlap.
-- Only lessons that still occupy the slot count; CANCELLED and NO_SHOW lessons free it.
-- The application maps SQLSTATE 23P01 (exclusion_violation) to an HTTP 409 CONFLICT.

ALTER TABLE "Lesson"
  ADD CONSTRAINT "Lesson_no_instructor_overlap"
  EXCLUDE USING gist (
    "instructorId" WITH =,
    tstzrange("startAt", "endAt", '[)') WITH &&
  ) WHERE ("status" IN ('SCHEDULED', 'COMPLETED'));

ALTER TABLE "Lesson"
  ADD CONSTRAINT "Lesson_no_vehicle_overlap"
  EXCLUDE USING gist (
    "vehicleId" WITH =,
    tstzrange("startAt", "endAt", '[)') WITH &&
  ) WHERE ("status" IN ('SCHEDULED', 'COMPLETED'));

-- ─────────────────────────────────────────────────────────────────────────────
-- Identity
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE "User"
  ADD CONSTRAINT "User_contact_required" CHECK ("email" IS NOT NULL OR "phone" IS NOT NULL),
  ADD CONSTRAINT "User_email_lowercase" CHECK ("email" IS NULL OR "email" = lower("email")),
  ADD CONSTRAINT "User_failedLoginCount_nonnegative" CHECK ("failedLoginCount" >= 0);

-- ─────────────────────────────────────────────────────────────────────────────
-- Scheduling
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE "Instructor"
  ADD CONSTRAINT "Instructor_experienceYears_nonnegative" CHECK ("experienceYears" IS NULL OR "experienceYears" >= 0);

ALTER TABLE "InstructorAvailability"
  ADD CONSTRAINT "InstructorAvailability_dayOfWeek_range" CHECK ("dayOfWeek" BETWEEN 0 AND 6),
  ADD CONSTRAINT "InstructorAvailability_minutes_range" CHECK ("startMinute" >= 0 AND "endMinute" <= 1440),
  ADD CONSTRAINT "InstructorAvailability_window_valid" CHECK ("endMinute" > "startMinute");

ALTER TABLE "InstructorTimeOff"
  ADD CONSTRAINT "InstructorTimeOff_window_valid" CHECK ("endAt" > "startAt");

ALTER TABLE "Lesson"
  ADD CONSTRAINT "Lesson_window_valid" CHECK ("endAt" > "startAt");

ALTER TABLE "LessonProgress"
  ADD CONSTRAINT "LessonProgress_rating_range" CHECK ("rating" BETWEEN 1 AND 5);

-- ─────────────────────────────────────────────────────────────────────────────
-- Catalogue and enrollment (money is integer paise)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE "Package"
  ADD CONSTRAINT "Package_pricePaise_nonnegative" CHECK ("pricePaise" >= 0),
  ADD CONSTRAINT "Package_lessonCount_positive" CHECK ("lessonCount" > 0),
  ADD CONSTRAINT "Package_lessonDurationMinutes_positive" CHECK ("lessonDurationMinutes" > 0),
  ADD CONSTRAINT "Package_validityDays_positive" CHECK ("validityDays" IS NULL OR "validityDays" > 0);

ALTER TABLE "RtaService"
  ADD CONSTRAINT "RtaService_pricePaise_nonnegative" CHECK ("pricePaise" IS NULL OR "pricePaise" >= 0);

ALTER TABLE "Enrollment"
  ADD CONSTRAINT "Enrollment_pricePaise_nonnegative" CHECK ("pricePaise" >= 0),
  ADD CONSTRAINT "Enrollment_lessonCount_positive" CHECK ("lessonCount" > 0),
  ADD CONSTRAINT "Enrollment_lessonDurationMinutes_positive" CHECK ("lessonDurationMinutes" > 0),
  ADD CONSTRAINT "Enrollment_expiry_after_start" CHECK ("expiresOn" IS NULL OR "expiresOn" >= "startDate");

ALTER TABLE "VehicleServiceRecord"
  ADD CONSTRAINT "VehicleServiceRecord_costPaise_nonnegative" CHECK ("costPaise" IS NULL OR "costPaise" >= 0),
  ADD CONSTRAINT "VehicleServiceRecord_odometerKm_nonnegative" CHECK ("odometerKm" IS NULL OR "odometerKm" >= 0);

-- ─────────────────────────────────────────────────────────────────────────────
-- Payments
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE "Payment"
  ADD CONSTRAINT "Payment_amountPaise_positive" CHECK ("amountPaise" > 0),
  ADD CONSTRAINT "Payment_paid_has_timestamp" CHECK ("status" <> 'PAID' OR "paidAt" IS NOT NULL);

-- ─────────────────────────────────────────────────────────────────────────────
-- Reviews, RTA, notifications
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE "Review"
  ADD CONSTRAINT "Review_rating_range" CHECK ("rating" BETWEEN 1 AND 5);

-- An RTA request needs either a linked student or walk-in contact details.
ALTER TABLE "RtaRequest"
  ADD CONSTRAINT "RtaRequest_contact_required" CHECK (
    "studentId" IS NOT NULL OR ("contactName" IS NOT NULL AND "contactPhone" IS NOT NULL)
  );

ALTER TABLE "Notification"
  ADD CONSTRAINT "Notification_attempts_nonnegative" CHECK ("attempts" >= 0);
