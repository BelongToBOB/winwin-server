import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common'
import { BucService } from './buc.service'

@Controller('buc')
export class BucController {
  constructor(private readonly bucService: BucService) {}

  @Get('stats')
  getStats() {
    return this.bucService.getStats()
  }

  @Get('validate/:bucCode')
  validateBucCode(@Param('bucCode') bucCode: string) {
    return this.bucService.validateBucCode(bucCode)
  }

  @Get()
  findAll(@Query('status') status?: string) {
    return this.bucService.findAll(status)
  }

  @Post('verify-payment')
  verifyPayment(@Body() body: any) {
    return this.bucService.verifyPayment(body)
  }

  @Post('webhook/payment')
  createFromPayment(@Body() body: any) {
    return this.bucService.createFromPayment(body)
  }

  @Post()
  create(@Body() body: any) {
    return this.bucService.create(body)
  }

  @Patch('register/:bucCode')
  registerBucCode(@Param('bucCode') bucCode: string) {
    return this.bucService.registerBucCode(bucCode)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.bucService.update(id, body)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bucService.remove(id)
  }
}
