import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

const FC_WEBHOOK = 'https://community.winwinwealth.co/community/?fcom_action=incoming_webhook&webhook=bc38c7ef3d765c38dd64182c014cf6cd'
const FC_SET_PASSWORD = 'https://community.winwinwealth.co/bhc-set-password.php'
const FC_PW_SECRET = 'bhc_pw_reset_7x9k2m'
const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const FROM_EMAIL = 'WinWin Wealth Creation <noreply@winwinwealth.co>'

@Injectable()
export class OfcRegistrationsService {
  private readonly logger = new Logger(OfcRegistrationsService.name)
  constructor(private readonly prisma: PrismaService) {}

  private async generateOfcCode(): Promise<string> {
    const rows = await this.prisma.$queryRaw<{ max_num: number | null }[]>`
      SELECT MAX(
        CASE WHEN ofc_code ~ '^OFC-[0-9]+$'
          THEN CAST(SUBSTRING(ofc_code FROM 5) AS INTEGER)
          ELSE 0
        END
      ) AS max_num
      FROM ofc_registrations
    `
    const next = (rows[0]?.max_num ?? 0) + 1
    return `OFC-${String(next).padStart(3, '0')}`
  }

  private async enrollFluentCommunity(data: {
    email: string
    full_name: string
    ofc_code: string
  }): Promise<void> {
    const [first_name, ...rest] = data.full_name.trim().split(' ')
    const last_name = rest.join(' ')
    const user_login = data.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '')

    try {
      const params = new URLSearchParams({ email: data.email, first_name, last_name, user_login, user_password: data.ofc_code })
      const res = await fetch(FC_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      })
      this.logger.log(`FC enroll ${data.email}: ${res.status}`)

      const pwParams = new URLSearchParams({ secret: FC_PW_SECRET, email: data.email, password: data.ofc_code })
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

