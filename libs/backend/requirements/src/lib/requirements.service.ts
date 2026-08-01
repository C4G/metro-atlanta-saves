import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateRequirementDto } from './dto/create-requirement.dto';
import { UpdateRequirementDto } from './dto/update-requirement.dto';
import { PrismaService } from '@mas/backend-prisma';

@Injectable()
export class RequirementsService {
  constructor(private prismaService: PrismaService) {}

  async create(id: string, requirement: CreateRequirementDto) {
    try {
      if (requirement.educationalContentId) {
        const educationalContent = await this.prismaService.educationalContent.findFirst({
          where: {
            id: requirement.educationalContentId,
          },
        });

        if (!educationalContent) {
          throw new BadRequestException(`Educational content with id: ${requirement.educationalContentId} not found`);
        }
      }

      const createdRequirement = await this.prismaService.requirement.create({
        data: { ...requirement, programId: id },
      });

      return createdRequirement;
    } catch (error: any) {
      throw new BadRequestException([error?.message || 'Failed to create requirement']);
    }
  }

  async findAll() {
    return await this.prismaService.requirement.findMany({
      include: {
        EducationalContent: true,
      },
    });
  }

  async findAllForProgram(programId: string) {
    return this.prismaService.requirement.findMany({
      where: { programId },
      include: { EducationalContent: true },
    });
  }

  async findOne(id: string) {
    const requirement = await this.prismaService.requirement.findUnique({
      where: { id },
      include: {
        EducationalContent: true,
      },
    });
    if (!requirement) {
      throw new BadRequestException([`Requirement with id: ${id}, not found.`]);
    }

    return requirement;
  }

  async update(id: string, body: UpdateRequirementDto) {
    return await this.prismaService.requirement.update({
      where: { id },
      data: { ...body, updatedAt: new Date() },
      include: {
        EducationalContent: true,
      },
    });
  }

  async remove(id: string) {
    const requirement = await this.prismaService.requirement.findUnique({
      where: { id },
    });
    if (!requirement) {
      throw new BadRequestException(['The requirement does not exist']);
    }
    try {
      return await this.prismaService.requirement.delete({
        where: { id },
      });
    } catch (error: any) {
      throw new BadRequestException([error?.message || 'Failed to delete requirement']);
    }
  }
}
