import { CheckpointsService } from '@mas/backend-checkpoints';
import { RequirementRemindersService } from '@mas/backend-requirements';
import { PrismaService } from '@mas/backend-prisma';
import { formatCurrency } from '@mas/backend-shared';
import { UsersOnProgramsWithName } from '@mas/models';
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@mas/prisma-client';
import * as ExcelJS from 'exceljs';
import { CreateUsersOnProgramsDto } from './dto/create-users-on-programs.dto';
import { UpdateUsersOnProgramsDto } from './dto/update-users-on-programs.dto';

const EXCEL_COLUMN_KEYS: (keyof UsersOnProgramsWithName)[] = [
  'birthdate',
  'phone',
  'gender',
  'race',
  'married',
  'educationStatus',
  'militaryStatus',
  'placeOfEmployment',
  'annualIncome',
  'monthsEmployed',
  'address',
  'start',
  'end',
  'graduated',
  'inactive',
  'creditScoreIncentive',
  'totalAmountPaidOut',
  'paidDate',
];

@Injectable()
export class UsersOnProgramsService {
  constructor(
    private prisma: PrismaService,
    private checkpointsService: CheckpointsService,
    private requirementRemindersService: RequirementRemindersService,
  ) {}

  async getUsersOnPrograms(programId: string) {
    const usersOnPrograms = await this.prisma.usersOnPrograms.findMany({
      where: {
        programId,
      },
      include: {
        user: {
          select: { email: true, firstName: true, lastLogin: true, lastName: true, bio: true },
        },
        program: {
          select: {
            Requirement: {
              select: {
                id: true,
              },
            },
          },
        },
        requirementCompletions: {
          select: { requirementId: true },
        },
      },
      orderBy: { user: { firstName: 'asc' } },
    });
    const usersTotalSavedMap = await this.checkpointsService.getTotalAmountSaved(
      programId,
      usersOnPrograms.map((val) => val.userId),
    );

    const retUsersOnPrograms: UsersOnProgramsWithName[] = usersOnPrograms.map((data) => {
      const { user, requirementCompletions, ...rest } = data;
      const completedRequirementIds = [
        ...new Set([
          ...(rest.requirementStatus ?? []),
          ...requirementCompletions.map(({ requirementId }) => requirementId),
        ]),
      ];

      return {
        ...rest,
        ...user,
        completedRequirementIds,
        totalAmountSaved: usersTotalSavedMap[data.userId],
      };
    });

    return retUsersOnPrograms;
  }

