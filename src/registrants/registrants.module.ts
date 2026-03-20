import { Module } from '@nestjs/common'
import { RegistrantsController } from './registrants.controller'
import { RegistrantsService } from './registrants.service'

@Module({
  controllers: [RegistrantsController],
  providers: [RegistrantsService],
})
export class RegistrantsModule {}
