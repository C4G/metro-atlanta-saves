import { PrismaService } from '@mas/backend-prisma';
import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { CreateProgramDto } from './dto/create-program.dto';
import { EnrollDto } from './dto/enroll.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { SaveMonthlyPlanDto } from './dto/save-monthly-plan.dto';
import { SaveFrequentTaskDto } from './dto/save-frequent-task.dto';

const monthNumber = (name: string) => Number(/^month\s+(\d+)$/i.exec(name.trim())?.[1] ?? 0);

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

  async findAll(search?: string) {
    return await this.prismaService.program.findMany({
      where: this.programSearchWhere(search),
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

  async findAllForPartner(partnerId: string, search?: string) {
    return await this.prismaService.program.findMany({
      where: {
        partnerId,
        ...this.programSearchWhere(search),
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

  private programSearchWhere(search?: string) {
    const term = search?.trim();
    return term
      ? {
          OR: [
            { name: { contains: term, mode: 'insensitive' as const } },
            { description: { contains: term, mode: 'insensitive' as const } },
          ],
        }
      : {};
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
        partner: { select: { name: true } },
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

  async saveMonthlyPlan(
    programId: string,
    { months, assignments, newTasks = [], removedRequirementIds = [] }: SaveMonthlyPlanDto,
  ) {
    return this.prismaService.$transaction(async (tx) => {
      const program = await tx.program.findUnique({
        where: { id: programId },
        select: { checkpointNames: { select: { name: true } }, Requirement: { select: { id: true, month: true } } },
      });
      if (!program) throw new BadRequestException(['The program does not exist']);

      const assigned = new Map(assignments.map((assignment) => [assignment.requirementId, assignment]));
      const removed = new Set(removedRequirementIds);
      const programRequirementIds = new Set(program.Requirement.map(({ id }) => id));
      if ([...assigned.keys(), ...removed].some((id) => !programRequirementIds.has(id))) {
        throw new BadRequestException(['Every task must belong to this program.']);
      }
      if (
        [...assigned.values(), ...newTasks].some(({ month }) => month !== null && month !== undefined && month > months)
      ) {
        throw new BadRequestException([`Tasks can only be assigned to Month 1 through Month ${months}.`]);
      }
      const stranded = program.Requirement.filter(
        ({ id, month }) => !assigned.has(id) && !removed.has(id) && month !== null && month > months,
      );
      if (stranded.length) {
        throw new ConflictException([`Move or remove the tasks after Month ${months} before shortening the program.`]);
      }

      const monthNames = Array.from({ length: months }, (_, index) => `Month ${index + 1}`);
      await tx.checkpointName.createMany({
        data: monthNames.map((name, index) => ({ name, type: 'Savings' as const, sequence: index + 1 })),
        skipDuplicates: true,
      });
      const otherNames = program.checkpointNames.filter(({ name }) => !monthNumber(name)).map(({ name }) => ({ name }));
      await tx.program.update({
        where: { id: programId },
        data: {
          updatedAt: new Date(),
          checkpointNames: { set: [...otherNames, ...monthNames.map((name) => ({ name }))] },
        },
      });
      if (removed.size) await tx.requirement.deleteMany({ where: { id: { in: [...removed] }, programId } });
      for (const [id, { month, name, dueAt, educationalContentId }] of assigned) {
        if (removed.has(id)) continue;
        await tx.requirement.update({
          where: { id },
          data: {
            month: month ?? null,
            updatedAt: new Date(),
            ...(name !== undefined && { name: name.trim() }),
            ...(dueAt !== undefined && { dueAt, ...(dueAt === null && { reminderDaysBefore: null }) }),
            ...(educationalContentId !== undefined && { educationalContentId }),
          },
        });
      }
      const created = [];
      for (const task of newTasks) {
        created.push(
          await tx.requirement.create({
            data: {
              programId,
              name: task.name.trim(),
              month: task.month,
              dueAt: task.dueAt ?? null,
              educationalContentId: task.educationalContentId ?? null,
            },
            select: { id: true, name: true, dueAt: true, month: true, educationalContentId: true },
          }),
        );
      }
      return {
        months,
        assignments: [...assigned.keys()]
          .filter((id) => !removed.has(id))
          .map((requirementId) => ({ requirementId, month: assigned.get(requirementId)?.month ?? null })),
        created,
        removedRequirementIds: [...removed],
      };
    });
  }

  async getFrequentTasks(programId: string) {
    const partnerId = await this.getPartnerId(programId);
    return this.prismaService.frequentTask.findMany({
      where: { partnerId },
      select: { id: true, name: true, educationalContentId: true },
      orderBy: { name: 'asc' },
    });
  }

  async addFrequentTask(programId: string, { name, educationalContentId }: SaveFrequentTaskDto) {
    const partnerId = await this.getPartnerId(programId);
    const trimmed = name.trim();
    return this.prismaService.frequentTask.upsert({
      where: { partnerId_name: { partnerId, name: trimmed } },
      create: { partnerId, name: trimmed, educationalContentId: educationalContentId ?? null },
      update: { educationalContentId: educationalContentId ?? null },
      select: { id: true, name: true, educationalContentId: true },
    });
  }

  async removeFrequentTask(programId: string, taskId: string) {
    const partnerId = await this.getPartnerId(programId);
    const { count } = await this.prismaService.frequentTask.deleteMany({ where: { id: taskId, partnerId } });
    if (!count) throw new BadRequestException(['That frequently used task does not exist.']);
    return { id: taskId };
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
