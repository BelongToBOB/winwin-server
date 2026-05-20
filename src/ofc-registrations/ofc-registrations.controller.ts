import { Controller, Get, Post, Delete, Param, Query, Body } from '@nestjs/common'
import { OfcRegistrationsService } from './ofc-registrations.service'

@Controller('ofc')
export class OfcRegistrationsController {
  constructor(private readonly service: OfcRegistrationsService) {}

  @Get()
  findAll(@Query('event_id') eventId?: string) {
    return this.service.findAll(eventId)
  }

  @Get('stats')
  stats(@Query('event_id') eventId?: string) {
    return this.service.stats(eventId)
  }

  @Post()
  create(@Body() body: any) {
    return this.service.create(body)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id)
  }
}
