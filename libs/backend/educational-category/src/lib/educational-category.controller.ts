import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { EducationalCategoryService } from './educational-category.service';

import { JwtGuard, RoleGuard, Roles } from '@mas/backend-shared';
import { CategoryRequest } from './request/category';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Controller('educational-category')
@ApiBearerAuth()
@ApiTags('educational-category')
export class EducationalCategoryController {
  constructor(private educationalCategoryService: EducationalCategoryService) {}

  @Get()
  categories() {
    return this.educationalCategoryService.getEducationalCategories();
  }

  @Roles('Administrator')
  @UseGuards(JwtGuard, RoleGuard)
  @Post('')
  createCategory(@Body() body: CategoryRequest) {
    return this.educationalCategoryService.addEducationalCategory(body.category);
  }

  @Roles('Administrator')
  @UseGuards(JwtGuard, RoleGuard)
  @Patch('/:id')
  patchCategory(@Param('id') id: string, @Body() body: CategoryRequest) {
    return this.educationalCategoryService.patchEducationalCategory(id, body.category);
  }

  @Roles('Administrator')
  @UseGuards(JwtGuard, RoleGuard)
  @Delete('/:id')
  deleteCategory(@Param('id') id: string) {
    return this.educationalCategoryService.deleteEducationalCategory(id);
  }
}
