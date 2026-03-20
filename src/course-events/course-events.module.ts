import { Module } from '@nestjs/common'
import { CourseEventsController } from './course-events.controller'
import { CourseEventsService } from './course-events.service'

@Module({
  controllers: [CourseEventsController],
  providers: [CourseEventsService],
})
export class CourseEventsModule {}
