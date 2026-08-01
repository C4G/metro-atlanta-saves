import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UsersOnProgramsService } from './users-on-programs.service';
import { CreateUsersOnProgramsDto } from './dto/create-users-on-programs.dto';
import { UpdateUsersOnProgramsDto } from './dto/update-users-on-programs.dto';
import { JwtGuard, RoleGuard, Roles, validateUserAnyRole, validateUserIsAdminOrStaff } from '@mas/backend-shared';

import { ProgramsService } from '@mas/backend-programs';
import { UserFull } from '@mas/models';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Controller('users-on-programs')
@ApiBearerAuth()
@ApiTags('users-on-programs')
export class UsersOnProgramsController {
  constructor(
    private usersOnProgramsService: UsersOnProgramsService,
    private programsService: ProgramsService,
  ) {}

  @UseGuards(JwtGuard)
  @Get('program/:id')
  async getUsersOnPrograms(@Req() request: Request & { user: UserFull }, @Param('id') id: string) {
    const userInProgram = await this.programsService.isUserInProgram(request.user.id, id);
    if (!validateUserIsAdminOrStaff(request) && !userInProgram) {
      throw new UnauthorizedException(['You can only get programs for your associated partner']);
    }
    return this.usersOnProgramsService.getUsersOnPrograms(id);
  }

  @UseGuards(JwtGuard)
  @Get('user/program/:id')
  async getUserOnProgram(@Req() request: Request & { user: UserFull }, @Param('id') id: string) {
    const userInProgram = await this.programsService.isUserInProgram(request.user.id, id);
    if (!userInProgram) {
      throw new UnauthorizedException(["You can only get your information for a program you're enrolled in."]);
    }
    return this.usersOnProgramsService.getUserOnProgram(id, request.user.id);
  }

  @UseGuards(JwtGuard, RoleGuard)
  @Roles('Administrator', 'Partner_Staff')
  @Post()
  async createUsersOnPrograms(
    @Req() request: Request & { user: UserFull },
    @Body() createUsersDto: CreateUsersOnProgramsDto,
  ) {
    const program = await this.programsService.findOne(createUsersDto.programId);

    if (validateUserAnyRole(request, program.partnerId)) {
      throw new UnauthorizedException(['You can only add users to a program managed by your partner']);
    }

    return this.usersOnProgramsService.addUsersOnPrograms(createUsersDto);
  }

  @UseGuards(JwtGuard, RoleGuard)
  @Roles('Administrator', 'Partner_Staff')
  @Patch()
  async patchUsersOnPrograms(
    @Req() request: Request & { user: UserFull },
    @Body() updateUsersDto: UpdateUsersOnProgramsDto,
  ) {
    if (!updateUsersDto.programId) {
      throw new BadRequestException(['The programId is missing!']);
    }
    if (!updateUsersDto.userId) {
      throw new BadRequestException(['The userId is missing!']);
    }
    const program = await this.programsService.findOne(updateUsersDto.programId);

    if (validateUserAnyRole(request, program.partnerId)) {
      throw new UnauthorizedException(['You can only update users to a program managed by your partner']);
    }

    return this.usersOnProgramsService.patchUsersOnPrograms(
      updateUsersDto.userId,
      updateUsersDto.programId,
      updateUsersDto,
    );
  }

  @UseGuards(JwtGuard, RoleGuard)
  @Roles('Administrator', 'Partner_Staff')
  @Delete('user/:userId/program/:programId')
  async deleteUsersOnPrograms(
    @Param('userId') userId: string,
    @Param('programId') programId: string,
    @Req() request: Request & { user: UserFull },
  ) {
    const program = await this.programsService.findOne(programId);

    if (validateUserAnyRole(request, program.partnerId)) {
      throw new UnauthorizedException(['You can only delete users to a program managed by your partner']);
    }

    return this.usersOnProgramsService.deleteUsersOnPrograms(userId, programId);
  }

  @UseGuards(JwtGuard, RoleGuard)
  @Roles('Administrator', 'Partner_Staff')
  @Get('/excel-sheet/:programId')
  async downloadExcel(
    @Param('programId') programId: string,
    @Req() request: Request & { user: UserFull },
    @Res() res: any,
  ) {
    const program = await this.programsService.findOne(programId);

    if (validateUserAnyRole(request, program.partnerId)) {
      throw new UnauthorizedException(['You can only download the spreadsheet for programs managed by your partner']);
    }

    const excelBuffer = await this.usersOnProgramsService.generateExcel(programId);
    res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.set('Content-Disposition', 'attachment; filename=example.xlsx');
    res.send(excelBuffer);
  }
}
