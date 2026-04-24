import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { BhcRegistrationsController } from './bhc-registrations.controller'
import { BhcRegistrationsService } from './bhc-registrations.service'

@Module({
  imports: [PrismaModule],
  controllers: [BhcRegistrationsController],
  providers: [BhcRegistrationsService],
})
export class BhcRegistrationsModule {}
