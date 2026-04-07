import { Controller, Get, Query, Res } from '@nestjs/common'
import type { Response } from 'express'
import { ReportService } from './report.service'

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
    res.header('Content-Type', 'text/csv; charset=utf-8-sig')
    res.header('Content-Disposition', `attachment; filename="report-${type}-${seminarId}.csv"`)
    if (!rows.length) {
      res.send('\uFEFF')
      return
    }
    const headers = Object.keys(rows[0])
    const csv =
      '\uFEFF' +
      headers.join(',') +
      '\n' +
      rows
        .map((r) =>
          headers
            .map((h) => `"${(r[h] ?? '').toString().replace(/"/g, '""')}"`)
            .join(','),
        )
        .join('\n')
    res.send(csv)
  }
}
