import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CloudinaryService } from '../cloudinary/cloudinary.service'
import axios from 'axios'

@Injectable()
export class BucService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async getNextBucNumber(): Promise<number> {
    const rows = await this.prisma.$queryRaw`
      SELECT nextval('buc_number_seq')::int as next_number
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
    const isMock = process.env.EASYSLIP_MOCK === 'true'
    const minAmount = Number(process.env.MIN_PAYMENT_AMOUNT || 4990)

    if (isMock) {
      const nextNum = await this.getNextBucNumber()
      const bucCode = `BUC${String(nextNum).padStart(4, '0')}`
      const mockTransRef = `MOCK_${Date.now()}`
      await this.prisma.$queryRaw`
        INSERT INTO buc_codes (
          buc_code, buc_number, customer_name, customer_phone,
          customer_email, status, payment_ref, payment_amount,
          slip_url, issued_at, updated_at
        ) VALUES (
          ${bucCode}, ${nextNum},
          ${data.customer_name}, ${data.customer_phone},
          ${data.customer_email ?? null},
          'pending',
          ${mockTransRef},
          ${minAmount},
          ${'mock://no-slip'},
          NOW(), NOW()
        )
      `
      return {
        success: true,
        buc_code: bucCode,
        form_url: `https://bucform.winwinwealth.co?buc=${bucCode}`,
        amount: minAmount,
        mock: true,
      }
    }

    const easySlipKey = process.env.EASYSLIP_API_KEY
    const apiUrl = 'https://api.easyslip.com/v2/verify/bank'

    // 1. Upload slip to Cloudinary first (non-blocking)
    let slipUrl: string | null = null
    try {
      const tempId = `pending_${Date.now()}`
      slipUrl = await this.cloudinaryService.uploadSlip(data.slip_image, tempId)
      console.log(`[Cloudinary] Uploaded slip: ${slipUrl}`)
    } catch (uploadErr: any) {
      console.error('[Cloudinary] Upload failed:', uploadErr?.message)
    }

    // 2. Call EasySlip API
    const base64WithPrefix = data.slip_image.startsWith('data:')
      ? data.slip_image
      : `data:image/jpeg;base64,${data.slip_image}`

    console.log(`[EasySlip] Calling: ${apiUrl}`)
    console.log(`[EasySlip] base64 length: ${base64WithPrefix.length}`)
    console.log(`[EasySlip] Request keys: ${JSON.stringify(Object.keys({ base64: true, checkDuplicate: true }))}`)
    console.log(`[EasySlip] API key present: ${!!easySlipKey}, length: ${easySlipKey?.length ?? 0}`)

    try {
      const nextNum = await this.getNextBucNumber()
      const bucCode = `BUC${String(nextNum).padStart(4, '0')}`

      const response = await axios.post(
        apiUrl,
        {
          base64: base64WithPrefix,
          checkDuplicate: true,
          matchAccount: true,
        },
        {
          headers: {
            Authorization: `Bearer ${easySlipKey}`,
            'Content-Type': 'application/json',
          },
        }
      )

      console.log(`[EasySlip] Response status: ${response.status}`)
      console.log(`[EasySlip] Response data: ${JSON.stringify(response.data)}`)

      const slip = response.data
      const rawSlip = slip?.data?.rawSlip
      const amount = rawSlip?.amount?.amount || 0
      const transRef = rawSlip?.transRef || ''

      // Log sender/receiver info for visibility
      const senderBank = rawSlip?.sender?.bank?.short
      const receiverBank = rawSlip?.receiver?.bank?.short
      const senderName = rawSlip?.sender?.account?.name?.th
      console.log(`[EasySlip] transRef=${transRef} amount=${amount} from=${senderName}(${senderBank}) to=${receiverBank}`)

      // Check receiver account — use EasySlip matchedAccount if available, fallback to manual check
      const matchedAccount = slip?.data?.matchedAccount
      const receiverName = rawSlip?.receiver?.account?.name?.th || rawSlip?.receiver?.account?.name?.en || ''
      const expectedName = process.env.EASYSLIP_RECEIVER_BANK || ''

      console.log(`[EasySlip] matchedAccount=${JSON.stringify(matchedAccount)} receiverName=${receiverName}`)

      if (matchedAccount) {
        // EasySlip matched against portal-registered accounts — trust this result
        console.log(`[EasySlip] Account matched via portal: ${matchedAccount.nameTh || matchedAccount.nameEn}`)
      } else {
        // No portal match — do manual name check
        // Normalize: remove prefixes like บจก., นาย, นาง etc. and compare core name
        const normalize = (s: string) => s.replace(/^(บจก\.|บมจ\.|หจก\.|นาย|นาง|นางสาว|mr\.|mrs\.|ms\.)\s*/gi, '').trim().toLowerCase()
        const normalizedReceiver = normalize(receiverName)
        const normalizedExpected = normalize(expectedName)

        // Check if the core part of expected name appears in receiver name
        const expectedWords = normalizedExpected.split(/\s+/).filter(w => w.length > 2)
        const hasNameMatch = expectedWords.length > 0 && expectedWords.every(word => normalizedReceiver.includes(word))

        if (!hasNameMatch) {
          console.log(`[EasySlip] Receiver mismatch: receiverName="${receiverName}" expectedName="${expectedName}" normalizedReceiver="${normalizedReceiver}" expectedWords=${JSON.stringify(expectedWords)}`)
          return {
            success: false,
            error: `บัญชีผู้รับไม่ถูกต้อง (${receiverName || 'ไม่ทราบ'}) กรุณาโอนเข้าบัญชีที่กำหนดเท่านั้น`,
          }
        }
      }

      // Check EasySlip built-in duplicate flag
      if (slip?.data?.isDuplicate) {
        return { success: false, error: 'สลิปนี้ถูกใช้งานแล้ว' }
      }

      if (amount < minAmount) {
        return {
          success: false,
          error: 'ยอดโอนไม่ถูกต้อง',
        }
      }

      // DB duplicate check as backup
      if (transRef) {
        const existing = await this.prisma.$queryRaw`
          SELECT id FROM buc_codes WHERE payment_ref = ${transRef} LIMIT 1
        ` as any[]
        if (existing.length > 0) {
          return { success: false, error: 'สลิปนี้ถูกใช้งานแล้ว' }
        }
      }

      await this.prisma.$queryRaw`
        INSERT INTO buc_codes (
          buc_code, buc_number, customer_name, customer_phone,
          customer_email, status, payment_ref, payment_amount,
          slip_url, issued_at, updated_at
        ) VALUES (
          ${bucCode}, ${nextNum},
          ${data.customer_name}, ${data.customer_phone},
          ${data.customer_email ?? null},
          'pending',
          ${transRef || null},
          ${amount},
          ${slipUrl},
          NOW(), NOW()
        )
      `

      return {
        success: true,
        buc_code: bucCode,
        form_url: `https://bucform.winwinwealth.co?buc=${bucCode}`,
        amount,
      }
    } catch (err: any) {
      console.error(`[EasySlip] Error status: ${err?.response?.status}`)
      console.error(`[EasySlip] Error response data: ${JSON.stringify(err?.response?.data)}`)
      console.error(`[EasySlip] Error config headers: ${JSON.stringify(err?.config?.headers)}`)
      if (err?.response?.status === 400 || err?.response?.status === 404) {
        return { success: false, error: 'ไม่สามารถอ่านสลิปได้ กรุณาตรวจสอบรูปภาพและลองใหม่' }
      }
      if (err?.response?.status === 401) {
        return { success: false, error: 'เกิดข้อผิดพลาดในระบบ (401)' }
      }
      if (err?.response?.status === 422) {
        return { success: false, error: 'สลิปไม่ถูกต้องหรือหมดอายุ' }
      }
      if (err?.response?.status === 429) {
        return { success: false, error: 'ระบบยุ่งอยู่ กรุณาลองใหม่อีกครั้ง' }
      }
      throw err
    }
  }

  async manualVerify(data: {
    customer_name: string
    customer_phone: string
    customer_email?: string
    payment_amount: number
    payment_ref?: string
    slip_image?: string
    notes?: string
  }): Promise<any> {
    // 1. Upload slip to Cloudinary (ถ้ามี)
    let slipUrl: string | null = null
    if (data.slip_image) {
      try {
        const tempId = `manual_${Date.now()}`
        slipUrl = await this.cloudinaryService.uploadSlip(data.slip_image, tempId)
        console.log(`[ManualVerify] Uploaded slip: ${slipUrl}`)
      } catch (uploadErr: any) {
        console.error('[ManualVerify] Upload failed:', uploadErr?.message)
      }
    }

    // 2. Gen BUC code + INSERT
    const nextNum = await this.getNextBucNumber()
    const bucCode = `BUC${String(nextNum).padStart(4, '0')}`
    const paymentRef = data.payment_ref || `MANUAL_${Date.now()}`

    await this.prisma.$queryRaw`
      INSERT INTO buc_codes (
        buc_code, buc_number, customer_name, customer_phone,
        customer_email, status, payment_ref, payment_amount,
        slip_url, notes, issued_at, updated_at
      ) VALUES (
        ${bucCode}, ${nextNum},
        ${data.customer_name}, ${data.customer_phone},
        ${data.customer_email ?? null},
        'pending',
        ${paymentRef},
        ${data.payment_amount},
        ${slipUrl},
        ${data.notes ?? 'Manual verify by admin'},
        NOW(), NOW()
      )
    `

    return {
      success: true,
      buc_code: bucCode,
      form_url: `https://bucform.winwinwealth.co?buc=${bucCode}`,
      amount: data.payment_amount,
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

  async submitRegistration(data: {
    buc_code: string
    full_name?: string
    phone?: string
    email?: string
    line_id?: string
    source?: string[]
    skill_level?: string
    goal?: string[]
    interested_topics?: string
    consent_promo?: boolean
    needs_receipt?: boolean
    receipt_name?: string
    receipt_address?: string
    receipt_tax_id?: string
    receipt_type?: string
    receipt_email?: string
    needs_withholding?: boolean
    withholding_contact?: string
    withholding_acknowledged?: boolean
  }): Promise<any> {
    const { buc_code, full_name, phone, email, ...fields } = data

    const rows = await this.prisma.$queryRaw`
      SELECT id, status FROM buc_codes WHERE buc_code = ${buc_code} LIMIT 1
    ` as any[]

    if (rows.length === 0) {
      return { success: false, error: 'ไม่พบรหัสนี้ในระบบ' }
    }
    if (rows[0].status === 'registered') {
      return { success: false, error: 'รหัสนี้ถูกใช้งานแล้ว' }
    }

    const notes = JSON.stringify({
      source: fields.source ?? [],
      skill_level: fields.skill_level ?? null,
      goal: fields.goal ?? [],
      interested_topics: fields.interested_topics ?? null,
      consent_promo: fields.consent_promo ?? false,
    })

    await this.prisma.$queryRaw`
      UPDATE buc_codes SET
        customer_name = COALESCE(${full_name ?? null}, customer_name),
        customer_phone = COALESCE(${phone ?? null}, customer_phone),
        customer_email = COALESCE(${email ?? null}, customer_email),
        line_id = ${fields.line_id ?? null},
        status = 'registered',
        notes = ${notes},
        needs_receipt = ${fields.needs_receipt ?? false},
        receipt_name = ${fields.receipt_name ?? null},
        receipt_address = ${fields.receipt_address ?? null},
        receipt_tax_id = ${fields.receipt_tax_id ?? null},
        receipt_type = ${fields.receipt_type ?? null},
        receipt_email = ${fields.receipt_email ?? null},
        needs_withholding = ${fields.needs_withholding ?? false},
        withholding_contact = ${fields.withholding_contact ?? null},
        withholding_acknowledged = ${fields.withholding_acknowledged ?? false},
        registered_at = COALESCE(registered_at, NOW()),
        updated_at = NOW()
      WHERE buc_code = ${buc_code}
    `

    return { success: true, buc_code }
  }
}