  private async sendWelcomeEmail(data: {
    email: string
    full_name: string
    ofc_code: string
  }): Promise<void> {
    const firstName = data.full_name.trim().split(' ')[0]
    const autoLoginUrl = `https://community.winwinwealth.co/auto-login.php?email=${encodeURIComponent(data.email)}&token=${encodeURIComponent(data.ofc_code)}`
    const loginUrl = 'https://community.winwinwealth.co/community/?fcom_action=auth'
    const lineUrl = 'https://page.line.me/591xftzn?openQrModal=true'

    const html = `
      <div style="font-family:'Helvetica Neue',sans-serif;max-width:560px;margin:auto;padding:24px;color:#1a1a1a">
        <div style="text-align:center;margin-bottom:24px">
          <h2 style="color:#1e3a5f;margin:0 0 8px">ยินดีต้อนรับสู่ Owner Finance Check!</h2>
          <p style="color:#64748b;font-size:14px;margin:0">เรียนรู้การปิดงบการเงินธุรกิจ เพื่อตัดสินใจได้อย่างมั่นใจ</p>
        </div>

        <p style="font-size:15px">สวัสดีคุณ${firstName}</p>
        <p style="font-size:15px">คุณได้ลงทะเบียนเรียน <strong>Owner Finance Check</strong> เรียบร้อยแล้ว<br/>ข้อมูลสำหรับเข้าสู่ระบบของคุณอยู่ด้านล่างนี้</p>

        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin:24px 0">
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #e2e8f0">
                <div style="font-size:11px;color:#94a3b8;margin-bottom:4px">Email Address</div>
                <div style="font-size:16px;font-weight:600;color:#1e293b">${data.email}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0">
                <div style="font-size:11px;color:#94a3b8;margin-bottom:4px">Password</div>
                <div style="font-size:28px;font-weight:700;letter-spacing:3px;color:#1e3a5f">${data.ofc_code}</div>
              </td>
            </tr>
          </table>
        </div>

        <div style="text-align:center;margin:24px 0">
          <a href="${autoLoginUrl}" style="display:inline-block;background:#fbbf24;color:#1a1a5e;padding:14px 40px;border-radius:30px;text-decoration:none;font-size:16px;font-weight:600">
            เข้าเรียนเลย
          </a>
          <br/><br/>
          <a href="${lineUrl}" style="display:inline-block;background:#00B900;color:#ffffff;padding:12px 28px;border-radius:30px;text-decoration:none;font-weight:bold;font-size:14px">Add LINE @WIN_WIN</a>
        </div>

        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 16px;margin:0 0 16px;font-size:13px;color:#854d0e">
          <strong>กรุณาแคปหน้าจอนี้ไว้สำหรับเข้าเรียนในรอบถัดไป</strong><br/><br/>
          Email: <strong>${data.email}</strong><br/>
          Password: <strong>${data.ofc_code}</strong><br/>
          ลิงก์เข้าเรียน: <a href="${loginUrl}" style="color:#854d0e;font-weight:bold">${loginUrl}</a>
        </div>

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
          subject: `รหัสเข้าเรียน Owner Finance Check: ${data.ofc_code}`,
          html,
        }),
      })
      this.logger.log(`Email sent to ${data.email}: ${res.status}`)
    } catch (err) {
      this.logger.error(`Email failed for ${data.email}:`, err)
    }
  }

  async findAll(event_id?: string) {
    const eid = event_id || null
    return this.prisma.$queryRaw<any[]>`
      SELECT
        id::text, event_id, ofc_code, full_name, nickname,
        phone, email, enrolled_at::text, email_sent_at::text, created_at::text
      FROM ofc_registrations
      WHERE (${eid}::text IS NULL OR event_id = ${eid})
      ORDER BY created_at DESC
    `
  }

  async create(data: {
    event_id?: string
    full_name: string
    nickname: string
    phone: string
    email: string
  }) {
    const { event_id, full_name, nickname, phone, email } = data

    // Check duplicate email
    const existing = await this.prisma.$queryRaw<any[]>`
      SELECT ofc_code, full_name, email FROM ofc_registrations
      WHERE email = ${email}
      ORDER BY created_at DESC LIMIT 1
    `
    if (existing.length > 0) {
      const ex = existing[0]
      this.logger.log(`Duplicate email ${email} — returning existing ${ex.ofc_code}`)
      // Resend welcome email with existing code
      this.sendWelcomeEmail({ email: ex.email, full_name: ex.full_name, ofc_code: ex.ofc_code })
      return { ofc_code: ex.ofc_code, full_name: ex.full_name, email: ex.email, existing: true }
    }

    const ofc_code = await this.generateOfcCode()

    const rows = await this.prisma.$queryRaw<any[]>`
      INSERT INTO ofc_registrations
        (event_id, ofc_code, full_name, nickname, phone, email)
      VALUES (
        ${event_id ?? 'OFC_2026'}, ${ofc_code},
        ${full_name}, ${nickname}, ${phone}, ${email}
      )
      RETURNING id::text, ofc_code, full_name, email
    `
    const record = rows[0]

    this.enrollFluentCommunity({ email, full_name, ofc_code }).then(async () => {
      await this.prisma.$queryRaw`
        UPDATE ofc_registrations SET enrolled_at = NOW()
        WHERE id = ${record.id}::uuid
      `
    })

    this.sendWelcomeEmail({ email, full_name, ofc_code }).then(async () => {
      await this.prisma.$queryRaw`
        UPDATE ofc_registrations SET email_sent_at = NOW()
        WHERE id = ${record.id}::uuid
      `
    })

    return { ofc_code, full_name, email }
  }

  async remove(id: string) {
    await this.prisma.$queryRaw`
      DELETE FROM ofc_registrations WHERE id = ${id}::uuid
    `
    return { deleted: true }
  }

  async stats(event_id?: string) {
    const eid = event_id || null
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT
        COUNT(*)::int AS total,
        COUNT(CASE WHEN enrolled_at IS NOT NULL THEN 1 END)::int AS enrolled,
        COUNT(CASE WHEN email_sent_at IS NOT NULL THEN 1 END)::int AS email_sent
      FROM ofc_registrations
      WHERE (${eid}::text IS NULL OR event_id = ${eid})
    `
    return rows[0]
  }
}
