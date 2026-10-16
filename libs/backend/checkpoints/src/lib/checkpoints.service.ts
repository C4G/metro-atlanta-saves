import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { CreateCheckpointDto } from './dto/create-checkpoint.dto';
import { PrismaService } from '@mas/backend-prisma';
import { MailService } from '@mas/backend-mail';
import { SaveMonthlyProgressDto } from './dto/save-monthly-progress.dto';

@Injectable()
export class CheckpointsService {
  constructor(
    private prismaService: PrismaService,
    private mailService: MailService,
  ) {}

  async getParticipantProgress(userId: string, programId: string) {
    const enrollment = await this.prismaService.usersOnPrograms.findUnique({
      where: { userId_programId: { userId, programId } },
      select: {
        program: { select: { checkpointNames: { orderBy: [{ sequence: 'asc' }, { name: 'asc' }] } } },
        checkpoints: { include: { images: true }, orderBy: { updatedAt: 'desc' } },
      },
    });
    if (!enrollment) throw new ForbiddenException('You can only view progress for programs you are enrolled in.');
    return { checkpointNames: enrollment.program.checkpointNames, checkpoints: enrollment.checkpoints };
  }

  async saveParticipantProgress(userId: string, programId: string, name: string, body: SaveMonthlyProgressDto) {
    // Serializable retries prevent simultaneous first submissions from creating duplicate monthly entries.
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await this.prismaService.$transaction(
          async (tx) => {
            const enrollment = await tx.usersOnPrograms.findUnique({
              where: { userId_programId: { userId, programId } },
              select: { program: { select: { checkpointNames: { where: { name } } } } },
            });
            if (!enrollment) throw new ForbiddenException('You can only save progress for your own programs.');
            const configured = enrollment.program.checkpointNames[0];
            if (!configured || (configured.type !== 'Savings' && !/^month\s+\d+$/i.test(configured.name.trim()))) {
              throw new BadRequestException('This month is not available in your program.');
            }
            const entries = await tx.checkpoint.findMany({
              where: { userId, programId, name },
              include: { images: true },
              orderBy: { updatedAt: 'desc' },
            });
            if (entries.some((entry) => entry.images.some((image) => image.imageVerified))) {
              throw new ForbiddenException(
                'This progress has been verified. Contact your program team to make changes.',
              );
            }
            const existing = entries[0];
            const data = {
              savedMoney: body.savedMoney,
              creditScore: body.creditScore ?? null,
              application: body.application?.trim() || null,
            };
            return existing
              ? tx.checkpoint.update({ where: { id: existing.id }, data, include: { images: true } })
              : tx.checkpoint.create({ data: { ...data, name, programId, userId }, include: { images: true } });
          },
          { isolationLevel: 'Serializable' },
        );
      } catch (error) {
        if (
          attempt === 2 ||
          typeof error !== 'object' ||
          error === null ||
          !('code' in error) ||
          error.code !== 'P2034'
        )
          throw error;
      }
    }
    throw new BadRequestException('We could not save your progress. Please try again.');
  }

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
