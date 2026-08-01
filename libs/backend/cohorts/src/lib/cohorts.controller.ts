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
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  Patch,
  Post,
  UnprocessableEntityException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { CohortsService } from './cohorts.service';
import { CreateCohortDto } from './dto/create-cohort.dto';
import { UpdateCohortDto } from './dto/update-cohort.dto';

@Controller('cohorts')
@ApiBearerAuth()
@ApiTags('cohorts')
export class CohortsController {
  constructor(private readonly cohortsService: CohortsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: assetDir('cohorts'),
        filename: editFileName,
      }),
    }),
  )
  @Roles('Administrator')
  @UseGuards(JwtGuard, RoleGuard)
  create(
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
    @Body() createCohortDto: CreateCohortDto,
  ) {
    validateImageFileType(file);
    return this.cohortsService.create(file, createCohortDto);
  }

  @Get()
  findAll() {
    return this.cohortsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cohortsService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: assetDir('cohorts'),
        filename: editFileName,
      }),
    }),
  )
  @Roles('Administrator')
  @UseGuards(JwtGuard, RoleGuard)
  update(
    @Param('id') id: string,
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
    @Body() updateCohortDto: UpdateCohortDto,
  ) {
    if (file) {
      validateImageFileType(file);
    }
    return this.cohortsService.update(id, file, updateCohortDto);
  }

  @Delete(':id')
  @Roles('Administrator')
  @UseGuards(JwtGuard, RoleGuard)
  remove(@Param('id') id: string) {
    return this.cohortsService.remove(id);
  }
}
