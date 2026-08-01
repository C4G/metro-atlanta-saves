import {
  assetDir,
  editFileName,
  JwtGuard,
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
import { UpdateDescriptionDto } from './dto/update-description.dto';
import { DescriptionService } from './description.service';

const WIDTHS = [406, 812];

@Controller('description')
@ApiBearerAuth()
@ApiTags('description')
export class DescriptionController {
  constructor(private readonly descriptionService: DescriptionService) {}

  @Get()
  findAll() {
    return this.descriptionService.find();
  }

  @Get('logo/:filename')
  getLogo(@Param('filename') filename: string, @Res() res: Response) {
    res.sendFile(basename(filename), { root: assetDir('logo') });
  }

  @Patch()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_, __, callback) => callback(null, assetDir('logo')),
        filename: editFileName,
      }),
    }),
  )
  @Roles('Administrator')
  @UseGuards(JwtGuard, RoleGuard)
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
    @Body() updateDescriptionDto: UpdateDescriptionDto,
  ) {
    if (file) {
      file.path = file.path.replace(/\\/g, '/');
      validateImageFileType(file);

      const name = basename(file.path, extname(file.path));
      const ext = extname(file.path);
      const logoDir = assetDir('logo');
      await Promise.all(
        WIDTHS.map((width) =>
          sharp(file.path)
            .resize(width)
            .toFile(join(logoDir, `${name}-${width}w${ext}`)),
        ),
      );
    }
    return this.descriptionService.update(file, updateDescriptionDto);
  }
}
