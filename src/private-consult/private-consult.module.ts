import { Module } from '@nestjs/common'
import { PrivateConsultController } from './private-consult.controller'
import { PrivateConsultService } from './private-consult.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [PrivateConsultController],
  providers: [PrivateConsultService],
})
export class PrivateConsultModule {}
