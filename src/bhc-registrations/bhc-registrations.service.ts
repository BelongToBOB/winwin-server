import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class BhcRegistrationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(event_id?: string) {
    const eid = event_id || null
    return this.prisma.$queryRaw<any[]>`
      SELECT
        id::text, event_id, full_name, nickname,
        phone, facebook_name, accounting_problem,
        channel, course_accept, copyright_accept,
        created_at::text
      FROM bhc_registrations
      WHERE (${eid}::text IS NULL OR event_id = ${eid})
      ORDER BY created_at DESC
    `
  }

  async create(data: {
    event_id?: string
    full_name: string
    nickname: string
    phone: string
    facebook_name: string
    accounting_problem: string
    channel: string
    course_accept: string
    copyright_accept: string
  }) {
    const {
      event_id, full_name, nickname, phone,
      facebook_name, accounting_problem,
      channel, course_accept, copyright_accept,
    } = data

    return this.prisma.$queryRaw`
      INSERT INTO bhc_registrations
        (event_id, full_name, nickname, phone, facebook_name,
         accounting_problem, channel, course_accept, copyright_accept)
      VALUES (
        ${event_id ?? 'BHC_2026'},
        ${full_name}, ${nickname}, ${phone}, ${facebook_name},
        ${accounting_problem}, ${channel},
        ${course_accept}, ${copyright_accept}
      )
      RETURNING *
    `
  }

  async remove(id: string) {
    await this.prisma.$queryRaw`
      DELETE FROM bhc_registrations WHERE id = ${id}::uuid
    `
    return { deleted: true }
  }

  async stats(event_id?: string) {
    const eid = event_id || null
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT
        COUNT(*)::int AS total,
        COUNT(DISTINCT channel) AS channels
      FROM bhc_registrations
      WHERE (${eid}::text IS NULL OR event_id = ${eid})
    `
    return rows[0]
  }
}
