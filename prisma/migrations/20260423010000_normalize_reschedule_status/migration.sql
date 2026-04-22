-- Reset ค่าเก่าที่ไม่ใช่ 'none' หรือ 'rescheduled' ให้เป็น 'none'
UPDATE "registrations"
SET "reschedule_status" = 'none'
WHERE "reschedule_status" NOT IN ('none', 'rescheduled');
