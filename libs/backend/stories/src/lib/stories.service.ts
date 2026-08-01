import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import { PrismaService } from '@mas/backend-prisma';
import { assetUrl } from '@mas/backend-shared';

@Injectable()
export class StoriesService {
  constructor(private prismaService: PrismaService) {}

  async create(file: Express.Multer.File, story: CreateStoryDto) {
    const data = {
      ...story,
      imageUrl: assetUrl(file.path),
    };
    try {
      const createdStory = await this.prismaService.story.create({
        data,
      });

      return createdStory;
    } catch (error: any) {
      throw new BadRequestException([error?.message || 'Failed to create story']);
    }
  }

  async findAll() {
    try {
      return await this.prismaService.story.findMany();
    } catch (error: any) {
      throw new BadRequestException([error?.message || 'Failed to load stories']);
    }
  }

  async findOne(id: string) {
    try {
      return await this.prismaService.story.findUnique({
        where: { id },
      });
    } catch (error: any) {
      throw new BadRequestException([error?.message || 'Failed to load story']);
    }
  }

  async update(id: string, file: Express.Multer.File | undefined, updateStoryDto: UpdateStoryDto) {
    const data = file
      ? {
          ...updateStoryDto,
          imageUrl: assetUrl(file.path),
        }
      : updateStoryDto;
    try {
      return await this.prismaService.story.update({
        where: { id },
        data,
      });
    } catch (error: any) {
      throw new BadRequestException([error?.message || 'Failed to delete story']);
    }
  }

  async remove(id: string) {
    try {
      return await this.prismaService.story.delete({
        where: { id },
      });
    } catch (error: any) {
      throw new BadRequestException([error?.message || 'Failed to delete story']);
    }
  }
}
