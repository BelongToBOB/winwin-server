import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

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
         job_category, job_other, source_channel,
         created_at, updated_at)
      VALUES
        (${first_name ?? null}, ${last_name ?? null}, ${nickname ?? null},
         ${email ?? null}, ${phone ?? null}, ${job_category ?? null},
         ${job_other ?? null}, ${source_channel ?? null},
         NOW(), NOW())
      RETURNING *
    `
  }

  async update(id: string, data: Partial<{
    first_name: string
    last_name: string
    nickname: string
    email: string
    phone: string
    job_category: string
    job_other: string
    source_channel: string
  }>) {
    const { first_name, last_name, nickname, email, phone,
            job_category, job_other, source_channel } = data
    try {
      return await this.prisma.$queryRaw`
        UPDATE registrants SET
          first_name = COALESCE(${first_name ?? null}, first_name),
          last_name = COALESCE(${last_name ?? null}, last_name),
          nickname = COALESCE(${nickname ?? null}, nickname),
          email = COALESCE(${email ?? null}, email),
          phone = COALESCE(${phone ?? null}, phone),
          job_category = COALESCE(${job_category ?? null}, job_category),
          job_other = COALESCE(${job_other ?? null}, job_other),
          source_channel = COALESCE(${source_channel ?? null}, source_channel),
          updated_at = NOW()
        WHERE id = ${id}::uuid
        RETURNING *
      `
    } catch (err: any) {
      if (err?.cause?.code === '22P02' || err?.message?.includes('invalid input syntax for type uuid')) {
        throw new BadRequestException('Invalid UUID format')
      }
      throw err
    }
  }

  async remove(id: string) {
    try {
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
    } catch (err: any) {
      if (err?.cause?.code === '22P02' || err?.message?.includes('invalid input syntax for type uuid')) {
        throw new BadRequestException('Invalid UUID format')
      }
      throw err
    }
  }
}