  async getUserOnProgram(programId: string, userId: string) {
    return await this.prisma.usersOnPrograms.findUnique({
      where: {
        userId_programId: {
          userId: userId,
          programId: programId,
        },
      },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
        program: {
          select: {
            name: true,
            Requirement: {
              include: {
                EducationalContent: true,
              },
            },
          },
        },
        requirementCompletions: {
          select: { requirementId: true, completedAt: true },
        },
        checkpoints: {
          include: { checkpointName: true, images: true },
          orderBy: [{ checkpointName: { sequence: 'asc' } }],
        },
      },
    });
  }

  async getParticipantRequirements(userId: string) {
    const enrollments = await this.prisma.usersOnPrograms.findMany({
      where: { userId },
      select: {
        program: {
          select: {
            id: true,
            name: true,
            Requirement: {
              where: { dueAt: { not: null } },
              select: { id: true, name: true, dueAt: true, actionInstructions: true },
              orderBy: { dueAt: 'asc' },
            },
          },
        },
        requirementCompletions: { select: { requirementId: true } },
        requirementStatus: true,
      },
    });

    return enrollments.flatMap(({ program, requirementCompletions, requirementStatus }) => {
      const completedIds = new Set([
        ...(requirementStatus ?? []),
        ...requirementCompletions.map(({ requirementId }) => requirementId),
      ]);

      return program.Requirement.map((requirement) => ({
        id: requirement.id,
        name: requirement.name,
        programId: program.id,
        programName: program.name,
        dueAt: requirement.dueAt,
        isCompleted: completedIds.has(requirement.id),
        canComplete: true,
      }));
    });
  }

  async completeRequirement(userId: string, programId: string, requirementId: string) {
    const userOnProgram = await this.prisma.usersOnPrograms.findUnique({
      where: { userId_programId: { userId, programId } },
      select: { userId: true, requirementStatus: true },
    });

    if (!userOnProgram) {
      throw new UnauthorizedException(["You can only complete requirements for programs you're enrolled in."]);
    }

    const requirement = await this.prisma.requirement.findUnique({
      where: { id: requirementId },
      select: { programId: true, actionInstructions: true },
    });

    if (!requirement || requirement.programId !== programId) {
      throw new BadRequestException(['This requirement does not belong to the selected program.']);
    }

    return this.prisma.requirementCompletion.upsert({
      where: {
        userId_programId_requirementId: { userId, programId, requirementId },
      },
      create: { userId, programId, requirementId },
      update: {},
      select: { requirementId: true, completedAt: true },
    });
  }

  async uncompleteRequirement(userId: string, programId: string, requirementId: string) {
    const enrollment = await this.prisma.usersOnPrograms.findUnique({
      where: { userId_programId: { userId, programId } },
      select: { requirementStatus: true },
    });
    if (!enrollment) {
      throw new UnauthorizedException(["You can only update requirements for programs you're enrolled in."]);
    }
    const requirement = await this.prisma.requirement.findUnique({
      where: { id: requirementId },
      select: { programId: true, actionInstructions: true },
    });
    if (!requirement || requirement.programId !== programId) {
      throw new BadRequestException(['This requirement does not belong to the selected program.']);
    }
    // Remove both completion sources atomically, preserving other legacy statuses.
    await this.prisma.$transaction([
      this.prisma.$executeRaw`
        UPDATE "UsersOnPrograms"
        SET "requirementStatus" = array_remove("requirementStatus", ${requirementId}), "updatedAt" = NOW()
        WHERE "userId" = ${userId} AND "programId" = ${programId}
      `,
      this.prisma.requirementCompletion.deleteMany({ where: { userId, programId, requirementId } }),
    ]);
    return { requirementId };
  }

  async addUsersOnPrograms(createUsersOnProgramsDto: CreateUsersOnProgramsDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: createUsersOnProgramsDto.userId,
      },
    });

    if (!user) {
      throw new BadRequestException([`User ${createUsersOnProgramsDto.userId} does not exist`]);
    }

    const existingAlly = await this.prisma.alliesOnPrograms.findUnique({
      where: {
        userId_programId: {
          userId: createUsersOnProgramsDto.userId,
          programId: createUsersOnProgramsDto.programId,
        },
      },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (existingAlly) {
      throw new BadRequestException([
        `${existingAlly.user.firstName} ${existingAlly.user.lastName} is already an ally in this program and cannot be added as a user`,
      ]);
    }

    const existingUserOnProgram = await this.prisma.usersOnPrograms.findUnique({
      where: {
        userId_programId: {
          userId: createUsersOnProgramsDto.userId,
          programId: createUsersOnProgramsDto.programId,
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

    if (existingUserOnProgram) {
      throw new BadRequestException([
        `${existingUserOnProgram.user.firstName} ${existingUserOnProgram.user.lastName} is already in the ${existingUserOnProgram.program.name} program`,
      ]);
    }
    try {
      const createdUserOnProgram = await this.prisma.usersOnPrograms.create({
        data: createUsersOnProgramsDto,
        include: {
          user: {
            select: { email: true, firstName: true, lastName: true },
          },
        },
      });
      const { user, ...rest } = createdUserOnProgram;
      const checkpointNames = await this.prisma.checkpointName.findMany({
        select: {
          name: true,
        },
        where: {
          Program: { some: { id: createUsersOnProgramsDto.programId } },
        },
      });
      const data = checkpointNames.map(({ name }) => ({
        userId: createUsersOnProgramsDto.userId,
        programId: createUsersOnProgramsDto.programId,
        name,
      }));
      await this.prisma.checkpoint.createMany({
        data,
      });
      await this.requirementRemindersService.reconcileUserProgram(
        createUsersOnProgramsDto.programId,
        createUsersOnProgramsDto.userId,
      );
      return {
        ...rest,
        ...user,
        completedRequirementIds: [...new Set(createdUserOnProgram.requirementStatus ?? [])],
      };
    } catch (error: any) {
      throw new BadRequestException([error?.message || 'Failed to add user to program']);
    }
  }

  async patchUsersOnPrograms(userId: string, programId: string, updateUsersOnProgramsDto: UpdateUsersOnProgramsDto) {
    const existingUserOnProgram = await this.prisma.usersOnPrograms.findUnique({
      where: {
        userId_programId: {
          userId,
          programId,
        },
      },
    });

    if (!existingUserOnProgram) {
      throw new BadRequestException([`User ${userId} on program ${programId} not found`]);
    }
    try {
      const updatedUserOnProgram = await this.prisma.usersOnPrograms.update({
        where: { userId_programId: { userId, programId } },
        data: {
          ...updateUsersOnProgramsDto,
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: { firstName: true, lastName: true },
          },
          requirementCompletions: {
            select: { requirementId: true },
          },
        },
      });
      const userTotalSavedMap = await this.checkpointsService.getTotalAmountSaved(programId, [userId]);
      const { user, requirementCompletions, ...rest } = updatedUserOnProgram;

      return {
        ...rest,
        ...user,
        completedRequirementIds: [
          ...new Set([
            ...(updatedUserOnProgram.requirementStatus ?? []),
            ...requirementCompletions.map(({ requirementId }) => requirementId),
          ]),
        ],
        totalAmountSaved: userTotalSavedMap[userId],
      };
    } catch (error: any) {
      throw new BadRequestException([error?.message || 'Failed to update user on program']);
    }
  }

  async deleteUsersOnPrograms(userId: string, programId: string) {
    try {
      const existingUserOnProgram = await this.prisma.usersOnPrograms.findUnique({
        where: {
          userId_programId: {
            userId,
            programId,
          },
        },
      });

      if (!existingUserOnProgram) {
        throw new BadRequestException([`User ${userId} on program ${programId} not found`]);
      }

      const deletedUserOnProgram = await this.prisma.usersOnPrograms.delete({
        where: { userId_programId: { userId, programId } },
        include: {
          user: {
            select: { firstName: true, lastName: true },
          },
        },
      });
      const { user, ...rest } = deletedUserOnProgram;

      return { ...rest, ...user };
    } catch (error: any) {
      const isFkViolation = error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003';
      const messageHasRestrict = typeof error?.message === 'string' && error.message.includes('violates RESTRICT');

      if (isFkViolation || messageHasRestrict) {
        throw new BadRequestException([
          'Cannot delete user from program as user still has assigned checkpoints. Please remove assigned checkpoints first.',
        ]);
      } else {
        throw new BadRequestException([error?.message || 'Failed to delete user from program']);
      }
    }
  }

  async generateExcel(programId: string): Promise<Buffer> {
    const program = await this.prisma.program.findFirst({
      where: {
        id: programId,
      },
      include: {
        Requirement: true,
      },
    });

    if (!program) {
      throw new BadRequestException(`Program with ID ${programId} not found`);
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`${program.name}-users`);

    const headerRow = [
      'First Name',
      'Last Name',
      'Total Amount Saved',
      ...program.Requirement.map((requirement) => requirement.name),
      ...EXCEL_COLUMN_KEYS.map((field) => field.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())),
    ];
    worksheet.addRow(headerRow);

    const headerCell = worksheet.getRow(1);
    headerCell.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'e1e1e1' } };
      cell.border = {
        bottom: { style: 'thin', color: { argb: '000000' } },
        right: { style: 'thin', color: { argb: '000000' } },
      };
    });

    const usersOnPrograms = await this.getUsersOnPrograms(programId);
    usersOnPrograms.forEach((userOnProgram) => {
      const rowData = [
        userOnProgram.firstName,
        userOnProgram.lastName,
        formatCurrency.format(userOnProgram.totalAmountSaved ?? 0),
      ];

      // Mark ticks for completed requirements
      const completedRequirementIds = new Set(userOnProgram.completedRequirementIds ?? userOnProgram.requirementStatus);
      program.Requirement.forEach((requirement) => {
        const completed = completedRequirementIds.has(requirement.id);
        rowData.push(completed ? '✔' : '');
      });

      EXCEL_COLUMN_KEYS.forEach((field) => {
        rowData.push(userOnProgram[field]?.toString() ?? '');
      });

      worksheet.addRow(rowData);
    });

    // Adjust column widths
    worksheet.columns.forEach((column: Partial<ExcelJS.Column>) => {
      if (column?.values) {
        const maxLength = Math.max(
          ...column.values.map((value: ExcelJS.CellValue) => (value ? value.toString().length : 0)),
        );
        column.width = maxLength > 12 ? maxLength + 2 : 12; // Set minimum width to 12 characters
      }
    });

    const excelBuffer = await workbook.xlsx.writeBuffer();

    return Buffer.from(excelBuffer);
  }
}
