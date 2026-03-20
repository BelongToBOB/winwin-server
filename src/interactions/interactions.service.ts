import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class InteractionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByContact(contactId: string) {
    return this.prisma.$queryRaw`
      SELECT * FROM interactions
      WHERE contact_id = ${contactId}::uuid
      ORDER BY interacted_at DESC
    `
  }

  async create(data: {
    contact_id: string
    channel?: string
    direction?: string
    content?: string
    outcome?: string
    created_by?: string
  }) {
    const { contact_id, channel, direction, content,
            outcome, created_by } = data
    return this.prisma.$queryRaw`
      INSERT INTO interactions
        (contact_id, channel, direction, content, outcome, created_by)
      VALUES
        (${contact_id}::uuid, ${channel ?? null}, ${direction ?? null},
         ${content ?? null}, ${outcome ?? null}, ${created_by ?? null})
      RETURNING *
    `
  }

  async remove(id: string) {
    await this.prisma.$queryRaw`
      DELETE FROM interactions WHERE id = ${id}::uuid
    `
    return { deleted: true }
  }
}
