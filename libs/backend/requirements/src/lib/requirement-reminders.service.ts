import { MailService } from '@mas/backend-mail';
import { PrismaService } from '@mas/backend-prisma';
import { RequirementReminderStatus } from '@mas/prisma-client';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { getRequirementReminderScheduledAt, type RequirementReminderOffset } from './requirement-reminder-time';

const MAX_ATTEMPTS = 5;
const CLAIM_BATCH_SIZE = 10;
const PROCESSING_LEASE_MS = 10 * 60 * 1000;
const MAX_RETRY_DELAY_MS = 6 * 60 * 60 * 1000;

type ClaimedDelivery = {
  id: string;
  userId: string;
  programId: string;
  requirementId: string;
  dueAtSnapshot: Date;
  reminderDaysBefore: number;
};

@Injectable()
export class RequirementRemindersService implements OnApplicationBootstrap {
  private readonly logger = new Logger(RequirementRemindersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async onApplicationBootstrap() {
    try {
      await this.reconcileAll();
      await this.dispatchDue();
    } catch (error) {
      this.logger.error('Initial reminder reconciliation failed', error);
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES, { name: 'requirement-reminder-reconcile', waitForCompletion: true })
  async reconcileOnSchedule() {
    await this.reconcileAll();
  }

  @Cron(CronExpression.EVERY_MINUTE, { name: 'requirement-reminder-dispatch', waitForCompletion: true })
  async dispatchOnSchedule() {
    await this.dispatchDue();
  }

  async reconcileRequirement(requirementId: string) {
    try {
      const requirement = await this.prisma.requirement.findUnique({
        where: { id: requirementId },
        select: { id: true, programId: true, dueAt: true, reminderDaysBefore: true },
      });

      if (!requirement?.dueAt || !this.isOffset(requirement.reminderDaysBefore)) {
        await this.cancelPendingForRequirement(requirementId);
        return;
      }

      if (requirement.dueAt.getTime() <= Date.now()) {
        await this.cancelPendingForRequirement(requirementId);
        return;
      }

      const offset = requirement.reminderDaysBefore;
      const scheduledAt = getRequirementReminderScheduledAt(requirement.dueAt, offset);
      const now = new Date();

      await this.prisma.requirementReminderDelivery.updateMany({
        where: {
          requirementId,
          status: RequirementReminderStatus.PENDING,
          OR: [{ dueAtSnapshot: { not: requirement.dueAt } }, { reminderDaysBefore: { not: offset } }],
        },
        data: {
          status: RequirementReminderStatus.CANCELLED,
          leaseExpiresAt: null,
          updatedAt: now,
        },
      });

      const memberships = await this.prisma.usersOnPrograms.findMany({
        where: {
          programId: requirement.programId,
          requirementCompletions: { none: { requirementId } },
        },
        select: { userId: true, programId: true, requirementStatus: true },
      });

      const incompleteMemberships = memberships.filter(
        ({ requirementStatus }) => !requirementStatus.includes(requirementId),
      );
      await this.createDeliveries(incompleteMemberships, requirement.id, requirement.dueAt, offset, scheduledAt);
    } catch (error) {
      this.logger.error(`Could not reconcile reminders for requirement ${requirementId}`, error);
    }
  }

  async reconcileUserProgram(programId: string, userId: string) {
    try {
      const [membership, requirements] = await Promise.all([
        this.prisma.usersOnPrograms.findUnique({
          where: { userId_programId: { userId, programId } },
          select: {
            userId: true,
            programId: true,
            requirementStatus: true,
            requirementCompletions: { select: { requirementId: true } },
          },
        }),
        this.prisma.requirement.findMany({
          where: { programId, dueAt: { not: null }, reminderDaysBefore: { not: null } },
          select: { id: true, dueAt: true, reminderDaysBefore: true },
        }),
      ]);

      if (!membership) {
        return;
      }

      const completedIds = new Set([
        ...membership.requirementStatus,
        ...membership.requirementCompletions.map(({ requirementId }) => requirementId),
      ]);
      const now = new Date();

      for (const requirement of requirements) {
        if (
          !requirement.dueAt ||
          !this.isOffset(requirement.reminderDaysBefore) ||
          requirement.dueAt.getTime() <= now.getTime()
        ) {
          continue;
        }

        if (completedIds.has(requirement.id)) {
          await this.prisma.requirementReminderDelivery.updateMany({
            where: {
              userId,
              programId,
              requirementId: requirement.id,
              status: RequirementReminderStatus.PENDING,
            },
            data: { status: RequirementReminderStatus.SKIPPED, updatedAt: now },
          });
          continue;
        }

        await this.createDeliveries(
          [{ userId: membership.userId, programId: membership.programId }],
          requirement.id,
          requirement.dueAt,
          requirement.reminderDaysBefore,
          getRequirementReminderScheduledAt(requirement.dueAt, requirement.reminderDaysBefore),
        );
      }
    } catch (error) {
      this.logger.error(`Could not reconcile reminders for learner ${userId} in program ${programId}`, error);
    }
  }

  async dispatchDue() {
    try {
      await this.recoverExpiredClaims();

      while (true) {
        const claimed = await this.claimDueDeliveries();
        if (claimed.length === 0) {
          return;
        }

        await Promise.all(claimed.map((delivery) => this.sendDelivery(delivery)));
        if (claimed.length < CLAIM_BATCH_SIZE) {
          return;
        }
      }
    } catch (error) {
      this.logger.error('Requirement reminder dispatch failed', error);
    }
  }

  private async reconcileAll() {
    const requirements = await this.prisma.requirement.findMany({ select: { id: true } });
    for (const { id } of requirements) {
      await this.reconcileRequirement(id);
    }
  }

  private async cancelPendingForRequirement(requirementId: string) {
    await this.prisma.requirementReminderDelivery.updateMany({
      where: { requirementId, status: RequirementReminderStatus.PENDING },
      data: {
        status: RequirementReminderStatus.CANCELLED,
        leaseExpiresAt: null,
        updatedAt: new Date(),
      },
    });
  }

  private async createDeliveries(
    memberships: Array<{ userId: string; programId: string }>,
    requirementId: string,
    dueAt: Date,
    offset: RequirementReminderOffset,
    scheduledAt: Date,
  ) {
    if (memberships.length === 0) {
      return;
    }

    const now = new Date();
    await this.prisma.requirementReminderDelivery.createMany({
      data: memberships.map(({ userId, programId }) => ({
        userId,
        programId,
        requirementId,
        dueAtSnapshot: dueAt,
        reminderDaysBefore: offset,
        scheduledAt,
        status: RequirementReminderStatus.PENDING,
        createdAt: now,
        updatedAt: now,
      })),
      skipDuplicates: true,
    });

    await this.prisma.requirementReminderDelivery.updateMany({
      where: {
        userId: { in: memberships.map(({ userId }) => userId) },
        programId: memberships[0].programId,
        requirementId,
        dueAtSnapshot: dueAt,
        reminderDaysBefore: offset,
        status: RequirementReminderStatus.CANCELLED,
      },
      data: {
        status: RequirementReminderStatus.PENDING,
        scheduledAt,
        attemptCount: 0,
        nextAttemptAt: null,
        leaseExpiresAt: null,
        sentAt: null,
        lastError: null,
        updatedAt: now,
      },
    });
  }

  private async recoverExpiredClaims() {
    const now = new Date();
    await this.prisma.requirementReminderDelivery.updateMany({
      where: {
        status: RequirementReminderStatus.PROCESSING,
        leaseExpiresAt: { lte: now },
      },
      data: {
        status: RequirementReminderStatus.PENDING,
        leaseExpiresAt: null,
        updatedAt: now,
      },
    });
  }

  private async claimDueDeliveries(): Promise<ClaimedDelivery[]> {
    return this.prisma.$transaction(
      (transaction) =>
        transaction.$queryRaw<ClaimedDelivery[]>`
        WITH due AS (
          SELECT "id"
          FROM "requirement_reminder_deliveries"
          WHERE "status" = 'PENDING'::"RequirementReminderStatus"
            AND "scheduledAt" <= NOW()
            AND ("nextAttemptAt" IS NULL OR "nextAttemptAt" <= NOW())
          ORDER BY "scheduledAt" ASC
          FOR UPDATE SKIP LOCKED
          LIMIT ${CLAIM_BATCH_SIZE}
        )
        UPDATE "requirement_reminder_deliveries" AS delivery
        SET "status" = 'PROCESSING'::"RequirementReminderStatus",
            "attemptCount" = delivery."attemptCount" + 1,
            "leaseExpiresAt" = NOW() + (${PROCESSING_LEASE_MS} * INTERVAL '1 millisecond'),
            "updatedAt" = NOW()
        FROM due
        WHERE delivery."id" = due."id"
        RETURNING delivery."id", delivery."userId", delivery."programId",
                  delivery."requirementId", delivery."dueAtSnapshot",
                  delivery."reminderDaysBefore"
      `,
    );
  }

  private async sendDelivery(delivery: ClaimedDelivery) {
    const row = await this.prisma.requirementReminderDelivery.findUnique({
      where: { id: delivery.id },
      include: {
        requirement: {
          include: { program: { select: { name: true } } },
        },
        userOnProgram: {
          include: {
            user: { select: { email: true, firstName: true } },
            requirementCompletions: {
              where: { requirementId: delivery.requirementId },
              select: { requirementId: true },
            },
          },
        },
      },
    });

    if (!row || row.status !== RequirementReminderStatus.PROCESSING) {
      return;
    }

    const requirement = row.requirement;
    const dueAt = requirement.dueAt;
    const isCurrentSchedule =
      dueAt !== null &&
      dueAt.getTime() === row.dueAtSnapshot.getTime() &&
      requirement.reminderDaysBefore === row.reminderDaysBefore;

    if (!isCurrentSchedule || !dueAt || dueAt.getTime() <= Date.now()) {
      await this.finishWithoutSending(row.id, RequirementReminderStatus.CANCELLED);
      return;
    }

    const completed =
      row.userOnProgram.requirementStatus.includes(requirement.id) ||
      row.userOnProgram.requirementCompletions.length > 0;
    if (completed) {
      await this.finishWithoutSending(row.id, RequirementReminderStatus.SKIPPED);
      return;
    }

    try {
      await this.mailService.sendRequirementDueReminder({
        email: row.userOnProgram.user.email,
        firstName: row.userOnProgram.user.firstName,
        requirementName: requirement.name,
        programName: requirement.program.name,
        dueAt,
        programId: row.programId,
      });

      await this.prisma.requirementReminderDelivery.updateMany({
        where: { id: row.id, status: RequirementReminderStatus.PROCESSING },
        data: {
          status: RequirementReminderStatus.SENT,
          sentAt: new Date(),
          leaseExpiresAt: null,
          nextAttemptAt: null,
          lastError: null,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const exhausted = row.attemptCount >= MAX_ATTEMPTS;
      const retryDelay = Math.min(60_000 * 2 ** Math.max(row.attemptCount - 1, 0), MAX_RETRY_DELAY_MS);
      const now = new Date();

      await this.prisma.requirementReminderDelivery.updateMany({
        where: { id: row.id, status: RequirementReminderStatus.PROCESSING },
        data: {
          status: exhausted ? RequirementReminderStatus.FAILED : RequirementReminderStatus.PENDING,
          nextAttemptAt: exhausted ? null : new Date(now.getTime() + retryDelay),
          leaseExpiresAt: null,
          lastError: message.slice(0, 4000),
          updatedAt: now,
        },
      });

      this.logger.error(`Could not send reminder delivery ${row.id}`, error);
    }
  }

  private async finishWithoutSending(id: string, status: RequirementReminderStatus) {
    await this.prisma.requirementReminderDelivery.updateMany({
      where: { id, status: RequirementReminderStatus.PROCESSING },
      data: { status, leaseExpiresAt: null, nextAttemptAt: null, updatedAt: new Date() },
    });
  }

  private isOffset(value: number | null): value is RequirementReminderOffset {
    return value === 1 || value === 7;
  }
}
