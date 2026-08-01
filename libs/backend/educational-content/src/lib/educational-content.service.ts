import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@mas/backend-prisma';
import { MailService } from '@mas/backend-mail';
import { assetUrl } from '@mas/backend-shared';
import { EducationalContentWithCategories } from '@mas/models';
import { NotificationConfigDto } from './dto/notification-config.dto';

@Injectable()
export class EducationalContentService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async getEducationalContent(categoryIds: string[]) {
    let contentsByCategory;
    const include = {
      EducationalCategoryContentMapping: {
        include: {
          category: {
            select: {
              category: true,
            },
          },
        },
      },
    };

    if (categoryIds.length === 0) {
      // If categoryIds is empty, return all educational contents with associated categories
      contentsByCategory = await this.prisma.educationalContent.findMany({
        include,
      });
    } else {
      // If categoryIds is not empty, filter educational contents by categoryIds
      contentsByCategory = await this.prisma.educationalContent.findMany({
        where: {
          EducationalCategoryContentMapping: {
            some: {
              categoryId: {
                in: categoryIds,
              },
            },
          },
        },
        include,
      });
    }

    const transformedResult = contentsByCategory.map((content) => ({
      ...content,
      categories: content.EducationalCategoryContentMapping.map((mapping) => mapping.category.category),
    }));

