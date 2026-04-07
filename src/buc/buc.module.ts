import { Module } from '@nestjs/common'
import { BucController } from './buc.controller'
import { BucService } from './buc.service'

@Module({
  controllers: [BucController],
  providers: [BucService],
})
export class BucModule {}
