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

  async updateContact(id: string, data: {
    crm_stage?: string
    assigned_to?: string
    notes?: string
    next_followup?: string
    last_contacted?: string
  }) {
    const { crm_stage, assigned_to, notes,
            next_followup, last_contacted } = data
    return this.prisma.$queryRaw`
      UPDATE contacts SET
        crm_stage = COALESCE(${crm_stage ?? null}, crm_stage),
        assigned_to = COALESCE(${assigned_to ?? null}, assigned_to),
        notes = COALESCE(${notes ?? null}, notes),
        next_followup = COALESCE(${next_followup ?? null}::timestamptz, next_followup),
        last_contacted = COALESCE(${last_contacted ?? null}::timestamptz, last_contacted)
      WHERE id = ${id}::uuid RETURNING *
    `
  }
}
