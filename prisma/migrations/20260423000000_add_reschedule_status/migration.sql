-- AlterTable
ALTER TABLE "registrations" ADD COLUMN "reschedule_status" VARCHAR(20) NOT NULL DEFAULT 'none';
ALTER TABLE "registrations" ADD COLUMN "reschedule_note" TEXT;
ALTER TABLE "registrations" ADD COLUMN "reschedule_updated_at" TIMESTAMP(3);
