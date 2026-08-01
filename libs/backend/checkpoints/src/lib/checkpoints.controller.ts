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
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { CheckpointsService } from './checkpoints.service';
import { ProgramsService } from '@mas/backend-programs';
import { CreateCheckpointDto } from './dto/create-checkpoint.dto';
import { JwtGuard, RoleGuard, Roles, validateUserAnyRole } from '@mas/backend-shared';
import { UserFull } from '@mas/models';
import { UsersService } from '@mas/backend-users';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '@mas/backend-prisma';

@UseGuards(JwtGuard)
@Controller('checkpoints')
@ApiBearerAuth()
@ApiTags('checkpoints')
export class CheckpointsController {
  constructor(
    private readonly checkpointsService: CheckpointsService,
    private readonly programsService: ProgramsService,
    private readonly usersService: UsersService,
    private readonly prismaService: PrismaService,
  ) {}

  @Post()
  async create(@Req() request: Request & { user: UserFull }, @Body() createCheckpointDto: CreateCheckpointDto) {
    const program = await this.programsService.findOne(createCheckpointDto.programId);
    const userOnProgram = await this.prismaService.usersOnPrograms.count({
      where: {
        userId: createCheckpointDto.userId,
        programId: createCheckpointDto.programId,
      },
    });
    const checkpointName = await this.prismaService.checkpointName.findFirst({
      where: { name: createCheckpointDto.name },
    });
    if (!checkpointName) {
      throw new BadRequestException(['That checkpoint name does not exist']);
    }
    if (userOnProgram === 0 && validateUserAnyRole(request, program.partnerId)) {
      throw new UnauthorizedException(['You can only add checkpoints for your associated program']);
    }
    return this.checkpointsService.create(createCheckpointDto);
  }

  @Get()
  @UseGuards(RoleGuard)
  @Roles('Administrator')
  findAll() {
    return this.checkpointsService.findAll();
  }

  @Get('program/:programId/user/:userId')
  async findAllForUserAndPrograms(
    @Req() request: Request & { user: UserFull },
    @Param('programId') programId: string,
    @Param('userId') userId: string,
  ) {
    const program = await this.programsService.findOne(programId);
    const user = await this.usersService.findOne(userId);
    if (validateUserAnyRole(request, program.partnerId)) {
      throw new UnauthorizedException(['You can only get checkpoints for your associated program']);
    }
    if (!user) {
      throw new BadRequestException(['That user does not exist']);
    }
    return this.checkpointsService.findAllForUserAndProgram(programId, userId);
  }

  @Get(':id')
  async findOne(@Req() request: Request & { user: UserFull }, @Param('id') id: string) {
    const checkpoint = await this.checkpointsService.findOne(id);
    if (checkpoint == null) {
      throw new BadRequestException(['You can only get checkpoints for your associated program']);
    }
    const program = await this.programsService.findOne(checkpoint.programId);
    if (validateUserAnyRole(request, program.partnerId)) {
      throw new UnauthorizedException(['You can only get checkpoints for your associated program']);
    }
    return checkpoint;
  }

  @Patch(':id')
  async update(
    @Req() request: Request & { user: UserFull },
    @Param('id') id: string,
    @Body() updateCheckpointDto: Partial<CreateCheckpointDto>,
  ) {
    const checkpoint = await this.checkpointsService.findOne(id);
    if (checkpoint == null) {
      throw new BadRequestException(['You can only get checkpoints for your associated program']);
    }
    const program = await this.programsService.findOne(checkpoint.programId);
    if (validateUserAnyRole(request, program.partnerId)) {
      throw new UnauthorizedException(['You can only get checkpoints for your associated program']);
    }
    return this.checkpointsService.update(id, updateCheckpointDto);
  }

  @Delete(':id')
  async remove(@Req() request: Request & { user: UserFull }, @Param('id') id: string) {
    const checkpoint = await this.checkpointsService.findOne(id);
    if (checkpoint == null) {
      throw new BadRequestException(['That checkpoint does not exist']);
    }
    const program = await this.programsService.findOne(checkpoint.programId);
    if (validateUserAnyRole(request, program.partnerId)) {
      throw new UnauthorizedException(['You can only delete checkpoints for your associated program']);
    }
    return this.checkpointsService.remove(id);
  }

  @Post(':id/approve')
  async approve(@Req() request: Request & { user: UserFull }, @Param('id') id: string) {
    const checkpoint = await this.prismaService.checkpoint.findUnique({
      where: { id },
      include: { images: true },
    });
    if (checkpoint == null) {
      throw new BadRequestException(['That checkpoint does not exist']);
    }
    if (checkpoint.images.length === 0) {
      throw new BadRequestException(['That checkpoint has no images to approve']);
    }
    if (checkpoint.images.every((img) => img.imageVerified)) {
      throw new BadRequestException(['All images for this checkpoint are already approved']);
    }
    const program = await this.programsService.findOne(checkpoint.programId);
    if (validateUserAnyRole(request, program.partnerId)) {
      throw new UnauthorizedException(['You can only approve images for your associated program']);
    }
    return this.checkpointsService.approve(id);
  }

  @Post(':id/reject')
  async reject(@Req() request: Request & { user: UserFull }, @Param('id') id: string) {
    const checkpoint = await this.checkpointsService.findOne(id);
    if (checkpoint == null) {
      throw new BadRequestException(['That checkpoint does not exist']);
    }
    const program = await this.programsService.findOne(checkpoint.programId);
    if (validateUserAnyRole(request, program.partnerId)) {
      throw new UnauthorizedException(['You can only reject images for your associated program']);
    }
    return this.checkpointsService.reject(id);
  }
}
