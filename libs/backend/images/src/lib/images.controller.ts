import { CheckpointsService } from '@mas/backend-checkpoints';
import { MailService } from '@mas/backend-mail';
import { ProgramsService } from '@mas/backend-programs';
import {
  guidFileName,
  imageAbsPath,
  IMAGES_DIR,
  isUserAdmin,
  isUserParterStaff,
  ManagedSessionGuard,
  MAX_IMAGE_SIZE_IN_BYTES,
  privateDir,
  validateUserAnyRole,
  validateUserIsAdminOrStaff,
} from '@mas/backend-shared';
import { UsersService } from '@mas/backend-users';
import { UserFull } from '@mas/models';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpStatus,
  Logger,
  Param,
  ParseFilePipeBuilder,
  Patch,
  Post,
  Query,
  Req,
  UnprocessableEntityException,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { unlink } from 'node:fs';
import { ImagesService } from './images.service';
import { AssignReceiptMonthDto } from './dto/assign-receipt-month.dto';

@UseGuards(ManagedSessionGuard)
@Controller('images')
@ApiBearerAuth()
@ApiTags('images')
export class ImagesController {
  private readonly logger = new Logger(ImagesController.name);
  constructor(
    private imagesService: ImagesService,
    private checkpointsService: CheckpointsService,
    private programsService: ProgramsService,
    private mailService: MailService,
    private usersService: UsersService,
  ) {}

  @Get()
  async getAll(
    @Req() request: Request & { user: UserFull },
    @Query('programId') programId: string,
    @Query('userId') userId?: string,
    @Query('checkpointId') checkpointId?: string,
    @Query('unassignedUser') unassignedUser?: string,
    @Query('unassignedCheckpoint') unassignedCheckpoint?: string,
  ) {
    const program = programId ? await this.programsService.findOne(programId) : null;
    const user = userId ? await this.usersService.findOne(userId) : null;

    if (!program) {
      throw new BadRequestException(['Program not found']);
    }

    if (userId && !user) {
      throw new BadRequestException(['User not found']);
    }

    if (
      isUserAdmin(request) ||
      (isUserParterStaff(request) && request.user.partnerId && program?.partnerId === request.user.partnerId) ||
      request.user.id === userId
    ) {
      return await this.imagesService.getAll(programId, {
        userId,
        checkpointId,
        unassignedUser: unassignedUser === 'true',
        unassignedCheckpoint: unassignedCheckpoint === 'true',
      });
    }
    throw new ForbiddenException(['You are not authorized to view this image']);
  }

  @Get(':id')
  async get(@Req() request: Request & { user: UserFull }, @Param('id') id: string) {
    const image = await this.imagesService.findByImageId(id);
    if (!image) {
      throw new BadRequestException(['image not found']);
    }

    // Mirrors the checks in getAll: admins see everything, partner staff see
    // images belonging to their own partner's programs, and everyone else only
    // their own uploads. Older rows can have a null userId with a checkpoint
    // set, so fall back to the checkpoint's owner.
    const program = image.programId ? await this.programsService.findOne(image.programId) : null;
    const isOwnPartnersProgram =
      isUserParterStaff(request) && !!request.user.partnerId && program?.partnerId === request.user.partnerId;
    const isOwnImage =
      request.user.id === image.userId ||
      (!image.userId &&
        !!image.checkpointId &&
        (await this.checkpointsService.findOne(image.checkpointId))?.userId === request.user.id);

    if (!isUserAdmin(request) && !isOwnPartnersProgram && !isOwnImage) {
      throw new ForbiddenException(['You are not authorized to view this image']);
    }

    return await this.imagesService.get(id);
  }

