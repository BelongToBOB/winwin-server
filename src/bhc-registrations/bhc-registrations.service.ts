import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

const FC_WEBHOOK = 'https://community.winwinwealth.co/community/?fcom_action=incoming_webhook&webhook=75573f5c28d8c7fee1ed7549e942b1b6'
const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const FROM_EMAIL = 'noreply@winwinwealth.co'

@Injectable()
export class BhcRegistrationsService {
  private readonly logger = new Logger(BhcRegistrationsService.name)
  constructor(private readonly prisma: PrismaService) {}

  // ─── Generate BHC code ───────────────────────────────────────────────────
  private async generateBhcCode(): Promise<string> {
    const rows = await this.prisma.$queryRaw<{ max_num: number | null }[]>`
      SELECT MAX(
        CASE WHEN bhc_code ~ '^BHC-[0-9]+$'
          THEN CAST(SUBSTRING(bhc_code FROM 5) AS INTEGER)
          ELSE 0
        END
      ) AS max_num
      FROM bhc_registrations
    `
    const next = (rows[0]?.max_num ?? 0) + 1
    return `BHC-${String(next).padStart(3, '0')}`
  }

  // ─── Enroll Fluent Community ──────────────────────────────────────────────
  private async enrollFluentCommunity(data: {
    email: string
    full_name: string
  }): Promise<void> {
    const [first_name, ...rest] = data.full_name.trim().split(' ')
    const last_name = rest.join(' ')
    const user_login = data.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '')

