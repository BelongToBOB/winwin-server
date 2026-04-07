import { Controller, Get, Query, Res } from '@nestjs/common'
import type { Response } from 'express'
import { ReportService } from './report.service'

const CSV_HEADERS: Record<string, string[]> = {
  registration_summary: ['ชื่อ', 'นามสกุล', 'ชื่อเล่น', 'อีเมล', 'เบอร์โทร', 'อาชีพ', 'ช่องทาง', 'วงเงินกู้', 'สถานะ', 'วันที่ลงทะเบียน'],
  attendance_sheet:     ['ลำดับ', 'ชื่อ', 'นามสกุล', 'ชื่อเล่น', 'เบอร์โทร', 'ลายเซ็น'],
}

const CSV_KEYS: Record<string, string[]> = {
  registration_summary: ['first_name', 'last_name', 'nickname', 'email', 'phone', 'job_category', 'channels', 'loan_amount_range', 'reg_status', 'registered_at'],
  attendance_sheet:     ['_index', 'first_name', 'last_name', 'nickname', 'phone', 'signature'],
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
    @Query('format') _format: string,
    @Res() res: Response,
  ) {
    const rows = await this.reportService.getPreview(seminarId, type)
    const headers = CSV_HEADERS[type] ?? Object.keys(rows[0] ?? {})
    const keys    = CSV_KEYS[type]    ?? Object.keys(rows[0] ?? {})

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
