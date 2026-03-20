import { Controller, Patch, Param, Body } from '@nestjs/common'
import { RegistrationProfilesService } from './registration-profiles.service'

@Controller('registration-profiles')
export class RegistrationProfilesController {
  constructor(private readonly registrationProfilesService: RegistrationProfilesService) {}

  @Patch(':registrationId')
  update(@Param('registrationId') registrationId: string, @Body() body: any) {
    return this.registrationProfilesService.update(registrationId, body)
  }
}
