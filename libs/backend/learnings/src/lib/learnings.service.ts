import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateLearningDto } from './dto/create-learning.dto';
import { UpdateLearningDto } from './dto/update-learning.dto';
import { PrismaService } from '@mas/backend-prisma';

@Injectable()
export class LearningsService {
  constructor(private prismaService: PrismaService) {}

  async create(createLearningDto: CreateLearningDto) {
    try {
      return await this.prismaService.learning.create({
        data: createLearningDto,
      });
    } catch (error: any) {
      throw new BadRequestException([error?.message || 'Failed to add learning']);
    }
  }

  async findAll() {
    return await this.prismaService.learning.findMany({
      orderBy: { sequence: 'asc' },
    });
  }

  async findOne(id: string) {
    return await this.prismaService.learning.findUnique({
      where: { id },
    });
  }

  async update(id: string, body: UpdateLearningDto) {
    return await this.prismaService.learning.update({
      where: { id },
      data: { ...body, updatedAt: new Date() },
    });
  }

  async remove(id: string) {
    const learning = await this.prismaService.learning.findUnique({
      where: { id },
    });

    if (!learning) {
      throw new BadRequestException(["The learning doesn't exist"]);
    }
    try {
      return await this.prismaService.learning.delete({
        where: { id },
      });
    } catch (error: any) {
      throw new BadRequestException([error?.message || 'Failed to delete learning']);
    }
  }
}
