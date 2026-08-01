import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { WhatWeAreService } from './what-we-are.service';
import { UpdateWhatWeAreDto } from './dto/update-what-we-are.dto';

@Controller('what-we-are')
@ApiBearerAuth()
@ApiTags('what-we-are')
export class WhatWeAreController {
  constructor(private readonly whatWeAreService: WhatWeAreService) {}

  @Get()
  findAll() {
    return this.whatWeAreService.find();
  }

  @Patch()
  update(@Body() updateWhatWeAreDto: UpdateWhatWeAreDto) {
    return this.whatWeAreService.update(updateWhatWeAreDto);
  }
}
