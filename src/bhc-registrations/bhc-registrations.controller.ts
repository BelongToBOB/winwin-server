import { Controller, Get, Post, Patch, Delete, Param, Query, Body } from '@nestjs/common'
import { BhcRegistrationsService } from './bhc-registrations.service'

@Controller('bhc')
export class BhcRegistrationsController {
  constructor(private readonly service: BhcRegistrationsService) {}

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

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id)
  }
}
