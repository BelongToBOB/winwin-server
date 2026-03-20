import { Controller, Get, Query } from '@nestjs/common'
import { OverviewService } from './overview.service'

@Controller('overview')
export class OverviewController {
  constructor(private readonly overviewService: OverviewService) {}

  @Get()
  getOverview(@Query('seminar_id') seminarId?: string) {
    return this.overviewService.getOverview(seminarId)
  }
}
