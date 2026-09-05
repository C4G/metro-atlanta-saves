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
import { RequirementsService } from './requirements.service';
import { CreateRequirementDto } from './dto/create-requirement.dto';
import { UpdateRequirementDto } from './dto/update-requirement.dto';
import { ManagedSessionGuard, RoleGuard, Roles, validateUserAnyRole } from '@mas/backend-shared';
import { UserFull } from '@mas/models';
import { ProgramsService } from '@mas/backend-programs';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Controller('requirements')
@ApiBearerAuth()
@Roles('Partner_Staff')
@UseGuards(ManagedSessionGuard, RoleGuard)
@ApiTags('requirements')
export class RequirementsController {
  constructor(
    private readonly requirementsService: RequirementsService,
    private readonly programsService: ProgramsService,
  ) {}

  @Post('program/:id')
  async create(
    @Req() request: Request & { user: UserFull },
    @Param('id') id: string,
    @Body() createRequirementDto: CreateRequirementDto,
  ) {
    const program = await this.programsService.findOne(id);
    if (validateUserAnyRole(request, program.partnerId)) {
      throw new UnauthorizedException(['You can only add requirements to your programs']);
    }
    return this.requirementsService.create(id, createRequirementDto);
  }

  @Get()
  @Roles('Administrator')
  findAll() {
    return this.requirementsService.findAll();
  }

  @Get('program/:id')
  async findAllForProgram(@Req() request: Request & { user: UserFull }, @Param('id') id: string) {
    const program = await this.programsService.findOne(id);
    if (validateUserAnyRole(request, program.partnerId)) {
      throw new UnauthorizedException(['You can only get requirements for your programs']);
    }
    return this.requirementsService.findAllForProgram(id);
  }

  @Get(':id')
  async findOne(@Req() request: Request & { user: UserFull }, @Param('id') id: string) {
    const requirement = await this.requirementsService.findOne(id);
    const program = await this.programsService.findOne(requirement.programId);
    if (validateUserAnyRole(request, program.partnerId)) {
      throw new UnauthorizedException(['You can only get requirements for your programs']);
    }
    return requirement;
  }

  @Patch(':id')
  async update(
    @Req() request: Request & { user: UserFull },
    @Param('id') id: string,
    @Body() updateRequirementDto: UpdateRequirementDto,
  ) {
    const requirement = await this.requirementsService.findOne(id);
    const program = await this.programsService.findOne(requirement.programId);
    if (validateUserAnyRole(request, program.partnerId)) {
      throw new UnauthorizedException(['You can only update requirements for your programs']);
    }
    return this.requirementsService.update(id, updateRequirementDto);
  }

  @Delete(':id')
  async remove(@Req() request: Request & { user: UserFull }, @Param('id') id: string) {
    const requirement = await this.requirementsService.findOne(id);
    const program = await this.programsService.findOne(requirement.programId);
    if (validateUserAnyRole(request, program.partnerId)) {
      throw new UnauthorizedException(['You can only delete requirements for your programs']);
    }
    return this.requirementsService.remove(id);
  }
}
