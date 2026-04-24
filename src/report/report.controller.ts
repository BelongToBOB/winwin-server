import { Controller, Get, Query, Res } from '@nestjs/common'
import type { Response } from 'express'
import { ReportService } from './report.service'

const CSV_HEADERS: Record<string, string[]> = {
  registration_summary: ['ชื่อ', 'นามสกุล', 'ชื่อเล่น', 'อีเมล', 'เบอร์โทร', 'อาชีพ', 'ช่องทาง', 'วงเงินกู้', 'สถานะ', 'วันที่ลงทะเบียน'],
  attendance_sheet:     ['ลำดับ', 'ชื่อ', 'นามสกุล', 'ชื่อเล่น', 'เบอร์โทร', 'ลายเซ็น'],
  loan_profile:         ['ชื่อ', 'นามสกุล', 'ชื่อเล่น', 'เบอร์โทร', 'วงเงินกู้', 'เคยกู้', 'ธนาคาร', 'วัตถุประสงค์', 'ปัญหาการกู้'],
  buc_summary:          ['ลำดับ', 'รหัส BUC', 'ชื่อลูกค้า', 'เบอร์โทร', 'อีเมล', 'LINE ID', 'ยอดเงิน', 'สถานะ', 'วันที่ออก'],
}

const CSV_KEYS: Record<string, string[]> = {
  registration_summary: ['first_name', 'last_name', 'nickname', 'email', 'phone', 'job_category', 'channels', 'loan_amount_range', 'reg_status', 'registered_at'],
  attendance_sheet:     ['_index', 'first_name', 'last_name', 'nickname', 'phone', 'signature'],
  loan_profile:         ['first_name', 'last_name', 'nickname', 'phone', 'loan_amount_range', 'loan_before', 'credit_banks', 'objective', 'loan_problems'],
  buc_summary:          ['_index', 'buc_code', 'customer_name', 'customer_phone', 'customer_email', 'line_id', 'payment_amount', 'status', 'issued_at'],
}

function escapeXml(val: string): string {
  return val.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function escapeCell(val: string, key: string): string {
  if (key === 'phone' && val) {
    // Force Excel/Numbers to treat phone as text, preserving leading zero
    return `="` + val.replace(/"/g, '""') + `"`
  }
  return `"${(val ?? '').replace(/"/g, '""')}"`
}

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('preview')
  getPreview(
    @Query('seminar_id') seminarId: string,
    @Query('type') type: string,
  ) {
    return this.reportService.getPreview(seminarId, type)
  }

  @Get('export')
  async exportReport(
    @Query('seminar_id') seminarId: string,
    @Query('type') type: string,
    @Query('format') format: string,
    @Res() res: Response,
  ) {
    const rows = await this.reportService.getPreview(seminarId, type)
    const keys = CSV_KEYS[type] ?? Object.keys(rows[0] ?? {})

    if (format === 'xml') {
      const xmlRows = rows.map((r, i) => {
        const fields = keys.map((k) => {
          const val = k === '_index' ? String(i + 1) : String(r[k] ?? '')
          return `    <${k}>${escapeXml(val)}</${k}>`
        }).join('\n')
        return `  <row>\n${fields}\n  </row>`
      }).join('\n')

      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<report type="${escapeXml(type)}" seminar_id="${escapeXml(seminarId || '')}">\n${xmlRows}\n</report>`

      res.header('Content-Type', 'application/xml; charset=utf-8')
      res.header('Content-Disposition', `attachment; filename="report-${type}-${seminarId}.xml"`)
      res.send(xml)
      return
    }

    const headers = CSV_HEADERS[type] ?? Object.keys(rows[0] ?? {})

    res.header('Content-Type', 'text/csv; charset=utf-8-sig')
    res.header('Content-Disposition', `attachment; filename="report-${type}-${seminarId}.csv"`)

    if (!rows.length) {
      res.send('\uFEFF' + headers.join(','))
      return
    }

    const lines = [
      '\uFEFF' + headers.join(','),
      ...rows.map((r, i) =>
        keys.map((k) => {
          const val = k === '_index' ? String(i + 1) : (r[k] ?? '')
          return escapeCell(String(val), k)
        }).join(',')
      ),
    ]

    res.send(lines.join('\n'))
  }
}
