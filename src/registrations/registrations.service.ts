import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

interface RegistrationsFilters {
  seminar_id?: string
  status?: string
  job?: string
  loan_range?: string
  q?: string
}

@Injectable()
export class RegistrationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRegistrations(filters: RegistrationsFilters) {
    const sid = filters.seminar_id || null
    const st = filters.status || null
    const jb = filters.job || null
    const lr = filters.loan_range || null
    const search = filters.q || null

    return this.prisma.$queryRaw<any[]>`
      SELECT
        r.id::text,
        re.id::text AS registrant_id,
        re.first_name, re.last_name, re.nickname,
        re.email, re.phone, re.job_category,
        rp.channels, rp.loan_amount_range,
        rp.loan_before, rp.credit_banks,
        rp.objective, rp.loan_problems,
        r.reg_status, r.registered_at::text, r.seminar_id,
        r.reschedule_status,
        r.reschedule_note,
        r.reschedule_updated_at::text
      FROM registrations r
      JOIN registrants re ON re.id = r.registrant_id
      LEFT JOIN registration_profiles rp ON rp.registration_id = r.id
      WHERE
        (${sid}::text IS NULL OR r.seminar_id = ${sid})
        AND (${st}::text IS NULL OR r.reg_status = ${st})
        AND (${jb}::text IS NULL OR re.job_category ILIKE '%' || ${jb} || '%')
        AND (${lr}::text IS NULL OR rp.loan_amount_range = ${lr})
        AND (${search}::text IS NULL OR
          re.first_name ILIKE '%' || ${search} || '%' OR
          re.last_name ILIKE '%' || ${search} || '%' OR
          re.email ILIKE '%' || ${search} || '%')
      ORDER BY r.registered_at DESC
      LIMIT 100
    `
  }

  async create(data: {
    registrant_id: string
    event_id?: string
    seminar_id: string
    reg_status?: string
  }) {
    const { registrant_id, seminar_id, reg_status } = data
    let event_id = data.event_id
    if (!event_id) {
      const rows = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT id::text FROM course_events WHERE seminar_id = ${seminar_id} LIMIT 1
      `
      if (!rows.length) {
        throw new BadRequestException(`ไม่พบ seminar_id: ${seminar_id}`)
      }
      event_id = rows[0].id
    }
    try {
      return await this.prisma.$queryRaw`
        INSERT INTO registrations (event_id, registrant_id, seminar_id, reg_status, registered_at)
        VALUES (
          ${event_id}::uuid,
          ${registrant_id}::uuid,
          ${seminar_id},
          ${reg_status ?? 'pending'},
          NOW()
        )
        RETURNING *
      `
    } catch (err: any) {
      if (err?.cause?.code === '22P02' || err?.message?.includes('invalid input syntax for type uuid')) {
        throw new BadRequestException('Invalid UUID format for registrant_id or event_id')
      }
      throw err
    }
  }

  async updateStatus(id: string, reg_status: string) {
    return this.prisma.$queryRaw`
      UPDATE registrations SET reg_status = ${reg_status}
      WHERE id = ${id}::uuid RETURNING *
    `
  }

  async remove(id: string) {
    await this.prisma.$queryRaw`
      DELETE FROM registration_profiles WHERE registration_id = ${id}::uuid
    `
    await this.prisma.$queryRaw`
      DELETE FROM payments WHERE registration_id = ${id}::uuid
    `
    await this.prisma.$queryRaw`
      DELETE FROM registrations WHERE id = ${id}::uuid
    `
    return { deleted: true }
  }

  async updateReschedule(id: string, data: { reschedule_status: string; reschedule_note?: string }) {
    const allowed = ['none', 'rescheduled']
    if (!allowed.includes(data.reschedule_status)) {
      throw new BadRequestException(
        `Invalid reschedule_status. Must be one of: ${allowed.join(', ')}`
      )
    }
    const { reschedule_status, reschedule_note } = data
    return this.prisma.$queryRaw`
      UPDATE registrations SET
        reschedule_status = ${reschedule_status},
        reschedule_note = ${reschedule_note ?? null},
        reschedule_updated_at = NOW()
      WHERE id = ${id}::uuid
      RETURNING *
    `
  }
}