    return transformedResult;
  }

  async addEducationalContent(
    image: Express.Multer.File | undefined,
    file: Express.Multer.File | undefined,
    contentWithCategories: EducationalContentWithCategories,
  ) {
    const { categories, ...contentWithoutCategories } = contentWithCategories;
    if (categories.length === 0) {
      throw new BadRequestException(['At least one category must be provided']);
    }
    let categories_list: string[] = [];
    if (typeof categories === 'string') {
      try {
        categories_list = JSON.parse(categories);
      } catch {
        throw new BadRequestException('Invalid categories format');
      }
    } else if (Array.isArray(categories)) {
      categories_list = categories;
    } else {
      throw new BadRequestException('Categories must be a JSON string or an array');
    }

    try {
      const createdContent = await this.prisma.educationalContent.create({
        data: {
          ...contentWithoutCategories,
          image: image ? assetUrl(image.path) : null,
          file: file ? assetUrl(file.path) : null,
          EducationalCategoryContentMapping: {
            create: categories_list.map((categoryId: string) => ({
              category: { connect: { id: categoryId } },
            })),
          },
        },
        include: {
          EducationalCategoryContentMapping: {
            include: {
              category: {
                select: {
                  category: true,
                },
              },
            },
          },
        },
      });

      const result = {
        ...createdContent,
        categories: createdContent.EducationalCategoryContentMapping.map((mapping) => mapping.category.category),
      };

      await this.sendNotificationForNewContent(createdContent.title, createdContent.description);

      return result;
    } catch (error: any) {
      throw new BadRequestException([error?.message || 'Failed to add content']);
    }
  }

  private async sendNotificationForNewContent(contentTitle: string, contentDescription: string) {
    const config = await this.prisma.notificationConfig.findFirst();

    let emails: string[] = [];
    let heading: string;
    let body: string;

    if (config) {
      heading = config.heading;
      body = config.body;

      if (config.programId) {
        const users = await this.prisma.usersOnPrograms.findMany({
          where: { programId: config.programId },
          distinct: ['userId'],
          include: {
            user: {
              select: { email: true },
            },
          },
        });
        emails = users.map((u) => u.user.email);
      } else if (config.userId) {
        const user = await this.prisma.user.findUnique({
          where: { id: config.userId },
          select: { email: true },
        });
        if (user) {
          emails = [user.email];
        }
      }
    } else {
      // Fallback: send to all enrolled users with default heading/body
      heading = `New educational content posted: ${contentTitle}`;
      body = contentDescription;

      const enrolledUsers = await this.prisma.usersOnPrograms.findMany({
        distinct: ['userId'],
        include: {
          user: {
            select: { email: true },
          },
        },
      });
      emails = enrolledUsers.map((u) => u.user.email);
    }

    if (emails.length > 0) {
      await this.mailService.sendNewEducationalContent(emails, heading, body);
    }
  }

  async patchEducationalContent(
    id: string,
    image: Express.Multer.File | undefined,
    file: Express.Multer.File | undefined,
    contentWithCategories: Partial<EducationalContentWithCategories>,
  ) {
    const existingContent = await this.prisma.educationalContent.findUnique({
      where: { id },
    });

    if (!existingContent) {
      throw new NotFoundException([`Educational content with ID ${id} not found`]);
    }
    try {
      const { categories, ...contentWithoutCategories } = contentWithCategories;
      let categories_list: string[] = [];
      if (typeof categories === 'string') {
        try {
          categories_list = JSON.parse(categories);
        } catch {
          throw new BadRequestException('Invalid categories format');
        }
      } else if (Array.isArray(categories)) {
        categories_list = categories;
      } else {
        throw new BadRequestException('Categories must be a JSON string or an array');
      }
      const include = {
        EducationalCategoryContentMapping: {
          include: {
            category: {
              select: {
                category: true,
              },
            },
          },
        },
      };
      let updatedContent;
      if (categories_list) {
        const categoriesWithIds = await this.prisma.educationalCategory.findMany({
          where: {
            id: {
              in: categories_list,
            },
          },
        });
        updatedContent = await this.prisma.educationalContent.update({
          where: { id },
          data: {
            ...contentWithoutCategories,
            image: image ? assetUrl(image.path) : contentWithoutCategories.image,
            file: file ? assetUrl(file.path) : contentWithoutCategories.file,
            updatedAt: new Date(),
            EducationalCategoryContentMapping: {
              deleteMany: {
                categoryId: {
                  notIn: categoriesWithIds.map(({ id }) => id),
                },
                contentId: id,
              },
              upsert: categoriesWithIds.map((category) => ({
                where: { categoryId_contentId: { categoryId: category.id, contentId: id } },
                create: { categoryId: category.id },
                update: { categoryId: category.id },
              })),
            },
          },
          include,
        });
      } else {
        updatedContent = await this.prisma.educationalContent.update({
          where: { id },
          data: {
            ...contentWithCategories,
            image: image ? assetUrl(image.path) : contentWithCategories.image,
            file: file ? assetUrl(file.path) : contentWithCategories.file,
            updatedAt: new Date(),
          },
          include,
        });
      }

      return {
        ...updatedContent,
        categories: updatedContent.EducationalCategoryContentMapping.map((mapping) => mapping.category.category),
      };
    } catch (error: any) {
      throw new BadRequestException([error?.message || 'Failed to patch content']);
    }
  }

  async getNotificationConfig() {
    return this.prisma.notificationConfig.findFirst();
  }

  async saveNotificationConfig(dto: NotificationConfigDto) {
    const existing = await this.prisma.notificationConfig.findFirst();

    if (existing) {
      return this.prisma.notificationConfig.update({
        where: { id: existing.id },
        data: {
          heading: dto.heading,
          body: dto.body,
          programId: dto.programId ?? null,
          userId: dto.userId ?? null,
          updatedAt: new Date(),
        },
      });
    }

    return this.prisma.notificationConfig.create({
      data: {
        heading: dto.heading,
        body: dto.body,
        programId: dto.programId ?? null,
        userId: dto.userId ?? null,
      },
    });
  }

  async deleteEducationalContent(id: string) {
    try {
      await this.prisma.educationalContentsOnEducationalCategories.deleteMany({
        where: {
          contentId: id,
        },
      });

      const deletedContent = await this.prisma.educationalContent.delete({
        where: { id },
      });

      return deletedContent;
    } catch (error: any) {
      throw new BadRequestException([error?.message || 'Failed to delete content']);
    }
  }
}
