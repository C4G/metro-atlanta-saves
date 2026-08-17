import { PrismaService } from '@mas/backend-prisma';
import { BadRequestException, Injectable, StreamableFile } from '@nestjs/common';
import { Prisma } from '@mas/prisma-client';
import { imageAbsPath, imageRelPath } from '@mas/backend-shared';
import { createReadStream } from 'fs';

@Injectable()
export class ImagesService {
  constructor(private prismaService: PrismaService) {}

  async findByImageId(id: string) {
    return await this.prismaService.image.findFirst({
      where: { id },
    });
  }

  async getAll(
    programId: string,
    filters: {
      userId?: string;
      checkpointId?: string;
      unassignedUser?: boolean;
      unassignedCheckpoint?: boolean;
    },
  ) {
    const images = await this.prismaService.image.findMany({
      where: {
        programId,
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.checkpointId && { checkpointId: filters.checkpointId }),
        ...(filters.unassignedUser && { userId: null }),
        ...(filters.unassignedCheckpoint && { checkpointId: null }),
      },
      include: { user: true, checkpoint: true },
    });

    return images;
  }

  async get(id: string) {
    const image = await this.prismaService.image.findFirst({
      where: { id },
    });

    if (!image) {
      throw new BadRequestException(['The image does not exist']);
    }

    await this.prismaService.image.update({
      data: { viewedAt: new Date() },
      where: { id },
    });

    const file = createReadStream(imageAbsPath(image.path));
    return new StreamableFile(file, {
      type: image.type,
      disposition: `attachment; filename="${image.name}"`,
    });
  }

  async addOrReplaceImage(file: Express.Multer.File, programId: string, checkpointId?: string, userId?: string) {
    // If checkpointId is provided but userId is not, get the userId from the checkpoint
    if (checkpointId && !userId) {
      const checkpoint = await this.prismaService.checkpoint.findUnique({
        where: { id: checkpointId },
        select: { userId: true },
      });

      if (checkpoint) {
        userId = checkpoint.userId;
      }
    }

    // Create base data object
    const createData: Prisma.ImageUncheckedCreateInput = {
      name: file.originalname,
      path: imageRelPath(file.path),
      type: file.mimetype,
      programId,
      userId,
      checkpointId,
    };

    return await this.prismaService.image.create({
      data: createData,
    });
  }

  async updateImage(id: string, userId?: string, checkpointId?: string) {
    const updateData: Prisma.ImageUncheckedUpdateInput = {};

    if (userId) {
      updateData.userId = userId;
    }

    if (checkpointId) {
      updateData.checkpointId = checkpointId;
    }

    return await this.prismaService.image.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteImage(id: string) {
    const image = await this.prismaService.image.findFirst({
      where: { id },
    });

    if (!image) {
      throw new BadRequestException(['The image does not exist']);
    }

    return await this.prismaService.image.delete({
      where: { id },
    });
  }
}
