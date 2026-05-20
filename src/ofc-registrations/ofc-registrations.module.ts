import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { OfcRegistrationsController } from './ofc-registrations.controller'
import { OfcRegistrationsService } from './ofc-registrations.service'

@Module({
  imports: [PrismaModule],
  controllers: [OfcRegistrationsController],
  providers: [OfcRegistrationsService],
})
export class OfcRegistrationsModule {}
