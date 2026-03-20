import { Controller, Get, Patch, Query, Param, Body } from '@nestjs/common'
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

  @Patch('contacts/:id')
  updateContact(@Param('id') id: string, @Body() body: any) {
    return this.crmService.updateContact(id, body)
  }
}
