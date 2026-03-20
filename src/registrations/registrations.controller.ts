import { Controller, Get, Patch, Delete, Param, Query, Body } from '@nestjs/common'
import { RegistrationsService } from './registrations.service'

@Controller('registrations')
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Get()
  getRegistrations(
    @Query('seminar_id') seminarId?: string,
    @Query('status') status?: string,
    @Query('job') job?: string,
    @Query('loan_range') loanRange?: string,
    @Query('q') q?: string,
  ) {
    return this.registrationsService.getRegistrations({
      seminar_id: seminarId,
      status,
      job,
      loan_range: loanRange,
      q,
    })
  }

  @Patch(':id')
  updateStatus(@Param('id') id: string, @Body() body: { reg_status: string }) {
    return this.registrationsService.updateStatus(id, body.reg_status)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.registrationsService.remove(id)
  }
}
