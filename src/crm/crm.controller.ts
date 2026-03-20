import { Controller, Get, Query } from '@nestjs/common'
import { CrmService } from './crm.service'

@Controller('crm')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Get('stages')
  getStages() {
    return this.crmService.getStages()
  }

  @Get('followups')
  getFollowups(
    @Query('seminar_id') seminarId?: string,
    @Query('overdue_only') overdueOnly?: string,
  ) {
    return this.crmService.getFollowups(seminarId, overdueOnly)
  }
}
