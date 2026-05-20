import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

const FC_WEBHOOK = 'https://community.winwinwealth.co/community/?fcom_action=incoming_webhook&webhook=dc6da994103c6bc4ac7ea76cf8ca4609'
const FC_SET_PASSWORD = 'https://community.winwinwealth.co/bhc-set-password.php'
const FC_PW_SECRET = 'bhc_pw_reset_7x9k2m'
const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const FROM_EMAIL = 'WinWin Wealth Creation <noreply@winwinwealth.co>'

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
    bhc_code: string
  }): Promise<void> {
    const [first_name, ...rest] = data.full_name.trim().split(' ')
    const last_name = rest.join(' ')
    const user_login = data.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '')

    try {
      // Enroll user (creates WP user if new, enrolls in course/space)
      const params = new URLSearchParams({ email: data.email, first_name, last_name, user_login, user_password: data.bhc_code })
      const res = await fetch(FC_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      })
      this.logger.log(`FC enroll ${data.email}: ${res.status}`)

      // Always set password to BHC code (handles existing users)
      const pwParams = new URLSearchParams({ secret: FC_PW_SECRET, email: data.email, password: data.bhc_code })
      const pwRes = await fetch(FC_SET_PASSWORD, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: pwParams.toString(),
      })
      this.logger.log(`Set password ${data.email}: ${pwRes.status}`)
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
    const loginUrl = 'https://community.winwinwealth.co/community/?fcom_action=auth'
    const lineUrl = 'https://lin.ee/winwinwealth'

    const html = `
      <div style="font-family:'Helvetica Neue',sans-serif;max-width:560px;margin:auto;padding:24px;color:#1a1a1a">
        <div style="text-align:center;margin-bottom:24px">
          <h2 style="color:#1e3a5f;margin:0 0 8px">ยินดีต้อนรับสู่ Business Health Check!</h2>
          <p style="color:#64748b;font-size:14px;margin:0">ตรวจสุขภาพธุรกิจ ด้านบัญชีและการเงิน</p>
        </div>

        <p style="font-size:15px">สวัสดีคุณ${firstName} 🎉</p>
        <p style="font-size:15px">คุณได้ลงทะเบียนเรียน <strong>Business Health Check</strong> เรียบร้อยแล้ว<br/>ข้อมูลสำหรับเข้าสู่ระบบของคุณอยู่ด้านล่างนี้</p>

        <div style="background:linear-gradient(135deg,#1e3a5f 0%,#2d5a9e 100%);color:white;border-radius:12px;padding:24px;margin:24px 0">
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.15)">
                <div style="font-size:11px;opacity:0.7;margin-bottom:4px">Email Address (ใช้เข้าสู่ระบบ)</div>
                <div style="font-size:16px;font-weight:600">${data.email}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0">
                <div style="font-size:11px;opacity:0.7;margin-bottom:4px">Password (รหัสผ่าน)</div>
                <div style="font-size:28px;font-weight:700;letter-spacing:3px">${data.bhc_code}</div>
              </td>
            </tr>
          </table>
        </div>

        <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:20px;margin:24px 0">
          <h3 style="color:#0369a1;margin:0 0 16px;font-size:15px">📌 วิธีเข้าเรียน</h3>
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="vertical-align:top;padding:8px 12px 8px 0;width:32px">
                <div style="background:#0369a1;color:white;width:28px;height:28px;border-radius:50%;text-align:center;line-height:28px;font-weight:700;font-size:14px">1</div>
              </td>
              <td style="padding:8px 0;font-size:14px;color:#334155">
                กดปุ่ม <strong>"เข้าสู่ระบบเรียน"</strong> ด้านล่าง แล้วกรอก<br/>
                <strong>Email:</strong> ${data.email}<br/>
                <strong>Password:</strong> ${data.bhc_code}
              </td>
            </tr>
            <tr>
              <td style="vertical-align:top;padding:8px 12px 8px 0">
                <div style="background:#0369a1;color:white;width:28px;height:28px;border-radius:50%;text-align:center;line-height:28px;font-weight:700;font-size:14px">2</div>
              </td>
              <td style="padding:8px 0;font-size:14px;color:#334155">
                เลือกคอร์ส <strong>Business Health Check</strong> แล้วเริ่มเรียนได้เลย!
              </td>
            </tr>
          </table>
        </div>

        <div style="text-align:center;margin:28px 0">
          <a href="${loginUrl}" style="display:inline-block;background:#1e3a5f;color:white;padding:14px 40px;border-radius:12px;text-decoration:none;font-size:16px;font-weight:600">
            เข้าสู่ระบบเรียน
          </a>
        </div>

        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>

        <p style="color:#64748b;font-size:13px;text-align:center">
          หากมีคำถามหรือต้องการความช่วยเหลือ<br/>
          <a href="${lineUrl}" style="color:#06C755;font-weight:600;text-decoration:none">💬 ติดต่อทีมงาน LINE @winwinwealth</a>
        </p>
        <p style="color:#94a3b8;font-size:12px;text-align:center">ทีมงาน WinWin Wealth Creation</p>
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

    // Check duplicate email
    const existing = await this.prisma.$queryRaw<any[]>`
      SELECT bhc_code, full_name, email FROM bhc_registrations
      WHERE email = ${email}
      ORDER BY created_at DESC LIMIT 1
    `
    if (existing.length > 0) {
      const ex = existing[0]
      this.logger.log(`Duplicate email ${email} — returning existing ${ex.bhc_code}`)
      this.sendWelcomeEmail({ email: ex.email, full_name: ex.full_name, bhc_code: ex.bhc_code })
      return { bhc_code: ex.bhc_code, full_name: ex.full_name, email: ex.email, existing: true }
    }

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
    this.enrollFluentCommunity({ email, full_name, bhc_code }).then(async () => {
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
