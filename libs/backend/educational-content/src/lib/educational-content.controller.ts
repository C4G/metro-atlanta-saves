import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  Patch,
  Post,
  Put,
  Query,
  UnprocessableEntityException,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { EducationalContentWithCategories } from '@mas/models';
import { EducationalContentService } from './educational-content.service';
import { NotificationConfigDto } from './dto/notification-config.dto';

import { assetDir, editFileName, JwtGuard, MAX_IMAGE_SIZE_IN_BYTES, RoleGuard, Roles } from '@mas/backend-shared';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Controller('educational-content')
@ApiBearerAuth()
@ApiTags('educational-content')
export class EducationalContentController {
  constructor(private educationalContentService: EducationalContentService) {}

  @Get()
  contents(@Query('categoryIds') categoryIds: string) {
    const categoryIdsList = categoryIds ? categoryIds.split(',') : [];

    return this.educationalContentService.getEducationalContent(categoryIdsList);
  }

  @Roles('Administrator')
  @UseGuards(JwtGuard, RoleGuard)
  @Post('')
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({
        destination: assetDir('educational-content'),
        filename: (req, file, cb) => {
          editFileName(req, file, (error, newFilename) => {
            if (error) {
              console.error('Error generating filename:', error);
              cb(error, 'Unable to find file name.');
            } else {
              cb(null, newFilename);
            }
          });
        },
      }),
    }),
  )
  createContent(
    @UploadedFiles(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({
          maxSize: MAX_IMAGE_SIZE_IN_BYTES,
          message(maxSize) {
            return `File size must be less than ${maxSize / 1024 / 1024} MB`;
          },
        })
        .build({
          fileIsRequired: false,
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          exceptionFactory(error) {
            throw new UnprocessableEntityException([error]);
          },
        }),
    )
    files: Express.Multer.File[],
    @Body() body: EducationalContentWithCategories,
  ) {
    const file = files?.find((f) => f.fieldname === 'fileBlob') || undefined;
    const image = files?.find((f) => f.fieldname === 'imageBlob') || undefined;

    if (image && !/(jpg|jpeg|png|webp)$/.test(image.mimetype)) {
      throw new UnprocessableEntityException(['Invalid file type for image. Must be jpg, jpeg, png, or webp.']);
    }

    return this.educationalContentService.addEducationalContent(image, file, body);
  }

  @Roles('Administrator')
  @UseGuards(JwtGuard, RoleGuard)
  @Patch('/:id')
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({
        destination: assetDir('educational-content'),
        filename: (req, file, cb) => {
          editFileName(req, file, (error, newFilename) => {
            if (error) {
              console.error('Error generating filename:', error);
              cb(error, 'Unable to find file name.');
            } else {
              cb(null, newFilename);
            }
          });
        },
      }),
    }),
  )
  patchContent(
    @Param('id') id: string,
    @UploadedFiles(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({
          maxSize: MAX_IMAGE_SIZE_IN_BYTES,
          message(maxSize) {
            return `File size must be less than ${maxSize / 1024 / 1024} MB`;
          },
        })
        .build({
          fileIsRequired: false,
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          exceptionFactory(error) {
            throw new UnprocessableEntityException([error]);
          },
        }),
    )
    files: Express.Multer.File[],
    @Body() body: Partial<EducationalContentWithCategories>,
  ) {
    const file = files.find((f) => f.fieldname === 'fileBlob') || undefined;
    const image = files.find((f) => f.fieldname === 'imageBlob') || undefined;

    if (image && !/(jpg|jpeg|png|webp)$/.test(image.mimetype)) {
      throw new UnprocessableEntityException(['Invalid file type for image. Must be jpg, jpeg, png, or webp.']);
    }

    return this.educationalContentService.patchEducationalContent(id, image, file, body);
  }

  @Roles('Administrator')
  @UseGuards(JwtGuard, RoleGuard)
  @Get('notification-config')
  getNotificationConfig() {
    return this.educationalContentService.getNotificationConfig();
  }

  @Roles('Administrator')
  @UseGuards(JwtGuard, RoleGuard)
  @Put('notification-config')
  saveNotificationConfig(@Body() body: NotificationConfigDto) {
    return this.educationalContentService.saveNotificationConfig(body);
  }

  @Roles('Administrator')
  @UseGuards(JwtGuard, RoleGuard)
  @Delete('/:id')
  deleteContent(@Param('id') id: string) {
    return this.educationalContentService.deleteEducationalContent(id);
  }
}
