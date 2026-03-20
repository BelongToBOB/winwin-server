import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './prisma/prisma.module'
import { OverviewModule } from './overview/overview.module'
import { RegistrationsModule } from './registrations/registrations.module'
import { CrmModule } from './crm/crm.module'
import { ReportModule } from './report/report.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    OverviewModule,
    RegistrationsModule,
    CrmModule,
    ReportModule,
  ],
})
export class AppModule {}
