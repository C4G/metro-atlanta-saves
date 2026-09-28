import { Module } from '@nestjs/common';
import { ImagesController } from './images.controller';
import { ImagesService } from './images.service';
import { CheckpointsModule } from '@mas/backend-checkpoints';
import { ProgramsModule } from '@mas/backend-programs';
import { UsersModule } from '@mas/backend-users';
import { RichTextImagesController } from './rich-text-images.controller';

@Module({
  controllers: [ImagesController, RichTextImagesController],
  providers: [ImagesService],
  exports: [ImagesService],
  imports: [CheckpointsModule, ProgramsModule, UsersModule],
})
export class ImagesModule {}
