import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common'
import { BucService } from './buc.service'

@Controller('buc')
export class BucController {
  constructor(private readonly bucService: BucService) {}

  @Get('stats')
  getStats() {
    return this.bucService.getStats()
  }

  @Get()
  findAll(@Query('status') status?: string) {
    return this.bucService.findAll(status)
  }

  @Post()
  create(@Body() body: any) {
    return this.bucService.create(body)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.bucService.update(id, body)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bucService.remove(id)
  }

  @Post('webhook/payment')
  createFromPayment(@Body() body: any) {
    return this.bucService.createFromPayment(body)
  }
}
