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
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import { StoriesService } from './stories.service';

@Controller('stories')
@ApiBearerAuth()
@ApiTags('stories')
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: assetDir('stories'),
        filename: editFileName,
      }),
    }),
  )
  @Roles('Administrator')
  @UseGuards(ManagedSessionGuard, RoleGuard)
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
    @Body() createStoryDto: CreateStoryDto,
  ) {
    validateImageFileType(file);
    return this.storiesService.create(file, createStoryDto);
  }

  @Get()
  findAll() {
    return this.storiesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.storiesService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: assetDir('stories'),
        filename: editFileName,
      }),
    }),
  )
  @Roles('Administrator')
  @UseGuards(ManagedSessionGuard, RoleGuard)
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
    @Body() updateStoryDto: UpdateStoryDto,
  ) {
    if (file) {
      validateImageFileType(file);
    }
    return this.storiesService.update(id, file, updateStoryDto);
  }

  @Delete(':id')
  @Roles('Administrator')
  @UseGuards(ManagedSessionGuard, RoleGuard)
  remove(@Param('id') id: string) {
    return this.storiesService.remove(id);
  }
}
