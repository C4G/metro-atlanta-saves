import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCheckpointDto } from './dto/create-checkpoint.dto';
import { PrismaService } from '@mas/backend-prisma';
import { MailService } from '@mas/backend-mail';

@Injectable()
export class CheckpointsService {
  constructor(
    private prismaService: PrismaService,
    private mailService: MailService,
  ) {}

  async create(checkpoint: CreateCheckpointDto) {
    try {
      const createdCheckpoint = await this.prismaService.checkpoint.create({
        data: checkpoint,
      });
      return createdCheckpoint;
    } catch (error: any) {
      throw new BadRequestException([error?.message || 'Failed to add checkpoint']);
    }
  }

  async findAll() {
    return await this.prismaService.checkpoint.findMany();
  }

  async findAllForUserAndProgram(programId: string, userId: string) {
    return await this.prismaService.checkpoint.findMany({
      where: { programId, userId },
      include: { images: true },
      orderBy: { checkpointName: { sequence: 'asc' } },
    });
  }

  async findOne(id: string) {
    return await this.prismaService.checkpoint.findUnique({
      where: { id },
    });
  }

  async findByUserAndCheckpointId(id: string, userId: string) {
    return await this.prismaService.checkpoint.findFirst({
      where: { id, userId },
    });
  }

  async getTotalAmountSaved(programId: string, userId: string[]) {
    const checkpointSavings = await this.prismaService.checkpoint.findMany({
      select: { userId: true, savedMoney: true },
      where: { programId, userId: { in: userId }, checkpointName: { type: 'Savings' } },
      orderBy: { createdAt: 'asc' },
    });
    return checkpointSavings.reduce<Record<string, number>>((prev, curr) => {
      if (prev[curr.userId]) {
        return { ...prev, [curr.userId]: prev[curr.userId] + (curr.savedMoney ?? 0) };
      }
      return { ...prev, [curr.userId]: curr.savedMoney ?? 0 };
    }, {});
  }

  async update(id: string, body: Partial<CreateCheckpointDto>) {
    return await this.prismaService.checkpoint.update({
      where: { id },
      data: { ...body, updatedAt: new Date() },
    });
  }

  async remove(id: string) {
    try {
      const checkpoint = await this.prismaService.checkpoint.findUnique({
        where: { id },
      });

      if (!checkpoint) {
        throw new BadRequestException(['The checkpoint does not exist']);
      }

      return await this.prismaService.checkpoint.delete({
        where: { id },
      });
    } catch (error: any) {
      throw new BadRequestException([error?.message || 'Failed to delete checkpoint']);
    }
  }

  async approve(id: string) {
    const checkpoint = await this.prismaService.checkpoint.findUnique({
      where: { id },
      include: { images: true },
    });

    if (checkpoint) {
      // Update all images for this checkpoint to verified
      await this.prismaService.image.updateMany({
        where: { checkpointId: id },
        data: { imageVerified: true },
      });

      const user = await this.prismaService.user.findUnique({
        where: { id: checkpoint.userId },
      });
      if (user) {
        await this.mailService.sendCheckpointImageChanged(true, user.email, checkpoint.id);
      }
    }
    return checkpoint;
  }

  async reject(id: string) {
    const checkpoint = await this.prismaService.checkpoint.findUnique({
      where: { id },
      include: { images: true },
    });

    if (checkpoint) {
      // Update all images for this checkpoint to not verified
      await this.prismaService.image.updateMany({
        where: { checkpointId: id },
        data: { imageVerified: false },
      });

      const user = await this.prismaService.user.findUnique({
        where: { id: checkpoint.userId },
      });
      if (user) {
        await this.mailService.sendCheckpointImageChanged(false, user.email, checkpoint.id);
      }
    }
    return checkpoint;
  }
}
