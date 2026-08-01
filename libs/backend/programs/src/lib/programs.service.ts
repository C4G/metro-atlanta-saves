import { PrismaService } from '@mas/backend-prisma';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateProgramDto } from './dto/create-program.dto';
import { EnrollDto } from './dto/enroll.dto';
import { UpdateProgramDto } from './dto/update-program.dto';

@Injectable()
export class ProgramsService {
  constructor(private prismaService: PrismaService) {}

  async getPartnerId(programId: string) {
    const program = await this.prismaService.program.findUnique({
      select: { partnerId: true },
      where: { id: programId },
    });
    if (!program) {
      throw new BadRequestException(['The program does not exist']);
    }
    return program.partnerId;
  }

  async approveEnrollment(enrollmentId: string) {
    const enrollment = await this.prismaService.enrollment.findUnique({
      where: { id: enrollmentId },
    });
    if (!enrollment) {
      throw new BadRequestException(['The enrollment does not exist']);
    }
    const { id, meetingAvailablility, employerCommitted, interest, gain, zipCode, address, ...allData } = enrollment;
    const enrollmentData = {
      ...allData,
      address: `${address}, ${zipCode}`,
    };
    const userOnProgram = await this.prismaService.usersOnPrograms.create({
      data: {
        ...enrollmentData,
      },
    });
    if (!userOnProgram) {
      throw new BadRequestException(['Failed to approve enrollment']);
    }
    const checkpointNames = await this.prismaService.checkpointName.findMany();
    const data = checkpointNames.map(({ name }) => ({
      userId: enrollmentData.userId,
      programId: enrollmentData.programId,
      name,
    }));
    await this.prismaService.checkpoint.createMany({
      data,
    });
    const deleted = await this.prismaService.enrollment.delete({
      where: { id: enrollmentId },
      include: { user: true },
    });

    const {
      user: { firstName, lastName },
      ...rest
    } = deleted;

    return {
      ...rest,
      firstName,
      lastName,
    };
  }

  async rejectEnrollment(enrollmentId: string) {
    const deleted = await this.prismaService.enrollment.delete({
      where: { id: enrollmentId },
      include: { user: true },
    });

    const {
      user: { firstName, lastName },
      ...rest
    } = deleted;

    return {
      ...rest,
      firstName,
      lastName,
    };
  }

  async create(id: string, program: CreateProgramDto) {
    try {
      const createdProgram = await this.prismaService.program.create({
        data: {
          ...program,
          partnerId: id,
          checkpointNames: {
            connect: program.checkpointNames,
          },
        },
        include: {
          checkpointNames: {
            select: {
              name: true,
            },
          },
        },
      });

      await this.prismaService.program.update({
        where: {
          id: createdProgram.id,
        },
        data: {
          checkpointNames: {
            connect: program.checkpointNames,
          },
        },
        include: {
          checkpointNames: {
            select: {
              name: true,
            },
          },
        },
      });

      return createdProgram;
    } catch (error: any) {
      throw new BadRequestException([error?.message || 'Failed to create program']);
    }
  }

  async findAll() {
    return await this.prismaService.program.findMany({
      include: {
        checkpointNames: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  async enroll(enrollData: EnrollDto) {
    try {
      return await this.prismaService.enrollment.create({
        data: enrollData,
      });
    } catch {
      throw new BadRequestException(["You're already enrolled in this program. Please wait to be accepted!"]);
    }
  }

  async findAllForPartner(partnerId: string) {
    return await this.prismaService.program.findMany({
      where: { partnerId },
      include: {
        checkpointNames: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  async findUpcoming(id?: string) {
    return await this.prismaService.program.findMany({
      select: { id: true, name: true, startDate: true, endDate: true, description: true, checkpointNames: true },
      where: {
        startDate: {
          gte: new Date(),
        },
        id,
      },
    });
  }

  async getEnrollments(programId: string) {
    const enrollments = await this.prismaService.enrollment.findMany({
      where: { programId },
      include: { user: true },
    });

    return enrollments.map(({ user, ...rest }) => ({
      ...rest,
      firstName: user.firstName,
      lastName: user.lastName,
    }));
  }

  async getProgramsForUser(userId: string) {
    return this.prismaService.program.findMany({
      where: {
        UsersOnPrograms: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        checkpointNames: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const program = await this.prismaService.program.findUnique({
      where: { id },
      include: {
        checkpointNames: {
          select: {
            name: true,
          },
        },
      },
    });
    if (!program) {
      throw new BadRequestException([`Program with id: ${id}, not found.`]);
    }

    return program;
  }

  async update(id: string, body: UpdateProgramDto) {
    return await this.prismaService.program.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date(),
        checkpointNames: {
          set: body.checkpointNames,
        },
      },
      include: {
        checkpointNames: true,
      },
    });
  }

  async isUserInProgram(userId: string, programId: string) {
    const result = await this.prismaService.usersOnPrograms.findFirst({
      where: {
        userId: userId,
        programId: programId,
      },
    });
    return result !== null;
  }

  async remove(id: string) {
    const program = await this.prismaService.program.findUnique({
      where: { id },
      select: { Requirement: true, UsersOnPrograms: true },
    });
    if (!program) {
      throw new BadRequestException(['The program does not exist']);
    }
    if (program?.Requirement.length) {
      throw new BadRequestException(['Cannot delete program. Linked requirements must be removed']);
    }
    if (program?.UsersOnPrograms.length) {
      throw new BadRequestException(['Cannot delete program. Linked program users must be removed']);
    }
    try {
      return await this.prismaService.program.delete({
        where: { id },
      });
    } catch (error: any) {
      throw new BadRequestException([error?.message || 'Failed to delete program']);
    }
  }

  async clone(id: string, name: string) {
    const program = await this.prismaService.program.findUnique({
      where: { id },
      include: {
        checkpointNames: { select: { name: true } },
        Requirement: true,
      },
    });
    if (!program) {
      throw new BadRequestException([`Program with id: ${id}, not found.`]);
    }
    if (!program.isTemplate) {
      throw new BadRequestException(['Only DEFAULT or TEMPLATE programs can be cloned']);
    }

    try {
      const cloned = await this.prismaService.program.create({
        data: {
          name,
          description: program.description,
          partnerId: program.partnerId,
          startDate: program.startDate,
          endDate: program.endDate,
          checkpointNames: {
            connect: program.checkpointNames,
          },
        },
      });

      if (program.Requirement.length) {
        await this.prismaService.requirement.createMany({
          data: program.Requirement.map((r) => ({
            name: r.name,
            programId: cloned.id,
            educationalContentId: r.educationalContentId,
          })),
        });
      }

      return cloned;
    } catch (error: any) {
      throw new BadRequestException([error?.message || 'Failed to create cloned program']);
    }
  }
}
