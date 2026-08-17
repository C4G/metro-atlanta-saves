import { PrismaService } from '@mas/backend-prisma';
import { BadRequestException, Injectable } from '@nestjs/common';
import type { CheckpointName } from '@mas/prisma-client';

@Injectable()
export class CheckpointNamesService {
  constructor(private prismaService: PrismaService) {}

  async findAll() {
    return await this.prismaService.checkpointName.findMany({
      orderBy: { sequence: 'asc' },
    });
  }

  async getByProgramId(programId: string) {
    const checkpointNames = await this.prismaService.program.findUnique({
      where: { id: programId },
      include: { checkpointNames: true },
    });
    if (!checkpointNames) {
      throw new BadRequestException(['No checkpoint names found for that program']);
    }
    return checkpointNames;
  }

  async create(checkpointName: CheckpointName) {
    try {
      return await this.prismaService.checkpointName.create({
        data: checkpointName,
      });
    } catch {
      throw new BadRequestException(['Failed to add checkpoint name']);
    }
  }

  async update(name: string, update: CheckpointName) {
    try {
      return await this.prismaService.checkpointName.update({
        where: { name },
        data: update,
      });
    } catch {
      throw new BadRequestException(['That checkpoint name already exists']);
    }
  }

  async remove(name: string) {
    try {
      return await this.prismaService.checkpointName.delete({
        where: { name },
      });
    } catch {
      throw new BadRequestException(['Failed to delete checkpoint name']);
    }
  }
}
