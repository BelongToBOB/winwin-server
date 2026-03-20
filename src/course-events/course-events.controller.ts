import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common'
import { CourseEventsService } from './course-events.service'

@Controller('course-events')
export class CourseEventsController {
  constructor(private readonly courseEventsService: CourseEventsService) {}

  @Get()
  findAll() {
    return this.courseEventsService.findAll()
  }

  @Post()
  create(@Body() body: any) {
    return this.courseEventsService.create(body)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.courseEventsService.update(id, body)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.courseEventsService.remove(id)
  }
}
