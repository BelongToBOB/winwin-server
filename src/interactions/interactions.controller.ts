import { Controller, Get, Post, Delete, Param, Query, Body } from '@nestjs/common'
import { InteractionsService } from './interactions.service'

@Controller('interactions')
export class InteractionsController {
  constructor(private readonly interactionsService: InteractionsService) {}

  @Get()
  findByContact(@Query('contact_id') contactId: string) {
    return this.interactionsService.findByContact(contactId)
  }

  @Post()
  create(@Body() body: any) {
    return this.interactionsService.create(body)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.interactionsService.remove(id)
  }
}
