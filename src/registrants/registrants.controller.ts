import { Controller, Post, Patch, Delete, Param, Body } from '@nestjs/common'
import { RegistrantsService } from './registrants.service'

@Controller('registrants')
export class RegistrantsController {
  constructor(private readonly registrantsService: RegistrantsService) {}

  @Post()
  create(@Body() body: any) {
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
