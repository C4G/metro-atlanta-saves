import {
  assetDir,
  assetUrl,
  editFileName,
  ManagedSessionGuard,
  MAX_IMAGE_SIZE_IN_BYTES,
  validateImageFileType,
} from '@mas/backend-shared';
import {
  Controller,
  HttpStatus,
  ParseFilePipeBuilder,
  Post,
  UnprocessableEntityException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';

@Controller('rich-text-images')
@ApiBearerAuth()
@ApiTags('rich-text-images')
export class RichTextImagesController {
  @Post('upload')
  @UseGuards(ManagedSessionGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: assetDir('rich-text'),
        filename: editFileName,
      }),
      limits: { fileSize: MAX_IMAGE_SIZE_IN_BYTES },
    }),
  )
  upload(
    @UploadedFile(
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
    file: Express.Multer.File,
  ) {
    validateImageFileType(file);
    return { url: assetUrl(file.path) };
  }
}
