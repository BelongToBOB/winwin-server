import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class OverviewService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(seminarId?: string) {
    const sid = seminarId || null

    const [metrics] = await this.prisma.$queryRaw<any[]>`
      SELECT
        COUNT(r.id)::int AS total_registrations,
        COUNT(r.id) FILTER (WHERE r.reg_status = 'attended')::int AS attended,
        ROUND(
          COUNT(r.id) FILTER (WHERE r.reg_status = 'attended') * 100.0
          / NULLIF(COUNT(r.id), 0), 1
        )::float AS attendance_rate,
        ROUND(
          COUNT(rp.id) FILTER (WHERE rp.loan_before = true) * 100.0
          / NULLIF(COUNT(rp.id), 0), 1
        )::float AS loan_before_pct,
        COUNT(c.id)::int AS crm_active,
        COUNT(c.id) FILTER (WHERE c.next_followup < NOW())::int AS crm_overdue
      FROM registrations r
      LEFT JOIN registration_profiles rp ON rp.registration_id = r.id
      LEFT JOIN contacts c ON c.registrant_id = r.registrant_id
      WHERE (${sid}::text IS NULL OR r.seminar_id = ${sid})
    `

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
      LEFT JOIN registrations r ON r.event_id = ce.id
      GROUP BY ce.seminar_id, ce.course_name, ce.event_date, ce.status
      ORDER BY ce.event_date DESC
      LIMIT 10
    `

    return { ...metrics, channels, loan_ranges: loanRanges, seminars }
  }
}
