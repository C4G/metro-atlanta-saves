import { CheckpointsService } from '@mas/backend-checkpoints';
import { RequirementRemindersService } from '@mas/backend-requirements';
import { PrismaService } from '@mas/backend-prisma';
import { formatCurrency, imageAbsPath, imageRelPath } from '@mas/backend-shared';
import { UserFull, UsersOnProgramsWithName } from '@mas/models';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  StreamableFile,
  UnauthorizedException,
} from '@nestjs/common';
import { createReadStream } from 'node:fs';
import { Prisma } from '@mas/prisma-client';
import * as ExcelJS from 'exceljs';
import { CreateUsersOnProgramsDto } from './dto/create-users-on-programs.dto';
import { UpdateUsersOnProgramsDto } from './dto/update-users-on-programs.dto';
import { VerifyRequirementDto } from './dto/verify-requirement.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';

const COMPLETION_SELECT = {
  requirementId: true,
  completedAt: true,
  completedById: true,
  verifiedAt: true,
  verifiedBy: { select: { id: true, firstName: true, lastName: true } },
} as const;

const PAYMENT_SELECT = {
  id: true,
  createdAt: true,
  userId: true,
  amount: true,
  paidAt: true,
  checkNumber: true,
  paidBy: true,
  note: true,
  proofName: true,
  proofType: true,
} as const;

const monthNumber = (name: string) => Number(/^month\s+(\d+)$/i.exec(name.trim())?.[1] ?? 0);

