import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@mas/backend-prisma';

@Injectable()
export class EducationalCategoryService {
  constructor(private prisma: PrismaService) {}

  async getEducationalCategories() {
    const categories = await this.prisma.educationalCategory.findMany();

    return categories;
  }

  async addEducationalCategory(category: string) {
    const existingCategory = await this.prisma.educationalCategory.findUnique({
      where: { category },
    });

    if (existingCategory) {
      throw new NotFoundException([`${category} Educational category already exists`]);
    }
    try {
      const createdCategory = await this.prisma.educationalCategory.create({
        data: {
          category,
        },
      });

      return createdCategory;
    } catch (error: any) {
      throw new BadRequestException([error?.message || 'Failed to add category']);
    }
  }

  async patchEducationalCategory(id: string, category: string) {
    const existingCategory = await this.prisma.educationalCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new NotFoundException([`Educational category with ID ${id} not found`]);
    }
    try {
      const updatedCategory = await this.prisma.educationalCategory.update({
        where: { id },
        data: {
          category,
          updatedAt: new Date(),
        },
      });

      return updatedCategory;
    } catch (error: any) {
      throw new BadRequestException([error?.message || 'Failed to patch category']);
    }
  }

  async deleteEducationalCategory(id: string) {
    const resourcesCount = await this.prisma.educationalContent.count({
      where: {
        EducationalCategoryContentMapping: {
          some: {
            categoryId: id,
          },
        },
      },
    });

    if (resourcesCount > 0) {
      throw new BadRequestException(['Cannot delete category. It is linked with educational resources.']);
    }
    try {
      const deletedCategory = await this.prisma.educationalCategory.delete({
        where: { id },
      });

      return deletedCategory;
    } catch (error: any) {
      throw new BadRequestException([error?.message || 'Failed to delete category']);
    }
  }
}
