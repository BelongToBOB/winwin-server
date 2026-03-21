import { Controller, Post, Patch, Delete, Param, Body, BadRequestException } from '@nestjs/common'
import { RegistrantsService } from './registrants.service'

@Controller('registrants')
export class RegistrantsController {
  constructor(private readonly registrantsService: RegistrantsService) {}

  @Post()
  create(@Body() body: any) {
    if (!body?.first_name && !body?.last_name) {
      throw new BadRequestException('first_name or last_name is required')
    }
    return this.registrantsService.create(body)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.registrantsService.update(id, body)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.registrantsService.remove(id)
  }
}