    try {
      const res = await fetch(FC_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, first_name, last_name, user_login }),
      })
      this.logger.log(`FC enroll ${data.email}: ${res.status}`)
    } catch (err) {
      this.logger.error(`FC enroll failed for ${data.email}:`, err)
    }
  }

  // ─── Send welcome email via Resend ────────────────────────────────────────
  private async sendWelcomeEmail(data: {
    email: string
    full_name: string
    bhc_code: string
  }): Promise<void> {
    const firstName = data.full_name.trim().split(' ')[0]
    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:24px">
        <h2 style="color:#1e3a5f">ยินดีต้อนรับสู่ Business Health Check! 🎉</h2>
        <p>สวัสดีคุณ${firstName},</p>
        <p>คุณได้ลงทะเบียนเรียน <strong>Business Health Check</strong> เรียบร้อยแล้ว</p>

        <div style="background:#1e3a5f;color:white;border-radius:12px;padding:20px;text-align:center;margin:24px 0">
          <div style="font-size:12px;opacity:0.8;margin-bottom:6px">รหัสเข้าเรียนของคุณ</div>
          <div style="font-size:32px;font-weight:700;letter-spacing:4px">${data.bhc_code}</div>
          <div style="font-size:11px;opacity:0.7;margin-top:6px">เก็บรหัสนี้ไว้ใช้เข้าระบบเรียนออนไลน์</div>
        </div>

        <h3>ขั้นตอนต่อไป</h3>
        <ol style="line-height:2;color:#334155">
          <li>เข้าเรียนออนไลน์ที่ <a href="https://community.winwinwealth.co">community.winwinwealth.co</a></li>
          <li>ใช้รหัส <strong>${data.bhc_code}</strong> เมื่อระบบถาม</li>
          <li>เข้ากลุ่ม Facebook ตามที่ทีมงานแจ้ง</li>
        </ol>

        <p style="color:#64748b;font-size:13px">หากมีคำถาม ติดต่อทีมงานที่ LINE @winwinwealth</p>
        <p style="color:#64748b;font-size:13px">ทีมงาน WinWin Wealth Creation</p>
      </div>
    `

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [data.email],
          subject: `รหัสเข้าเรียน Business Health Check: ${data.bhc_code}`,
          html,
        }),
      })
      this.logger.log(`Email sent to ${data.email}: ${res.status}`)
    } catch (err) {
      this.logger.error(`Email failed for ${data.email}:`, err)
    }
  }

  // ─── findAll ─────────────────────────────────────────────────────────────
  async findAll(event_id?: string) {
    const eid = event_id || null
    return this.prisma.$queryRaw<any[]>`
      SELECT
        id::text, event_id, bhc_code, full_name, nickname,
        phone, email, facebook_name, accounting_problem,
        channel, course_accept, copyright_accept,
        enrolled_at::text, email_sent_at::text, created_at::text
      FROM bhc_registrations
      WHERE (${eid}::text IS NULL OR event_id = ${eid})
      ORDER BY created_at DESC
    `
  }

  // ─── create ──────────────────────────────────────────────────────────────
  async create(data: {
    event_id?: string
    full_name: string
    nickname: string
    phone: string
    email: string
    facebook_name: string
    accounting_problem: string
    channel: string
    course_accept: string
    copyright_accept: string
  }) {
    const { event_id, full_name, nickname, phone, email,
      facebook_name, accounting_problem, channel,
      course_accept, copyright_accept } = data

    // 1. Generate BHC code
    const bhc_code = await this.generateBhcCode()

    // 2. Insert to DB
    const rows = await this.prisma.$queryRaw<any[]>`
      INSERT INTO bhc_registrations
        (event_id, bhc_code, full_name, nickname, phone, email, facebook_name,
         accounting_problem, channel, course_accept, copyright_accept)
      VALUES (
        ${event_id ?? 'BHC_2026'}, ${bhc_code},
        ${full_name}, ${nickname}, ${phone}, ${email}, ${facebook_name},
        ${accounting_problem}, ${channel}, ${course_accept}, ${copyright_accept}
      )
      RETURNING id::text, bhc_code, full_name, email
    `
    const record = rows[0]

    // 3. Enroll Fluent Community (fire-and-forget)
    this.enrollFluentCommunity({ email, full_name }).then(async () => {
      await this.prisma.$queryRaw`
        UPDATE bhc_registrations SET enrolled_at = NOW()
        WHERE id = ${record.id}::uuid
      `
    })

    // 4. Send welcome email (fire-and-forget)
    this.sendWelcomeEmail({ email, full_name, bhc_code }).then(async () => {
      await this.prisma.$queryRaw`
        UPDATE bhc_registrations SET email_sent_at = NOW()
        WHERE id = ${record.id}::uuid
      `
    })

    return { bhc_code, full_name, email }
  }

  // ─── update ──────────────────────────────────────────────────────────────
  async update(id: string, data: Partial<{
    full_name: string; nickname: string; phone: string
    email: string; facebook_name: string; accounting_problem: string; channel: string
  }>) {
    const current = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM bhc_registrations WHERE id = ${id}::uuid
    `
    if (!current.length) return []
    const c = current[0]
    return this.prisma.$queryRaw`
      UPDATE bhc_registrations SET
        full_name = ${data.full_name ?? c.full_name},
        nickname = ${data.nickname ?? c.nickname},
        phone = ${data.phone ?? c.phone},
        email = ${data.email ?? c.email},
        facebook_name = ${data.facebook_name ?? c.facebook_name},
        accounting_problem = ${data.accounting_problem ?? c.accounting_problem},
        channel = ${data.channel ?? c.channel}
      WHERE id = ${id}::uuid
      RETURNING *
    `
  }

  // ─── remove ──────────────────────────────────────────────────────────────
  async remove(id: string) {
    await this.prisma.$queryRaw`
      DELETE FROM bhc_registrations WHERE id = ${id}::uuid
    `
    return { deleted: true }
  }

  // ─── stats ───────────────────────────────────────────────────────────────
  async stats(event_id?: string) {
    const eid = event_id || null
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT
        COUNT(*)::int AS total,
        COUNT(CASE WHEN enrolled_at IS NOT NULL THEN 1 END)::int AS enrolled,
        COUNT(CASE WHEN email_sent_at IS NOT NULL THEN 1 END)::int AS email_sent
      FROM bhc_registrations
      WHERE (${eid}::text IS NULL OR event_id = ${eid})
    `
    return rows[0]
  }
}
