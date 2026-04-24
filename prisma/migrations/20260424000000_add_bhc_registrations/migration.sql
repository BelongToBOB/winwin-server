-- CreateTable
CREATE TABLE "bhc_registrations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" VARCHAR(50) NOT NULL DEFAULT 'BHC_2026',
    "full_name" VARCHAR(255) NOT NULL,
    "nickname" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "facebook_name" VARCHAR(255) NOT NULL,
    "accounting_problem" TEXT NOT NULL,
    "channel" VARCHAR(50) NOT NULL,
    "course_accept" VARCHAR(20) NOT NULL,
    "copyright_accept" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bhc_registrations_pkey" PRIMARY KEY ("id")
);
