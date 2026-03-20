import { Controller, Get, Query } from '@nestjs/common'
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
}
