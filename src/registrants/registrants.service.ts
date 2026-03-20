import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { Prisma } from '@prisma/client'

@Injectable()
export class RegistrantsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    first_name?: string
    last_name?: string
    nickname?: string
    email?: string
    phone?: string
    job_category?: string
    job_other?: string
    source_channel?: string
  }) {
    const { first_name, last_name, nickname, email, phone,
            job_category, job_other, source_channel } = data
    return this.prisma.$queryRaw`
      INSERT INTO registrants
        (first_name, last_name, nickname, email, phone,
         job_category, job_other, source_channel)
      VALUES
        (${first_name ?? null}, ${last_name ?? null}, ${nickname ?? null},
         ${email ?? null}, ${phone ?? null}, ${job_category ?? null},
         ${job_other ?? null}, ${source_channel ?? null})
      RETURNING *
    `
  }

  async update(id: string, data: any) {
    const fields = Object.entries(data)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${k} = '${v}'`)
      .join(', ')
    return this.prisma.$queryRaw`
      UPDATE registrants SET ${Prisma.raw(fields)}, updated_at = NOW()
      WHERE id = ${id}::uuid RETURNING *
    `
  }

  async remove(id: string) {
    await this.prisma.$queryRaw`
      DELETE FROM interactions WHERE contact_id IN (
        SELECT id FROM contacts WHERE registrant_id = ${id}::uuid
      )
    `
    await this.prisma.$queryRaw`
      DELETE FROM contacts WHERE registrant_id = ${id}::uuid
    `
    await this.prisma.$queryRaw`
      DELETE FROM registration_profiles WHERE registration_id IN (
        SELECT id FROM registrations WHERE registrant_id = ${id}::uuid
      )
    `
    await this.prisma.$queryRaw`
      DELETE FROM payments WHERE registration_id IN (
        SELECT id FROM registrations WHERE registrant_id = ${id}::uuid
      )
    `
    await this.prisma.$queryRaw`
      DELETE FROM registrations WHERE registrant_id = ${id}::uuid
    `
    await this.prisma.$queryRaw`
      DELETE FROM registrants WHERE id = ${id}::uuid
    `
    return { deleted: true }
  }
}
