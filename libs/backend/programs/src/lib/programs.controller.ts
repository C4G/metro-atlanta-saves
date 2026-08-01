import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import {
  isUserAdmin,
  isUserParterStaff,
  JwtGuard,
  RoleGuard,
  Roles,
  validateUserAnyRole,
  validateUserIsAdminOrStaff,
} from '@mas/backend-shared';
import { UserFull } from '@mas/models';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EnrollDto } from './dto/enroll.dto';
import { CloneProgramDto } from './dto/clone-progrmam.dto';

@Controller('programs')
@ApiBearerAuth()
@ApiTags('programs')
@UseGuards(JwtGuard)
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @UseGuards(RoleGuard)
  @Roles('Administrator', 'Partner_Staff')
  @Post('partner/:id')
  create(
    @Req() request: Request & { user: UserFull },
    @Param('id') id: string,
    @Body() createProgramDto: CreateProgramDto,
  ) {
    if (validateUserAnyRole(request, id)) {
      throw new UnauthorizedException(['You can only add programs for your associated partner']);
    }
    return this.programsService.create(id, createProgramDto);
  }

  @UseGuards(RoleGuard)
  @Get()
  @Roles('Administrator')
  findAll() {
    return this.programsService.findAll();
  }

  @Get('upcoming')
  findUpcoming() {
    return this.programsService.findUpcoming();
  }

  @Get('upcoming/:id')
  findSingleUpcoming(@Param('id') id: string) {
    return this.programsService.findUpcoming(id);
  }

  @Get(':id/enrollments')
  @UseGuards(RoleGuard)
  @Roles('Administrator', 'Partner_Staff')
  async getEnrollments(@Req() request: Request & { user: UserFull }, @Param('id') id: string) {
    const partnerId = await this.programsService.getPartnerId(id);
    if (validateUserAnyRole(request, partnerId)) {
      throw new UnauthorizedException(['You can only check enrollments for your partner']);
    }
    return this.programsService.getEnrollments(id);
  }

  @Post(':id/enrollment/:enrollmentId')
  @UseGuards(RoleGuard)
  @Roles('Administrator', 'Partner_Staff')
  async approveEnrollment(
    @Req() request: Request & { user: UserFull },
    @Param('id') id: string,
    @Param('enrollmentId') enrollmentId: string,
  ) {
    const partnerId = await this.programsService.getPartnerId(id);
    if (validateUserAnyRole(request, partnerId)) {
      throw new UnauthorizedException(['You can only check enrollments for your partner']);
    }
    return this.programsService.approveEnrollment(enrollmentId);
  }

  @Delete(':id/enrollment/:enrollmentId')
  @UseGuards(RoleGuard)
  @Roles('Administrator', 'Partner_Staff')
  async rejectEnrollment(
    @Req() request: Request & { user: UserFull },
    @Param('id') id: string,
    @Param('enrollmentId') enrollmentId: string,
  ) {
    const partnerId = await this.programsService.getPartnerId(id);
    if (validateUserAnyRole(request, partnerId)) {
      throw new UnauthorizedException(['You can only check enrollments for your partner']);
    }
    return this.programsService.rejectEnrollment(enrollmentId);
  }

  @Post('enroll')
  enroll(@Body() enrollDto: EnrollDto) {
    return this.programsService.enroll(enrollDto);
  }

  @UseGuards(RoleGuard)
  @Roles('Administrator', 'Partner_Staff')
  @Get('partner/:id')
  async findAllForPartner(@Req() request: Request & { user: UserFull }, @Param('id') id: string) {
    if (validateUserAnyRole(request, id)) {
      throw new UnauthorizedException(['You can only add programs for your associated partner']);
    }
    return this.programsService.findAllForPartner(id);
  }

  @Get(':id')
  async findOne(@Req() request: Request & { user: UserFull }, @Param('id') id: string) {
    const program = await this.programsService.findOne(id);
    const userInProgram = await this.programsService.isUserInProgram(request.user.id, id);
    if (!validateUserIsAdminOrStaff(request) && !userInProgram) {
      throw new UnauthorizedException(['You can only add programs for your associated partner']);
    }
    return program;
  }

  @Get('/user/programs')
  async findProgramsForUser(@Req() request: Request & { user: UserFull }) {
    if (isUserAdmin(request)) {
      return await this.programsService.findAll();
    }
    if (isUserParterStaff(request) && request.user.partnerId) {
      return await this.programsService.findAllForPartner(request.user.partnerId);
    }
    return await this.programsService.getProgramsForUser(request.user.id);
  }

  @UseGuards(RoleGuard)
  @Roles('Administrator', 'Partner_Staff')
  @Patch(':id')
  async update(
    @Req() request: Request & { user: UserFull },
    @Param('id') id: string,
    @Body() updateProgramDto: UpdateProgramDto,
  ) {
    const program = await this.programsService.findOne(id);
    if (validateUserAnyRole(request, program.partnerId)) {
      throw new UnauthorizedException(['You can only add programs for your associated partner']);
    }
    return this.programsService.update(id, updateProgramDto);
  }

  @UseGuards(RoleGuard)
  @Roles('Administrator', 'Partner_Staff')
  @Delete(':id')
  async remove(@Req() request: Request & { user: UserFull }, @Param('id') id: string) {
    const program = await this.programsService.findOne(id);
    if (validateUserAnyRole(request, program.partnerId)) {
      throw new UnauthorizedException(['You can only remove programs for your associated partner']);
    }
    return this.programsService.remove(id);
  }

  @UseGuards(RoleGuard)
  @Roles('Administrator', 'Partner_Staff')
  @Post('clone/:id')
  clone(
    @Req() request: Request & { user: UserFull },
    @Param('id') id: string,
    @Body() cloneProgramData: CloneProgramDto,
  ) {
    if (!validateUserIsAdminOrStaff(request)) {
      throw new UnauthorizedException(['You can only clone programs for your associated partner']);
    }
    return this.programsService.clone(id, cloneProgramData.name);
  }
}
