import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { LearningsService } from './learnings.service';
import { CreateLearningDto } from './dto/create-learning.dto';
import { UpdateLearningDto } from './dto/update-learning.dto';
import { JwtGuard, RoleGuard, Roles } from '@mas/backend-shared';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Controller('learnings')
@ApiBearerAuth()
@ApiTags('learnings')
export class LearningsController {
  constructor(private readonly learningsService: LearningsService) {}

  @Post()
  @Roles('Administrator')
  @UseGuards(JwtGuard, RoleGuard)
  create(@Body() createLearningDto: CreateLearningDto) {
    return this.learningsService.create(createLearningDto);
  }

  @Get()
  findAll() {
    return this.learningsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.learningsService.findOne(id);
  }

  @Patch(':id')
  @Roles('Administrator')
  @UseGuards(JwtGuard, RoleGuard)
  update(@Param('id') id: string, @Body() updateLearningDto: UpdateLearningDto) {
    return this.learningsService.update(id, updateLearningDto);
  }

  @Delete(':id')
  @Roles('Administrator')
  @UseGuards(JwtGuard, RoleGuard)
  remove(@Param('id') id: string) {
    return this.learningsService.remove(id);
  }
}
