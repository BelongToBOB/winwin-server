import { Injectable } from '@nestjs/common'
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
        re.first_name, re.last_name, re.nickname,
        re.email, re.phone, re.job_category,
        rp.channels, rp.loan_amount_range,
        rp.loan_before, rp.credit_banks,
        rp.objective, rp.loan_problems,
        r.reg_status, r.registered_at::text, r.seminar_id
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
}
