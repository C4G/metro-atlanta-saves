import {
  assetDir,
  editFileName,
  ManagedSessionGuard,
  MAX_IMAGE_SIZE_IN_BYTES,
  RoleGuard,
  Roles,
  validateImageFileType,
} from '@mas/backend-shared';
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  Patch,
  Res,
  UnprocessableEntityException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { diskStorage } from 'multer';
import { basename, extname, join } from 'path';
import sharp from 'sharp';
import { UpdateIntroductionDto } from './dto/update-introduction.dto';
import { IntroductionService } from './introduction.service';

const WIDTHS = [640, 828, 1080, 1920];

@Controller('introduction')
@ApiBearerAuth()
@ApiTags('introduction')
export class IntroductionController {
  constructor(private readonly introductionService: IntroductionService) {}

  @Get()
  findAll() {
    return this.introductionService.find();
  }

  @Get('image/:filename')
  getImage(@Param('filename') filename: string, @Res() res: Response) {
    res.sendFile(basename(filename), { root: assetDir('introduction') });
  }

  @Patch()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_, __, callback) => callback(null, assetDir('introduction')),
        filename: editFileName,
      }),
    }),
  )
  @Roles('Administrator')
  @UseGuards(ManagedSessionGuard, RoleGuard)
  async update(
    @UploadedFile(
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
    file: Express.Multer.File | undefined,
    @Body() updateIntroductionDto: UpdateIntroductionDto,
  ) {
    if (file) {
      file.path = file.path.replace(/\\/g, '/');
      validateImageFileType(file);

      const name = basename(file.path, extname(file.path));
      const ext = extname(file.path);
      const introDir = assetDir('introduction');
      await Promise.all(
        WIDTHS.map((width) =>
          sharp(file.path)
            .resize(width)
            .toFile(join(introDir, `${name}-${width}w${ext}`)),
        ),
      );
    }
    return this.introductionService.update(file, updateIntroductionDto);
  }
}
