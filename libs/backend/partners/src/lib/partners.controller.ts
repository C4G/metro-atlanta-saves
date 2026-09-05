import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PartnersService } from './partners.service';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { ManagedSessionGuard, RoleGuard, Roles } from '@mas/backend-shared';
import { UpdatePartnerDto } from './dto/patch-partner.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Controller('partners')
@ApiBearerAuth()
@Roles('Administrator')
@UseGuards(ManagedSessionGuard, RoleGuard)
@ApiTags('partners')
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Get()
  getAll() {
    return this.partnersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.partnersService.findOne(id);
  }

  @Post()
  create(@Body() createPartnerDto: CreatePartnerDto) {
    return this.partnersService.create(createPartnerDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePartnerDto: UpdatePartnerDto) {
    return this.partnersService.update(id, updatePartnerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.partnersService.remove(id);
  }
}
