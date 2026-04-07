import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  async getPreview(seminarId: string, type: string): Promise<any[]> {
    const sid = seminarId || null

    switch (type) {
      case 'registration_summary':
        return this.prisma.$queryRaw<any[]>`
          SELECT
            (re.first_name || ' ' || re.last_name) AS full_name,
            COALESCE(re.nickname, '-') AS nickname,
            COALESCE(re.email, '-') AS email,
            COALESCE(re.phone, '-') AS phone,
            COALESCE(re.job_category, '-') AS job_category,
            COALESCE(rp.channels, '-') AS channels,
            COALESCE(rp.loan_amount_range, '-') AS loan_amount_range,
            r.reg_status,
            r.registered_at::date::text AS registered_at
          FROM registrations r
          JOIN registrants re ON re.id = r.registrant_id
          LEFT JOIN registration_profiles rp ON rp.registration_id = r.id
          WHERE (${sid}::text IS NULL OR r.seminar_id = ${sid})
          ORDER BY r.registered_at DESC
        `

      case 'loan_profile':
        return this.prisma.$queryRaw<any[]>`
          SELECT
            (re.first_name || ' ' || re.last_name) AS full_name,
            CASE WHEN rp.loan_before = true THEN 'เคย' ELSE 'ไม่เคย' END AS loan_before,
            COALESCE(rp.credit_banks, '-') AS credit_banks,
            COALESCE(rp.loan_amount_range, '-') AS loan_amount_range,
            COALESCE(rp.objective, '-') AS objective,
            COALESCE(rp.loan_problems, '-') AS loan_problems
          FROM registrations r
          JOIN registrants re ON re.id = r.registrant_id
          LEFT JOIN registration_profiles rp ON rp.registration_id = r.id
          WHERE (${sid}::text IS NULL OR r.seminar_id = ${sid})
          ORDER BY re.first_name
        `

      case 'attendance':
        return this.prisma.$queryRaw<any[]>`
          SELECT
            (re.first_name || ' ' || re.last_name) AS full_name,
            r.reg_status,
            r.registered_at::date::text AS registered_at
          FROM registrations r
          JOIN registrants re ON re.id = r.registrant_id
          WHERE (${sid}::text IS NULL OR r.seminar_id = ${sid})
          ORDER BY r.registered_at DESC
        `

      case 'crm_pipeline':
        return this.prisma.$queryRaw<any[]>`
          SELECT
            (re.first_name || ' ' || re.last_name) AS full_name,
            c.crm_stage,
            COALESCE(c.assigned_to, '-') AS assigned_to,
            COALESCE(c.next_followup::date::text, '-') AS next_followup
          FROM contacts c
          JOIN registrants re ON re.id = c.registrant_id
          LEFT JOIN LATERAL (
            SELECT seminar_id FROM registrations
            WHERE registrant_id = re.id
            ORDER BY registered_at DESC LIMIT 1
          ) r ON true
          WHERE (${sid}::text IS NULL OR r.seminar_id = ${sid})
          ORDER BY c.next_followup NULLS LAST
        `

      default:
        return []
    }
  }
}
