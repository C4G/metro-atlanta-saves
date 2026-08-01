import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCohortDto } from './dto/create-cohort.dto';
import { UpdateCohortDto } from './dto/update-cohort.dto';
import { PrismaService } from '@mas/backend-prisma';
import { assetUrl } from '@mas/backend-shared';

@Injectable()
export class CohortsService {
  constructor(private prismaService: PrismaService) {}

  async create(file: Express.Multer.File, cohort: CreateCohortDto) {
    const data = {
      ...cohort,
      imageUrl: assetUrl(file.path),
    };
    try {
      const createdCohort = await this.prismaService.cohort.create({
        data,
      });

      return createdCohort;
    } catch (error: any) {
      throw new BadRequestException([error?.message || 'Failed to create cohort']);
    }
  }

  async findAll() {
    try {
      return await this.prismaService.cohort.findMany();
    } catch (error: any) {
      throw new BadRequestException([error?.message || 'Failed to load cohorts']);
    }
  }

  async findOne(id: string) {
    try {
      return await this.prismaService.cohort.findUnique({
        where: { id },
      });
    } catch (error: any) {
      throw new BadRequestException([error?.message || 'Failed to load cohort']);
    }
  }

  async update(id: string, file: Express.Multer.File | undefined, updateCohortDto: UpdateCohortDto) {
    const data = file
      ? {
          ...updateCohortDto,
          imageUrl: assetUrl(file.path),
        }
      : updateCohortDto;
    try {
      return await this.prismaService.cohort.update({
        where: { id },
        data,
      });
    } catch (error: any) {
      throw new BadRequestException([error?.message || 'Failed to delete cohort']);
    }
  }

  async remove(id: string) {
    try {
      return await this.prismaService.cohort.delete({
        where: { id },
      });
    } catch (error: any) {
      throw new BadRequestException([error?.message || 'Failed to delete cohort']);
    }
  }
}
