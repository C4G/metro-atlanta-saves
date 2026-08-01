import { Module } from '@nestjs/common';
import { EducationalContentService } from './educational-content.service';
import { EducationalContentController } from './educational-content.controller';

@Module({
  providers: [EducationalContentService],
  controllers: [EducationalContentController],
  exports: [EducationalContentService],
})
export class EducationalContentModule {}