  @Post()
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({
        destination: (_, __, callback) => callback(null, privateDir(IMAGES_DIR)),
        filename: guidFileName,
      }),
    }),
  )
  async addImages(
    @Req() request: Request & { user: UserFull },
    @UploadedFiles(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({
          maxSize: MAX_IMAGE_SIZE_IN_BYTES,
          message(maxSize) {
            return `File size must be less than ${maxSize / 1024 / 1024} MB`;
          },
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          exceptionFactory(error) {
            throw new UnprocessableEntityException([error]);
          },
        }),
    )
    files: Express.Multer.File[],
    @Query('programId') programId: string,
    @Query('checkpointId') checkpointId?: string,
  ) {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    for (const file of files) {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new UnprocessableEntityException([
          `File type ${file.mimetype} is not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`,
        ]);
      }
    }

    if (checkpointId) {
      const checkpoint = await this.checkpointsService.findOne(checkpointId);
      if (
        !checkpoint ||
        checkpoint.programId !== programId ||
        (!validateUserIsAdminOrStaff(request) && checkpoint.userId !== request.user.id)
      ) {
        for (const file of files)
          unlink(file.path, () => {
            /** */
          });
        throw new ForbiddenException(['You cannot attach receipts to this checkpoint']);
      }
    }

    const uploadPromises = files.map(async (file) => {
      if (validateUserIsAdminOrStaff(request)) {
        return this.imagesService.addOrReplaceImage(file, programId, checkpointId, undefined);
      } else {
        const programs = await this.programsService.getProgramsForUser(request.user.id);
        const programWithMatchingId = programs.find((program) => program.id === programId);

        // If the user is in the given program, send an email and add the image
        if (programWithMatchingId) {
          // Logic to get partner emails and send an email with link to checkpoints
          // https://www.brpatl.com/partner-staff/programs/:programId/users/:userId
          const receipt = await this.imagesService.addOrReplaceImage(file, programId, checkpointId, request.user.id);
          try {
            const { partnerId } = await this.programsService.findOne(programId);
            const partnerEmails = await this.usersService.getPartnerEmails(partnerId);
            if (partnerEmails.length) {
              await this.mailService.sendPartnerStaffImageAdded(partnerEmails, programId, request.user);
            }
          } catch {
            this.logger.warn('Receipt saved, but the staff notification could not be delivered.');
          }
          return receipt;
        }
      }

      unlink(file.path, () => {
        /** */
      });
      throw new ForbiddenException(['You are not authorized to add an image']);
    });

    const results = await Promise.all(uploadPromises);
    return results;
  }

  @Patch(':id/month')
  async assignMonth(
    @Req() request: Request & { user: UserFull },
    @Param('id') id: string,
    @Body() body: AssignReceiptMonthDto,
  ) {
    const image = await this.imagesService.findByImageId(id);
    if (!image) throw new BadRequestException(['That document does not exist.']);
    if (!validateUserIsAdminOrStaff(request)) {
      throw new ForbiddenException(['You are not authorized to update this document.']);
    }
    const { programId, userId } = image;
    if (!programId || !userId) {
      throw new BadRequestException(['Only a participant’s program receipt can be filed under a month.']);
    }
    const partnerId = await this.programsService.getPartnerId(programId);
    if (validateUserAnyRole(request, partnerId)) {
      throw new ForbiddenException(['You can only file documents for programs managed by your partner.']);
    }
    const checkpoint = await this.checkpointsService.ensureParticipantReceiptMonth(
      userId,
      programId,
      `Month ${body.month}`,
    );
    return this.imagesService.updateImage(id, undefined, checkpoint.id);
  }

  @Patch(':id')
  async updateImage(
    @Req() request: Request & { user: UserFull },
    @Param('id') id: string,
    @Body() data: { userId?: string; checkpointId?: string },
  ) {
    const image = await this.imagesService.findByImageId(id);
    if (!image) {
      throw new BadRequestException(['image not found']);
    }

    if (validateUserIsAdminOrStaff(request)) {
      return this.imagesService.updateImage(id, data.userId);
    }

    throw new ForbiddenException(['You are not authorized to update this image']);
  }

  @Delete(':id')
  async deleteImage(@Req() request: Request & { user: UserFull }, @Param('id') id: string) {
    const image = await this.imagesService.findByImageId(id);
    if (!image) {
      throw new BadRequestException(['image not found']);
    }
    const checkpoint = image.checkpointId ? await this.checkpointsService.findOne(image.checkpointId) : undefined;
    if (image.imageVerified && !isUserAdmin(request)) {
      throw new ForbiddenException(['Only an admin can delete a verified image']);
    }
    const isOwner =
      !!request.user.id &&
      (image.userId === request.user.id || (!image.userId && checkpoint?.userId === request.user.id));
    const isOwnPartner =
      isUserParterStaff(request) &&
      !!request.user.partnerId &&
      !!image.programId &&
      (await this.programsService.findOne(image.programId)).partnerId === request.user.partnerId;
    if (isUserAdmin(request) || isOwnPartner || isOwner) {
      const deletedImage = await this.imagesService.deleteImage(id);
      unlink(imageAbsPath(deletedImage.path), () => {
        /** */
      });
      return deletedImage;
    }
    throw new ForbiddenException(['You are not authorized to delete this image']);
  }
}
