import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './prisma/prisma.module'
import { OverviewModule } from './overview/overview.module'
import { RegistrationsModule } from './registrations/registrations.module'
import { CrmModule } from './crm/crm.module'
import { ReportModule } from './report/report.module'
import { CourseEventsModule } from './course-events/course-events.module'
import { RegistrantsModule } from './registrants/registrants.module'
import { RegistrationProfilesModule } from './registration-profiles/registration-profiles.module'
import { InteractionsModule } from './interactions/interactions.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    OverviewModule,
    RegistrationsModule,
    CrmModule,
    ReportModule,
    CourseEventsModule,
    RegistrantsModule,
    RegistrationProfilesModule,
    InteractionsModule,
  ],
})
export class AppModule {}
