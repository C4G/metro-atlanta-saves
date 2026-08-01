import { Module } from '@nestjs/common';
import { EducationalCategoryService } from './educational-category.service';
import { EducationalCategoryController } from './educational-category.controller';

@Module({
  providers: [EducationalCategoryService],
  controllers: [EducationalCategoryController],
  exports: [EducationalCategoryService],
})
export class EducationalCategoryModule {}
