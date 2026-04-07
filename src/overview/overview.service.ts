import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class OverviewService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(seminarId?: string) {
    const sid = seminarId || null

    const rawMetrics = await this.prisma.$queryRaw<any[]>`
      SELECT
        COALESCE(COUNT(r.id)::int, 0) AS total_registrations,
        COALESCE(COUNT(r.id) FILTER (WHERE r.reg_status = 'attended')::int, 0) AS attended,
        COALESCE(ROUND(
          COUNT(r.id) FILTER (WHERE r.reg_status = 'attended') * 100.0
          / NULLIF(COUNT(r.id), 0), 1
        )::float, 0) AS attendance_rate,
        COALESCE(ROUND(
          COUNT(rp.id) FILTER (WHERE rp.loan_before = true) * 100.0
          / NULLIF(COUNT(rp.id), 0), 1
        )::float, 0) AS loan_before_pct,
        COALESCE(COUNT(c.id)::int, 0) AS crm_active,
        COALESCE(COUNT(c.id) FILTER (WHERE c.next_followup < NOW())::int, 0) AS crm_overdue
      FROM registrations r
      LEFT JOIN registration_profiles rp ON rp.registration_id = r.id
      LEFT JOIN contacts c ON c.registrant_id = r.registrant_id
      WHERE (${sid}::text IS NULL OR r.seminar_id = ${sid})
    `

    const metrics = rawMetrics[0] ?? {
      total_registrations: 0,
      attended: 0,
      attendance_rate: 0,
      loan_before_pct: 0,
      crm_active: 0,
      crm_overdue: 0,
    }

    const channels = await this.prisma.$queryRaw<any[]>`
      SELECT
        TRIM(unnest(string_to_array(rp.channels, ','))) AS name,
        COUNT(*)::int AS count
      FROM registration_profiles rp
      JOIN registrations r ON r.id = rp.registration_id
      WHERE (${sid}::text IS NULL OR r.seminar_id = ${sid})
        AND rp.channels IS NOT NULL
      GROUP BY name ORDER BY count DESC
    `

    const loanRanges = await this.prisma.$queryRaw<any[]>`
      SELECT
        rp.loan_amount_range AS range,
        COUNT(*)::int AS count
      FROM registration_profiles rp
      JOIN registrations r ON r.id = rp.registration_id
      WHERE (${sid}::text IS NULL OR r.seminar_id = ${sid})
        AND rp.loan_amount_range IS NOT NULL
      GROUP BY range ORDER BY count DESC
    `

    const seminars = await this.prisma.$queryRaw<any[]>`
      SELECT
        ce.seminar_id,
        ce.course_name,
        ce.event_date::text,
        COUNT(r.id)::int AS total,
        COUNT(r.id) FILTER (WHERE r.reg_status = 'attended')::int AS attended,
        ce.status
      FROM course_events ce
      LEFT JOIN registrations r ON r.seminar_id = ce.seminar_id
      WHERE (${sid}::text IS NULL OR ce.seminar_id = ${sid})
      GROUP BY ce.seminar_id, ce.course_name, ce.event_date, ce.status
      ORDER BY ce.event_date DESC
      LIMIT 10
    `

    return { ...metrics, channels, loan_ranges: loanRanges, seminars }
  }
}
