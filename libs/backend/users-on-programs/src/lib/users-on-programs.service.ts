import { CheckpointsService } from '@mas/backend-checkpoints';
import { PrismaService } from '@mas/backend-prisma';
import { formatCurrency } from '@mas/backend-shared';
import { UsersOnProgramsWithName } from '@mas/models';
import { BadRequestException, Injectable } from '@nestjs/common';
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
      },
      orderBy: { user: { firstName: 'asc' } },
    });
    const usersTotalSavedMap = await this.checkpointsService.getTotalAmountSaved(
      programId,
      usersOnPrograms.map((val) => val.userId),
    );

    const retUsersOnPrograms: UsersOnProgramsWithName[] = usersOnPrograms.map((data) => {
      const { user, ...rest } = data;

      return {
        ...rest,
        ...user,
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
        checkpoints: {
          include: { checkpointName: true, images: true },
          orderBy: [{ checkpointName: { sequence: 'asc' } }],
        },
      },
    });
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
      return { ...rest, ...user };
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
        },
      });
      const userTotalSavedMap = await this.checkpointsService.getTotalAmountSaved(programId, [userId]);
      const { user, ...rest } = updatedUserOnProgram;

      return {
        ...rest,
        ...user,
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
      program.Requirement.forEach((requirement) => {
        const completed = userOnProgram.requirementStatus.some(
          (requirementId: string) => requirementId === requirement.id,
        );
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
