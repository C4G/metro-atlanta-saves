import {
  ManagedSessionGuard,
  RoleGuard,
  Roles,
  validateUserAnyRole,
  validateUserIsAdminOrStaff,
} from '@mas/backend-shared';
import { Body, Controller, Delete, Get, Param, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { CreateAlliesOnProgramsDto } from './dto/create-allies-on-programs.dto';

import { ProgramsService } from '@mas/backend-programs';
import { UserFull } from '@mas/models';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AlliesOnProgramsService } from './allies-on-programs.service';

@Controller('allies-on-programs')
@ApiBearerAuth()
@UseGuards(ManagedSessionGuard, RoleGuard)
@Roles('Administrator', 'Partner_Staff')
@ApiTags('allies-on-programs')
export class AlliesOnProgramsController {
  constructor(
    private alliesOnProgramsService: AlliesOnProgramsService,
    private programsService: ProgramsService,
  ) {}

  @Get('program/:id')
  async getAlliesOnPrograms(@Req() request: Request & { user: UserFull }, @Param('id') id: string) {
    const userInProgram = await this.programsService.isUserInProgram(request.user.id, id);
    if (!validateUserIsAdminOrStaff(request) && !userInProgram) {
      throw new UnauthorizedException(['You can only get allies for your associated partner programs']);
    }
    return this.alliesOnProgramsService.getAlliesOnPrograms(id);
  }

  @Post()
  async createAlliesOnPrograms(
    @Req() request: Request & { user: UserFull },
    @Body() createAllyDto: CreateAlliesOnProgramsDto,
  ) {
    const program = await this.programsService.findOne(createAllyDto.programId);

    if (validateUserAnyRole(request, program.partnerId)) {
      throw new UnauthorizedException(['You can only add allies to a program managed by your partner']);
    }

    return this.alliesOnProgramsService.addAlliesOnPrograms(createAllyDto);
  }

  @Delete('user/:userId/program/:programId')
  async deleteAlliesOnPrograms(
    @Param('userId') userId: string,
    @Param('programId') programId: string,
    @Req() request: Request & { user: UserFull },
  ) {
    const program = await this.programsService.findOne(programId);

    if (validateUserAnyRole(request, program.partnerId)) {
      throw new UnauthorizedException(['You can only delete allies from a program managed by your partner']);
    }

    return this.alliesOnProgramsService.deleteAlliesOnPrograms(userId, programId);
  }
}
