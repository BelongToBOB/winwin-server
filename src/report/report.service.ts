import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  async getPreview(seminarId: string, type: string): Promise<{ metric: string; value: string }[]> {
    const sid = seminarId || null

    switch (type) {
      case 'registration_summary':
        return this.prisma.$queryRaw<any[]>`
          SELECT
            'Total Registrations' AS metric,
            COUNT(r.id)::text AS value
          FROM registrations r
          WHERE (${sid}::text IS NULL OR r.seminar_id = ${sid})
          UNION ALL
          SELECT 'Attended', COUNT(r.id) FILTER (WHERE r.reg_status = 'attended')::text
          FROM registrations r WHERE (${sid}::text IS NULL OR r.seminar_id = ${sid})
          UNION ALL
          SELECT 'Pending', COUNT(r.id) FILTER (WHERE r.reg_status = 'pending')::text
          FROM registrations r WHERE (${sid}::text IS NULL OR r.seminar_id = ${sid})
          UNION ALL
          SELECT 'Cancelled', COUNT(r.id) FILTER (WHERE r.reg_status = 'cancelled')::text
          FROM registrations r WHERE (${sid}::text IS NULL OR r.seminar_id = ${sid})
        `

      case 'loan_profile':
        return this.prisma.$queryRaw<any[]>`
          SELECT
            COALESCE(rp.loan_amount_range, 'Unknown') AS metric,
            COUNT(*)::text AS value
          FROM registration_profiles rp
          JOIN registrations r ON r.id = rp.registration_id
          WHERE (${sid}::text IS NULL OR r.seminar_id = ${sid})
          GROUP BY rp.loan_amount_range
          ORDER BY count(*) DESC
        `

      case 'crm_pipeline':
        return this.prisma.$queryRaw<any[]>`
          SELECT
            c.crm_stage AS metric,
            COUNT(*)::text AS value
          FROM contacts c
          JOIN registrants re ON re.id = c.registrant_id
          LEFT JOIN LATERAL (
            SELECT seminar_id FROM registrations
            WHERE registrant_id = re.id
            ORDER BY registered_at DESC LIMIT 1
          ) r ON true
          WHERE (${sid}::text IS NULL OR r.seminar_id = ${sid})
          GROUP BY c.crm_stage
          ORDER BY count(*) DESC
        `

      case 'attendance':
        return this.prisma.$queryRaw<any[]>`
          SELECT
            ce.course_name AS metric,
            CONCAT(
              COUNT(r.id) FILTER (WHERE r.reg_status = 'attended'),
              ' / ',
              COUNT(r.id)
            ) AS value
          FROM course_events ce
          LEFT JOIN registrations r ON r.event_id = ce.id
          WHERE (${sid}::text IS NULL OR ce.seminar_id = ${sid})
          GROUP BY ce.course_name, ce.event_date
          ORDER BY ce.event_date DESC
        `

      default:
        return []
    }
  }
}
