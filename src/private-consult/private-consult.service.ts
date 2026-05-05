import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class PrivateConsultService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(consult_id?: string) {
    const cid = consult_id || null
    return this.prisma.$queryRaw<any[]>`
      SELECT
        id::text, consult_id, full_name, nickname,
        email, phone, line_id,
        business_name, business_type, monthly_revenue,
        consult_topics, channel,
        status, notes,
        created_at::text
      FROM private_consult_registrations
      WHERE (${cid}::text IS NULL OR consult_id = ${cid})
      ORDER BY created_at DESC
    `
  }

  async create(data: any) {
    // Support both flat and nested (from FormPrivateConsult) format
    const contact = data.contact || {}
    const business = data.business || {}

    const consult_id = data.consult_id
    const full_name = contact.full_name || data.full_name
    const nickname = contact.nickname || data.nickname || ''
    const email = contact.email || data.email || ''
    const phone = contact.phone || data.phone || ''
    const line_id = contact.line_id || data.line_id || ''
    const business_name = business.business_name || data.business_name || ''
    const business_type = business.business_type_final || business.business_type || data.business_type || ''
    const monthly_revenue = business.monthly_revenue || data.monthly_revenue || ''
    const consult_topics = data.consult_topic_final || data.consult_topics || []
    const channel = data.channel || []
    const pdpa_consent = data.pdpa_consent ?? true

    return this.prisma.$queryRaw`
      INSERT INTO private_consult_registrations
        (consult_id, full_name, nickname, email, phone, line_id,
         business_name, business_type, monthly_revenue,
         consult_topics, channel, pdpa_consent)
      VALUES (
        ${consult_id ?? 'EPC_2026'},
        ${full_name}, ${nickname ?? ''}, ${email ?? ''}, ${phone ?? ''}, ${line_id ?? ''},
        ${business_name ?? ''}, ${business_type ?? ''}, ${monthly_revenue ?? ''},
        ${consult_topics ?? []}, ${channel ?? []},
        ${pdpa_consent ?? true}
      )
      RETURNING *
    `
  }

  async update(id: string, data: Partial<{
    full_name: string
    nickname: string
    email: string
    phone: string
    line_id: string
    business_name: string
    business_type: string
    monthly_revenue: string
    status: string
    notes: string
  }>) {
    const current = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM private_consult_registrations WHERE id = ${id}::uuid
    `
    if (!current.length) return []
    const c = current[0]
    return this.prisma.$queryRaw`
      UPDATE private_consult_registrations SET
        full_name = ${data.full_name ?? c.full_name},
        nickname = ${data.nickname ?? c.nickname},
        email = ${data.email ?? c.email},
        phone = ${data.phone ?? c.phone},
        line_id = ${data.line_id ?? c.line_id},
        business_name = ${data.business_name ?? c.business_name},
        business_type = ${data.business_type ?? c.business_type},
        monthly_revenue = ${data.monthly_revenue ?? c.monthly_revenue},
        status = ${data.status ?? c.status},
        notes = ${data.notes ?? c.notes},
        updated_at = NOW()
      WHERE id = ${id}::uuid
      RETURNING *
    `
  }

  async remove(id: string) {
    await this.prisma.$queryRaw`
      DELETE FROM private_consult_registrations WHERE id = ${id}::uuid
    `
    return { deleted: true }
  }

  async stats(consult_id?: string) {
    const cid = consult_id || null
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
        COUNT(*) FILTER (WHERE status = 'contacted')::int AS contacted,
        COUNT(*) FILTER (WHERE status = 'scheduled')::int AS scheduled,
        COUNT(*) FILTER (WHERE status = 'completed')::int AS completed
      FROM private_consult_registrations
      WHERE (${cid}::text IS NULL OR consult_id = ${cid})
    `
    return rows[0]
  }
}
