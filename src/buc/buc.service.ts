import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import axios from 'axios'

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

  async verifyPayment(data: {
    slip_image: string
    customer_name: string
    customer_phone: string
    customer_email?: string
  }): Promise<any> {
    const easySlipKey = process.env.EASYSLIP_API_KEY
    const isSandbox = process.env.EASYSLIP_SANDBOX === 'true'
    const minAmount = Number(process.env.MIN_PAYMENT_AMOUNT || 4990)

    const apiUrl = isSandbox
      ? 'https://developer.easyslip.com/api/v1/verify'
      : 'https://api.easyslip.com/api/v1/verify'

    try {
      const response = await axios.post(
        apiUrl,
        { image: data.slip_image },
        {
          headers: {
            Authorization: `Bearer ${easySlipKey}`,
            'Content-Type': 'application/json',
          },
        }
      )

      const slip = response.data
      const amount = slip?.data?.amount?.amount || 0
      const transRef = slip?.data?.transRef || ''

      if (amount < minAmount) {
        return {
          success: false,
          error: `ยอดโอนไม่ถูกต้อง (${amount} บาท) ต้องการอย่างน้อย ${minAmount} บาท`,
        }
      }

      if (transRef) {
        const existing = await this.prisma.$queryRaw`
          SELECT id FROM buc_codes WHERE payment_ref = ${transRef} LIMIT 1
        ` as any[]
        if (existing.length > 0) {
          return { success: false, error: 'สลิปนี้ถูกใช้งานแล้ว' }
        }
      }

      const nextNum = await this.getNextBucNumber()
      const bucCode = `BUC${String(nextNum).padStart(4, '0')}`

      await this.prisma.$queryRaw`
        INSERT INTO buc_codes (
          buc_code, buc_number, customer_name, customer_phone,
          customer_email, status, payment_ref, payment_amount,
          issued_at, updated_at
        ) VALUES (
          ${bucCode}, ${nextNum},
          ${data.customer_name}, ${data.customer_phone},
          ${data.customer_email ?? null},
          'pending',
          ${transRef || null},
          ${amount},
          NOW(), NOW()
        )
      `

      return {
        success: true,
        buc_code: bucCode,
        form_url: `https://buc.winwinwealth.co?buc=${bucCode}`,
        amount,
      }
    } catch (err: any) {
      if (err?.response?.status === 400 || err?.response?.status === 404) {
        return {
          success: false,
          error: 'ไม่สามารถอ่านสลิปได้ กรุณาตรวจสอบรูปภาพและลองใหม่',
        }
      }
      if (err?.response?.status === 401) {
        return {
          success: false,
          error: 'เกิดข้อผิดพลาดในระบบ กรุณาติดต่อแอดมิน (401)',
        }
      }
      throw err
    }
  }

  async validateBucCode(bucCode: string): Promise<any> {
    const rows = await this.prisma.$queryRaw`
      SELECT id, buc_code, status, customer_name
      FROM buc_codes
      WHERE buc_code = ${bucCode}
      LIMIT 1
    ` as any[]

    if (rows.length === 0) {
      return { valid: false, error: 'ไม่พบรหัสนี้ในระบบ' }
    }

    const buc = rows[0]

    if (buc.status === 'registered') {
      return { valid: false, status: 'registered', error: 'รหัสนี้ถูกใช้งานแล้ว' }
    }

    if (buc.status === 'cancelled') {
      return { valid: false, status: 'cancelled', error: 'รหัสนี้ถูกยกเลิก' }
    }

    return {
      valid: true,
      status: buc.status,
      customer_name: buc.customer_name,
    }
  }

  async registerBucCode(bucCode: string): Promise<any> {
    await this.prisma.$queryRaw`
      UPDATE buc_codes
      SET status = 'registered', registered_at = NOW(), updated_at = NOW()
      WHERE buc_code = ${bucCode} AND status = 'pending'
    `
    return { success: true }
  }
}
