import { Controller, Post, Patch, Param, Body } from '@nestjs/common'
import { RegistrationProfilesService } from './registration-profiles.service'

@Controller('registration-profiles')
export class RegistrationProfilesController {
  constructor(private readonly registrationProfilesService: RegistrationProfilesService) {}

  @Post()
  create(@Body() body: any) {
    return this.registrationProfilesService.create(body)
  }

  @Patch(':registrationId')
  update(@Param('registrationId') registrationId: string, @Body() body: any) {
    return this.registrationProfilesService.update(registrationId, body)
  }
}
