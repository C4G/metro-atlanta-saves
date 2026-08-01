import { PrismaService } from '@mas/backend-prisma';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateAlliesOnProgramsDto } from './dto/create-allies-on-programs.dto';

@Injectable()
export class AlliesOnProgramsService {
  constructor(private prisma: PrismaService) {}

  async getAlliesOnPrograms(programId: string) {
    try {
      const alliesOnPrograms = await this.prisma.alliesOnPrograms.findMany({
        where: {
          programId,
        },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastLogin: true, lastName: true, bio: true },
          },
        },
        orderBy: { user: { firstName: 'asc' } },
      });

      // Flatten the response to match the expected structure
      return alliesOnPrograms.map((data) => {
        const { user, ...rest } = data;
        return {
          ...rest,
          ...user,
        };
      });
    } catch (err: unknown) {
      console.error('AlliesOnProgramsService.getAlliesOnPrograms error', err);
      throw new BadRequestException([(err as Error)?.message ?? 'There was an error retrieving allies']);
    }
  }

  async addAlliesOnPrograms(createAlliesOnProgramsDto: CreateAlliesOnProgramsDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: createAlliesOnProgramsDto.userId,
      },
    });

    if (!user) {
      throw new BadRequestException([`User ${createAlliesOnProgramsDto.userId} does not exist`]);
    }

    const existingUser = await this.prisma.usersOnPrograms.findUnique({
      where: {
        userId_programId: {
          userId: createAlliesOnProgramsDto.userId,
          programId: createAlliesOnProgramsDto.programId,
        },
      },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (existingUser) {
      throw new BadRequestException([
        `${existingUser.user.firstName} ${existingUser.user.lastName} is already a user in this program and cannot be added as an ally`,
      ]);
    }

    const existingAlly = await this.prisma.alliesOnPrograms.findUnique({
      where: {
        userId_programId: {
          userId: createAlliesOnProgramsDto.userId,
          programId: createAlliesOnProgramsDto.programId,
        },
      },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
        program: {
          select: { name: true },
        },
      },
    });

    if (existingAlly) {
      throw new BadRequestException([
        `${existingAlly.user.firstName} ${existingAlly.user.lastName} is already an ally in the ${existingAlly.program.name} program`,
      ]);
    }
    try {
      const createdUserOnProgram = await this.prisma.alliesOnPrograms.create({
        data: createAlliesOnProgramsDto,
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true, lastLogin: true, bio: true },
          },
        },
      });
      const { user } = createdUserOnProgram;
      return user;
    } catch (error: any) {
      // Handle unique constraint violation (P2002)
      const isUniqueViolation = error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
      // fallback: inspect message text for unique constraint indicator
      const messageHasUniqueConstraint =
        typeof error?.message === 'string' && error.message.includes('Unique constraint failed');

      if (isUniqueViolation || messageHasUniqueConstraint) {
        throw new BadRequestException([`${user.firstName} ${user.lastName} is already an ally in this program`]);
      } else {
        throw new BadRequestException([error?.message || 'Failed to add user to program']);
      }
    }
  }

  async deleteAlliesOnPrograms(userId: string, programId: string) {
    try {
      const existingUserOnProgram = await this.prisma.alliesOnPrograms.findUnique({
        where: {
          userId_programId: {
            userId,
            programId,
          },
        },
      });

      if (!existingUserOnProgram) {
        throw new BadRequestException([`User ${userId} on program ${programId} not found as an ally`]);
      }

      const deletedUserOnProgram = await this.prisma.alliesOnPrograms.delete({
        where: { userId_programId: { userId, programId } },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true, lastLogin: true, bio: true },
          },
        },
      });
      const { user } = deletedUserOnProgram;

      return user;
    } catch (error: unknown) {
      throw new BadRequestException([(error as Error)?.message || 'Failed to delete ally from program']);
    }
  }
}
