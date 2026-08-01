import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtGuard, RoleGuard, Roles } from '@mas/backend-shared';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CheckpointNamesService } from './checkpoint-names.service';
import type { CheckpointName } from '@prisma/client';

@Controller('checkpoint-names')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@ApiTags('checkpint-names')
export class CheckpointNamesController {
  constructor(private checkpointNamesService: CheckpointNamesService) {}

  @Post()
  @Roles('Administrator')
  @UseGuards(RoleGuard)
  create(@Body() body: CheckpointName) {
    return this.checkpointNamesService.create(body);
  }

  @Get()
  findAll() {
    return this.checkpointNamesService.findAll();
  }

  @Get(':programId')
  getByProgramId(@Param('programId') programId: string) {
    return this.checkpointNamesService.getByProgramId(programId);
  }

  @Patch(':name')
  @Roles('Administrator')
  @UseGuards(RoleGuard)
  update(@Param('name') name: string, @Body() update: CheckpointName) {
    return this.checkpointNamesService.update(name, update);
  }

  @Delete(':name')
  @Roles('Administrator')
  @UseGuards(RoleGuard)
  remove(@Param('name') name: string) {
    return this.checkpointNamesService.remove(name);
  }
}
