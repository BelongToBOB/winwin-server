import { Controller, Get, Post, Patch, Delete, Param, Query, Body } from '@nestjs/common'
import { PrivateConsultService } from './private-consult.service'

@Controller('private-consult')
export class PrivateConsultController {
  constructor(private readonly service: PrivateConsultService) {}

  @Get()
  findAll(@Query('consult_id') consultId?: string) {
    return this.service.findAll(consultId)
  }

  @Get('stats')
  stats(@Query('consult_id') consultId?: string) {
    return this.service.stats(consultId)
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
