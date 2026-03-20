import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class CrmService {
  constructor(private readonly prisma: PrismaService) {}

  async getStages() {
    return this.prisma.$queryRaw<any[]>`
      SELECT crm_stage AS stage, COUNT(*)::int AS count
      FROM contacts
      GROUP BY crm_stage
      ORDER BY count DESC
    `
  }

  async getFollowups(seminarId?: string, overdueOnly?: string) {
    const sid = seminarId || null
    const overdue = overdueOnly === 'true' ? true : null

    return this.prisma.$queryRaw<any[]>`
      SELECT
        c.id::text,
        re.first_name, re.last_name,
        c.crm_stage,
        COALESCE(c.assigned_to, '') AS assigned_to,
        c.last_contacted::text,
        c.next_followup::text,
        COALESCE(i.channel, '') AS channel,
        COALESCE(r.seminar_id, '') AS seminar_id,
        COALESCE(c.notes, '') AS notes
      FROM contacts c
      JOIN registrants re ON re.id = c.registrant_id
      LEFT JOIN LATERAL (
        SELECT seminar_id FROM registrations
        WHERE registrant_id = re.id
        ORDER BY registered_at DESC LIMIT 1
      ) r ON true
      LEFT JOIN LATERAL (
        SELECT channel FROM interactions
        WHERE contact_id = c.id
        ORDER BY interacted_at DESC LIMIT 1
      ) i ON true
      WHERE
        (${sid}::text IS NULL OR r.seminar_id = ${sid})
        AND (${overdue}::boolean IS NULL OR (${overdue} = true AND c.next_followup < NOW()))
      ORDER BY c.next_followup ASC NULLS LAST
      LIMIT 100
    `
  }
}
