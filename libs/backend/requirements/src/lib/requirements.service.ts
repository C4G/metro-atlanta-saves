import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateRequirementDto } from './dto/create-requirement.dto';
import { UpdateRequirementDto } from './dto/update-requirement.dto';
import { PrismaService } from '@mas/backend-prisma';
import { RequirementRemindersService } from './requirement-reminders.service';

@Injectable()
export class RequirementsService {
  constructor(
    private prismaService: PrismaService,
    private requirementRemindersService: RequirementRemindersService,
  ) {}

  async create(id: string, requirement: CreateRequirementDto) {
    try {
      const data = this.withValidatedReminder(requirement, requirement.dueAt, false);
      if (requirement.educationalContentId) {
        const educationalContent = await this.prismaService.educationalContent.findFirst({
          where: {
            id: requirement.educationalContentId,
          },
        });

        if (!educationalContent) {
          throw new BadRequestException(`Educational content with id: ${requirement.educationalContentId} not found`);
        }
      }

      const createdRequirement = await this.prismaService.requirement.create({
        data: { ...data, programId: id },
      });

      await this.requirementRemindersService.reconcileRequirement(createdRequirement.id);

      return createdRequirement;
    } catch (error: any) {
      throw new BadRequestException([error?.message || 'Failed to create requirement']);
    }
  }

  async findAll() {
    return await this.prismaService.requirement.findMany({
      include: {
        EducationalContent: true,
      },
    });
  }

  async findAllForProgram(programId: string) {
    return this.prismaService.requirement.findMany({
      where: { programId },
      include: { EducationalContent: true },
    });
  }

  async findOne(id: string) {
    const requirement = await this.prismaService.requirement.findUnique({
      where: { id },
      include: {
        EducationalContent: true,
      },
    });
    if (!requirement) {
      throw new BadRequestException([`Requirement with id: ${id}, not found.`]);
    }

    return requirement;
  }

  async update(id: string, body: UpdateRequirementDto) {
    const existing = await this.prismaService.requirement.findUnique({
      where: { id },
      select: { dueAt: true },
    });
    if (!existing) {
      throw new BadRequestException([`Requirement with id: ${id}, not found.`]);
    }

    const effectiveDueAt = body.dueAt === undefined ? existing.dueAt : body.dueAt;
    const data = this.withValidatedReminder(body, effectiveDueAt);
    const updatedRequirement = await this.prismaService.requirement.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
      include: {
        EducationalContent: true,
      },
    });
    await this.requirementRemindersService.reconcileRequirement(id);
    return updatedRequirement;
  }

  async remove(id: string) {
    const requirement = await this.prismaService.requirement.findUnique({
      where: { id },
    });
    if (!requirement) {
      throw new BadRequestException(['The requirement does not exist']);
    }
    try {
      return await this.prismaService.requirement.delete({
        where: { id },
      });
    } catch (error: any) {
      throw new BadRequestException([error?.message || 'Failed to delete requirement']);
    }
  }

  private withValidatedReminder<T extends Pick<CreateRequirementDto, 'dueAt' | 'reminderDaysBefore'>>(
    body: T,
    effectiveDueAt: Date | string | null | undefined,
    clearReminderWhenDueDateIsRemoved = true,
  ) {
    if (body.reminderDaysBefore != null && body.reminderDaysBefore !== 1 && body.reminderDaysBefore !== 7) {
      throw new BadRequestException(['Reminder must be scheduled either 1 or 7 days before the due date.']);
    }

    if (clearReminderWhenDueDateIsRemoved && body.dueAt === null) {
      return { ...body, dueAt: null, reminderDaysBefore: null };
    }

    if (effectiveDueAt == null) {
      if (body.reminderDaysBefore != null) {
        throw new BadRequestException(['A due date is required to schedule a reminder.']);
      }
      return { ...body, dueAt: effectiveDueAt, reminderDaysBefore: null };
    }

    return { ...body };
  }
}