type RequirementCalendarAccess = Partial<Pick<UserFull, 'role' | 'partnerId'>>;

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
  async getTaskReview(programId: string) {
    const [program, requirements, enrollments] = await Promise.all([
      this.prisma.program.findUnique({
        where: { id: programId },
        select: { startDate: true, checkpointNames: { select: { name: true } } },
      }),
      this.prisma.requirement.findMany({
        where: { programId },
        select: { id: true, name: true, dueAt: true, month: true, educationalContentId: true },
        orderBy: [{ dueAt: { sort: 'asc', nulls: 'last' } }, { name: 'asc' }],
      }),
      this.prisma.usersOnPrograms.findMany({
        where: { programId },
        select: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          requirementCompletions: {
            select: COMPLETION_SELECT,
          },
          checkpoints: {
            select: {
              id: true,
              name: true,
              savedMoney: true,
              creditScore: true,
              application: true,
              updatedAt: true,
              images: {
                select: { id: true, name: true, type: true, imageVerified: true, createdAt: true },
                orderBy: { createdAt: 'asc' },
              },
            },
            orderBy: { updatedAt: 'desc' },
          },
        },
        orderBy: { user: { lastName: 'asc' } },
      }),
    ]);
    const months = (program?.checkpointNames ?? [])
      .map(({ name }) => ({ name, number: monthNumber(name) }))
      .filter(({ number }) => number > 0)
      .sort((a, b) => a.number - b.number);
    return {
      startDate: program?.startDate ?? null,
      months,
      requirements,
      participants: enrollments.map(({ user, requirementCompletions, checkpoints }) => ({
        ...user,
        requirementStatus: requirementCompletions.map(({ requirementId }) => requirementId),
        completions: requirementCompletions,
        checkpoints,
      })),
    };
  }

  async verifyRequirement(
    programId: string,
    userId: string,
    requirementId: string,
    reviewerId: string,
    body: VerifyRequirementDto,
  ) {
    if (!body.completedAt) {
      if (!body.verified) throw new BadRequestException(['Only a completed task can be marked as not reviewed.']);
      await this.assertParticipantTask(programId, userId, requirementId);
      return this.prisma.requirementCompletion.upsert({
        where: { userId_programId_requirementId: { userId, programId, requirementId } },
        create: {
          userId,
          programId,
          requirementId,
          completedById: reviewerId,
          verifiedAt: new Date(),
          verifiedById: reviewerId,
        },
        update: { verifiedAt: new Date(), verifiedById: reviewerId },
        select: COMPLETION_SELECT,
      });
    }
    const completedAt = body.completedAt;
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.requirementCompletion.updateMany({
        where: {
          programId,
          userId,
          requirementId,
          completedAt: new Date(completedAt),
          requirement: { programId },
        },
        data: body.verified
          ? { verifiedAt: new Date(), verifiedById: reviewerId }
          : { verifiedAt: null, verifiedById: null },
      });
      if (updated.count !== 1)
        throw new ConflictException(
          'This submission changed or is no longer complete. Refresh the task list before reviewing it.',
        );
      const completion = await tx.requirementCompletion.findUnique({
        where: { userId_programId_requirementId: { userId, programId, requirementId } },
        select: COMPLETION_SELECT,
      });
      if (!completion) throw new ConflictException('This submission is no longer available. Refresh the task list.');
      return completion;
    });
  }

  async completeForParticipant(programId: string, userId: string, requirementId: string, staffId: string) {
    await this.assertParticipantTask(programId, userId, requirementId);
    return this.prisma.requirementCompletion.upsert({
      where: { userId_programId_requirementId: { userId, programId, requirementId } },
      create: { userId, programId, requirementId, completedById: staffId },
      update: {},
      select: COMPLETION_SELECT,
    });
  }

  async uncompleteForParticipant(programId: string, userId: string, requirementId: string) {
    await this.assertParticipantTask(programId, userId, requirementId);
    await this.removeCompletion(userId, programId, requirementId);
    return { requirementId };
  }

  async getPayments(programId: string) {
    return this.prisma.participantPayment.findMany({
      where: { programId },
      select: PAYMENT_SELECT,
      orderBy: { paidAt: 'desc' },
    });
  }

  async recordPayment(
    programId: string,
    userId: string,
    staffId: string,
    body: RecordPaymentDto,
    proof: Express.Multer.File,
  ) {
    const enrollment = await this.prisma.usersOnPrograms.findUnique({
      where: { userId_programId: { userId, programId } },
      select: { totalAmountPaidOut: true, paidDate: true },
    });
    if (!enrollment) throw new BadRequestException(['This participant is not in the program.']);
    const paidAt = new Date(body.paidAt);
    const amount = Number(body.amount);
    const [payment] = await this.prisma.$transaction([
      this.prisma.participantPayment.create({
        data: {
          userId,
          programId,
          amount,
          paidAt,
          checkNumber: body.checkNumber?.trim() || null,
          paidBy: body.paidBy?.trim() || null,
          note: body.note?.trim() || null,
          proofName: proof.originalname,
          proofType: proof.mimetype,
          proofPath: imageRelPath(proof.path),
          recordedById: staffId,
        },
        select: PAYMENT_SELECT,
      }),
      this.prisma.usersOnPrograms.update({
        where: { userId_programId: { userId, programId } },
        data: {
          totalAmountPaidOut: { increment: amount },
          paidDate: enrollment.paidDate && enrollment.paidDate > paidAt ? enrollment.paidDate : paidAt,
          updatedAt: new Date(),
        },
      }),
    ]);
    return payment;
  }

  async getPaymentProof(programId: string, paymentId: string) {
    const payment = await this.prisma.participantPayment.findFirst({
      where: { id: paymentId, programId },
      select: { proofName: true, proofType: true, proofPath: true },
    });
    if (!payment) throw new BadRequestException(['This payment does not exist.']);
    return new StreamableFile(createReadStream(imageAbsPath(payment.proofPath)), {
      type: payment.proofType,
      disposition: `inline; filename="${payment.proofName}"`,
    });
  }

  private async assertParticipantTask(programId: string, userId: string, requirementId: string) {
    const [enrollment, requirement] = await Promise.all([
      this.prisma.usersOnPrograms.findUnique({
        where: { userId_programId: { userId, programId } },
        select: { userId: true },
      }),
      this.prisma.requirement.findUnique({ where: { id: requirementId }, select: { programId: true } }),
    ]);
    if (!enrollment) throw new BadRequestException(['This participant is not in the program.']);
    if (!requirement || requirement.programId !== programId)
      throw new BadRequestException(['This requirement does not belong to the selected program.']);
  }

  private async removeCompletion(userId: string, programId: string, requirementId: string) {
    await this.prisma.requirementCompletion.deleteMany({ where: { userId, programId, requirementId } });
  }

  constructor(
    private prisma: PrismaService,
    private checkpointsService: CheckpointsService,
    private requirementRemindersService: RequirementRemindersService,
  ) {}

  private async validateRequirements(programId: string, requirementIds: string[]) {
    const ids = [...new Set(requirementIds)];
    if (!ids.length) return;
    const requirements = await this.prisma.requirement.findMany({
      where: { programId, id: { in: ids } },
      select: { id: true },
    });
    if (requirements.length !== ids.length)
      throw new BadRequestException('A requirement does not belong to this program.');
  }

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
        ...new Set([...requirementCompletions.map(({ requirementId }) => requirementId)]),
      ];

      return {
        ...rest,
        ...user,
        completedRequirementIds,
        requirementStatus: completedRequirementIds,
        totalAmountSaved: usersTotalSavedMap[data.userId],
      };
    });

    return retUsersOnPrograms;
  }

  async getUserOnProgram(programId: string, userId: string) {
    const enrollment = await this.prisma.usersOnPrograms.findUnique({
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
    return enrollment
      ? {
          ...enrollment,
          requirementStatus: enrollment.requirementCompletions.map(({ requirementId }) => requirementId),
        }
      : null;
  }

  async getParticipantRequirements(userId: string, access: RequirementCalendarAccess = {}) {
    const requirementSelect = {
      where: { dueAt: { not: null } },
      select: { id: true, name: true, dueAt: true },
      orderBy: { dueAt: 'asc' },
    } satisfies Prisma.RequirementFindManyArgs;
    const enrollments = await this.prisma.usersOnPrograms.findMany({
      where: { userId },
      select: {
        program: { select: { id: true, name: true, Requirement: requirementSelect } },
        requirementCompletions: { select: { requirementId: true } },
      },
    });

    const enrolledRequirements = enrollments.flatMap(({ program, requirementCompletions }) => {
      const completedIds = new Set(requirementCompletions.map(({ requirementId }) => requirementId));

      return program.Requirement.map((requirement) => ({
        id: requirement.id,
        name: requirement.name,
        programId: program.id,
        programName: program.name,
        dueAt: requirement.dueAt,
        isCompleted: completedIds.has(requirement.id),
        canComplete: true,
        isEnrolled: true,
      }));
    });

    const managedScope =
      access.role === 'Administrator'
        ? {}
        : access.role === 'Partner_Staff' && access.partnerId
          ? { partnerId: access.partnerId }
          : null;
    if (!managedScope) {
      return enrolledRequirements;
    }

    const managedPrograms = await this.prisma.program.findMany({
      where: {
        ...managedScope,
        isTemplate: false,
        id: { notIn: enrollments.map(({ program }) => program.id) },
      },
      select: { id: true, name: true, Requirement: requirementSelect },
    });

    return [
      ...enrolledRequirements,
      ...managedPrograms.flatMap((program) =>
        program.Requirement.map((requirement) => ({
          id: requirement.id,
          name: requirement.name,
          programId: program.id,
          programName: program.name,
          dueAt: requirement.dueAt,
          isCompleted: false,
          canComplete: false,
          isEnrolled: false,
        })),
      ),
    ];
  }

  async completeRequirement(userId: string, programId: string, requirementId: string) {
    const userOnProgram = await this.prisma.usersOnPrograms.findUnique({
      where: { userId_programId: { userId, programId } },
      select: { userId: true },
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
      select: { userId: true },
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
    await this.removeCompletion(userId, programId, requirementId);
    return { requirementId };
  }

  async addUsersOnPrograms(createUsersOnProgramsDto: CreateUsersOnProgramsDto) {
    const { requirementStatus = [], ...membershipData } = createUsersOnProgramsDto;
    await this.validateRequirements(membershipData.programId, requirementStatus);
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
        data: {
          ...membershipData,
          requirementCompletions: { create: [...new Set(requirementStatus)].map((requirementId) => ({ requirementId })) },
        },
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
        completedRequirementIds: [...new Set(requirementStatus)],
        requirementStatus: [...new Set(requirementStatus)],
      };
    } catch (error: any) {
      throw new BadRequestException([error?.message || 'Failed to add user to program']);
    }
  }

  async patchUsersOnPrograms(userId: string, programId: string, updateUsersOnProgramsDto: UpdateUsersOnProgramsDto) {
    const { requirementStatus, ...membershipData } = updateUsersOnProgramsDto;
    if (requirementStatus) await this.validateRequirements(programId, requirementStatus);
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
          ...membershipData,
          ...(requirementStatus
            ? {
                requirementCompletions: {
                  deleteMany: { requirementId: { notIn: requirementStatus } },
                  upsert: [...new Set(requirementStatus)].map((requirementId) => ({
                    where: { userId_programId_requirementId: { userId, programId, requirementId } },
                    create: { requirementId },
                    update: {},
                  })),
                },
              }
            : {}),
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
        requirementStatus: requirementCompletions.map(({ requirementId }) => requirementId),
        completedRequirementIds: [...new Set([...requirementCompletions.map(({ requirementId }) => requirementId)])],
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
      const completedRequirementIds = new Set(userOnProgram.completedRequirementIds ?? []);
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
