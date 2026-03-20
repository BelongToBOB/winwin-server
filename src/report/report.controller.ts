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
    res.header('Content-Type', 'text/csv; charset=utf-8')
    res.header('Content-Disposition', `attachment; filename="report-${type}.csv"`)
    const csv = 'metric,value\n' + rows.map((r) => `"${r.metric}","${r.value}"`).join('\n')
    res.send(csv)
  }
}
