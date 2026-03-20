import { Module } from '@nestjs/common'
import { RegistrationProfilesController } from './registration-profiles.controller'
import { RegistrationProfilesService } from './registration-profiles.service'

@Module({
  controllers: [RegistrationProfilesController],
  providers: [RegistrationProfilesService],
})
export class RegistrationProfilesModule {}
