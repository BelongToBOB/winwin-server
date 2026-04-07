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
            re.first_name,
            re.last_name,
            COALESCE(re.nickname, '') AS nickname,
            re.phone::text AS phone,
            COALESCE(re.email, '') AS email,
            COALESCE(re.job_category, '') AS job_category,
            COALESCE(rp.channels, '') AS channels,
            COALESCE(rp.loan_amount_range, '') AS loan_amount_range,
            r.reg_status,
            r.registered_at::date::text AS registered_at
          FROM registrations r
          JOIN registrants re ON re.id = r.registrant_id
          LEFT JOIN registration_profiles rp ON rp.registration_id = r.id
          WHERE (${sid}::text IS NULL OR r.seminar_id = ${sid})
          ORDER BY r.registered_at DESC
        `

      case 'attendance_sheet':
        return this.prisma.$queryRaw<any[]>`
          SELECT
            re.first_name,
            re.last_name,
            COALESCE(re.nickname, '') AS nickname,
            re.phone::text AS phone,
            '' AS signature
          FROM registrants re
          JOIN registrations r ON r.registrant_id = re.id
          WHERE (${sid}::text IS NULL OR r.seminar_id = ${sid})
          ORDER BY re.first_name, re.last_name
        `

      default:
        return []
    }
  }
}
