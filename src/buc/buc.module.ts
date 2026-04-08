import { Module } from '@nestjs/common'
import { BucController } from './buc.controller'
import { BucService } from './buc.service'
import { PrismaModule } from '../prisma/prisma.module'
import { CloudinaryModule } from '../cloudinary/cloudinary.module'

@Module({
  imports: [PrismaModule, CloudinaryModule],
  controllers: [BucController],
  providers: [BucService],
})
export class BucModule {}
