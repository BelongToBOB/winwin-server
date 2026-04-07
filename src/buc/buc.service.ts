import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class BucService {
  constructor(private readonly prisma: PrismaService) {}

  async getNextBucNumber(): Promise<number> {
    const rows = await this.prisma.$queryRaw`
      SELECT COALESCE(MAX(buc_number), 0) + 1 as next_number
      FROM buc_codes
    ` as any[]
    return Number(rows[0].next_number)
  }

  async findAll(status?: string): Promise<any[]> {
    if (status) {
      return this.prisma.$queryRaw`
        SELECT * FROM buc_codes
        WHERE status = ${status}
        ORDER BY buc_number ASC
      `
    }
    return this.prisma.$queryRaw`
      SELECT * FROM buc_codes
      ORDER BY buc_number ASC
    `
  }

  async create(data: {
    customer_name?: string
    customer_phone?: string
    customer_email?: string
    package_name?: string
    notes?: string
    payment_ref?: string
    payment_amount?: number
  }): Promise<any> {
    const nextNum = await this.getNextBucNumber()
    const bucCode = `BUC${String(nextNum).padStart(4, '0')}`
    const rows = await this.prisma.$queryRaw`
      INSERT INTO buc_codes (
        buc_code, buc_number, customer_name, customer_phone,
        customer_email, package_name, notes, payment_ref, payment_amount
      ) VALUES (
        ${bucCode}, ${nextNum}, ${data.customer_name ?? null},
        ${data.customer_phone ?? null}, ${data.customer_email ?? null},
        ${data.package_name ?? 'Bank Uncensored Online'},
        ${data.notes ?? null}, ${data.payment_ref ?? null},
        ${data.payment_amount ?? null}
      )
      RETURNING *
    ` as any[]
    return rows[0]
  }

  async update(id: string, data: {
    customer_name?: string
    customer_phone?: string
    customer_email?: string
    status?: string
    notes?: string
  }): Promise<any> {
    const { customer_name, customer_phone, customer_email, status, notes } = data
    const rows = await this.prisma.$queryRaw`
      UPDATE buc_codes SET
        customer_name = COALESCE(${customer_name ?? null}, customer_name),
        customer_phone = COALESCE(${customer_phone ?? null}, customer_phone),
        customer_email = COALESCE(${customer_email ?? null}, customer_email),
        status = COALESCE(${status ?? null}, status),
        notes = COALESCE(${notes ?? null}, notes),
        registered_at = CASE
          WHEN ${status ?? null} = 'registered' AND registered_at IS NULL
          THEN NOW()
          ELSE registered_at
        END,
        updated_at = NOW()
      WHERE id = ${id}::uuid
      RETURNING *
    ` as any[]
    return rows[0]
  }

  async remove(id: string): Promise<any> {
    await this.prisma.$queryRaw`
      DELETE FROM buc_codes WHERE id = ${id}::uuid
    `
    return { deleted: true }
  }

  async getStats(): Promise<any> {
    const rows = await this.prisma.$queryRaw`
      SELECT
        COUNT(*)::int as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END)::int as pending,
        COUNT(CASE WHEN status = 'registered' THEN 1 END)::int as registered,
        COUNT(CASE WHEN status = 'active' THEN 1 END)::int as active,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END)::int as cancelled,
        COALESCE(MAX(buc_number), 0)::int as last_buc_number
      FROM buc_codes
    ` as any[]
    return rows[0]
  }

  async createFromPayment(data: {
    payment_ref: string
    payment_amount: number
    customer_name?: string
    customer_phone?: string
    customer_email?: string
  }): Promise<any> {
    const existing = await this.prisma.$queryRaw`
      SELECT id FROM buc_codes WHERE payment_ref = ${data.payment_ref} LIMIT 1
    ` as any[]
    if (existing.length > 0) {
      throw new Error(`Payment ref ${data.payment_ref} already exists`)
    }
    return this.create(data)
  }
}
