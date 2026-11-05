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
  UnprocessableEntityException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { unlink } from 'node:fs';
import { UsersOnProgramsService } from './users-on-programs.service';
import { CreateUsersOnProgramsDto } from './dto/create-users-on-programs.dto';
import { UpdateUsersOnProgramsDto } from './dto/update-users-on-programs.dto';
import { VerifyRequirementDto } from './dto/verify-requirement.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import {
  guidFileName,
  IMAGES_DIR,
  ManagedSessionGuard,
  MAX_IMAGE_SIZE_IN_BYTES,
  privateDir,
  RoleGuard,
  Roles,
  validateUserAnyRole,
  validateUserIsAdminOrStaff,
} from '@mas/backend-shared';

const PROOF_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];

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

  @UseGuards(ManagedSessionGuard, RoleGuard)
  @Roles('Administrator', 'Partner_Staff')
  @Get('program/:programId/task-review')
  async getTaskReview(@Req() request: Request & { user: UserFull }, @Param('programId') programId: string) {
    const program = await this.programsService.findOne(programId);
    if (validateUserAnyRole(request, program.partnerId)) {
      throw new UnauthorizedException(['You can only review tasks for programs managed by your partner.']);
    }
    return this.usersOnProgramsService.getTaskReview(programId);
  }

  @UseGuards(ManagedSessionGuard, RoleGuard)
  @Roles('Administrator', 'Partner_Staff')
  @Patch('program/:programId/participants/:userId/requirements/:requirementId/verification')
  async verifyRequirement(
    @Req() request: Request & { user: UserFull },
    @Param('programId') programId: string,
    @Param('userId') userId: string,
    @Param('requirementId') requirementId: string,
    @Body() body: VerifyRequirementDto,
  ) {
    const program = await this.programsService.findOne(programId);
    if (validateUserAnyRole(request, program.partnerId)) {
      throw new UnauthorizedException(['You can only verify tasks for programs managed by your partner.']);
    }
    return this.usersOnProgramsService.verifyRequirement(programId, userId, requirementId, request.user.id, body);
  }

  @UseGuards(ManagedSessionGuard, RoleGuard)
  @Roles('Administrator', 'Partner_Staff')
  @Post('program/:programId/participants/:userId/requirements/:requirementId/completion')
  async completeForParticipant(
    @Req() request: Request & { user: UserFull },
    @Param('programId') programId: string,
    @Param('userId') userId: string,
    @Param('requirementId') requirementId: string,
  ) {
    await this.assertManages(request, programId);
    return this.usersOnProgramsService.completeForParticipant(programId, userId, requirementId, request.user.id);
  }

  @UseGuards(ManagedSessionGuard, RoleGuard)
  @Roles('Administrator', 'Partner_Staff')
  @Delete('program/:programId/participants/:userId/requirements/:requirementId/completion')
  async uncompleteForParticipant(
    @Req() request: Request & { user: UserFull },
    @Param('programId') programId: string,
    @Param('userId') userId: string,
    @Param('requirementId') requirementId: string,
  ) {
    await this.assertManages(request, programId);
    return this.usersOnProgramsService.uncompleteForParticipant(programId, userId, requirementId);
  }

  @UseGuards(ManagedSessionGuard, RoleGuard)
  @Roles('Administrator', 'Partner_Staff')
  @Get('program/:programId/payments')
  async getPayments(@Req() request: Request & { user: UserFull }, @Param('programId') programId: string) {
    await this.assertManages(request, programId);
    return this.usersOnProgramsService.getPayments(programId);
  }

  @UseGuards(ManagedSessionGuard, RoleGuard)
  @Roles('Administrator', 'Partner_Staff')
  @Post('program/:programId/participants/:userId/payments')
  @UseInterceptors(
    FileInterceptor('proof', {
      storage: diskStorage({
        destination: (_, __, callback) => callback(null, privateDir(IMAGES_DIR)),
        filename: guidFileName,
      }),
      limits: { fileSize: MAX_IMAGE_SIZE_IN_BYTES },
    }),
  )
  async recordPayment(
    @Req() request: Request & { user: UserFull },
    @Param('programId') programId: string,
    @Param('userId') userId: string,
    @Body() body: RecordPaymentDto,
    @UploadedFile() proof?: Express.Multer.File,
  ) {
    const discard = () => proof && unlink(proof.path, () => undefined);
    if (!proof) throw new BadRequestException(['Add a photo of the check as proof of payment.']);
    if (!PROOF_TYPES.includes(proof.mimetype)) {
      discard();
      throw new UnprocessableEntityException(['The proof must be a JPG, PNG, WebP, HEIC or PDF file.']);
    }
    try {
      await this.assertManages(request, programId);
      return await this.usersOnProgramsService.recordPayment(programId, userId, request.user.id, body, proof);
    } catch (error) {
      discard();
      throw error;
    }
  }

  @UseGuards(ManagedSessionGuard, RoleGuard)
  @Roles('Administrator', 'Partner_Staff')
  @Get('program/:programId/payments/:paymentId/proof')
  async getPaymentProof(
    @Req() request: Request & { user: UserFull },
    @Param('programId') programId: string,
    @Param('paymentId') paymentId: string,
  ) {
    await this.assertManages(request, programId);
    return this.usersOnProgramsService.getPaymentProof(programId, paymentId);
  }

  @UseGuards(ManagedSessionGuard)
  @Get('program/:id')
  async getUsersOnPrograms(@Req() request: Request & { user: UserFull }, @Param('id') id: string) {
    const userInProgram = await this.programsService.isUserInProgram(request.user.id, id);
    if (!validateUserIsAdminOrStaff(request) && !userInProgram) {
      throw new UnauthorizedException(['You can only get programs for your associated partner']);
    }
    return this.usersOnProgramsService.getUsersOnPrograms(id);
  }

  @UseGuards(ManagedSessionGuard)
  @Get('user/program/:id')
  async getUserOnProgram(@Req() request: Request & { user: UserFull }, @Param('id') id: string) {
    const userInProgram = await this.programsService.isUserInProgram(request.user.id, id);
    if (!userInProgram) {
      throw new UnauthorizedException(["You can only get your information for a program you're enrolled in."]);
    }
    return this.usersOnProgramsService.getUserOnProgram(id, request.user.id);
  }

  @UseGuards(ManagedSessionGuard)
  @Get('user/requirements')
  getParticipantRequirements(@Req() request: Request & { user: UserFull }) {
    return this.usersOnProgramsService.getParticipantRequirements(request.user.id, request.user);
  }

  @UseGuards(ManagedSessionGuard)
  @Post('user/program/:programId/requirements/:requirementId/completion')
  completeRequirement(
    @Req() request: Request & { user: UserFull },
    @Param('programId') programId: string,
    @Param('requirementId') requirementId: string,
  ) {
    return this.usersOnProgramsService.completeRequirement(request.user.id, programId, requirementId);
  }

  @UseGuards(ManagedSessionGuard)
  @Delete('user/program/:programId/requirements/:requirementId/completion')
  uncompleteRequirement(
    @Req() request: Request & { user: UserFull },
    @Param('programId') programId: string,
    @Param('requirementId') requirementId: string,
  ) {
    return this.usersOnProgramsService.uncompleteRequirement(request.user.id, programId, requirementId);
  }

  @UseGuards(ManagedSessionGuard, RoleGuard)
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

  @UseGuards(ManagedSessionGuard, RoleGuard)
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

  @UseGuards(ManagedSessionGuard, RoleGuard)
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

  @UseGuards(ManagedSessionGuard, RoleGuard)
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

  private async assertManages(request: Request & { user: UserFull }, programId: string) {
    const program = await this.programsService.findOne(programId);
    if (validateUserAnyRole(request, program.partnerId)) {
      throw new UnauthorizedException(['You can only manage participants in programs run by your partner.']);
    }
  }
}
