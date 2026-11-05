import { ConflictException } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@mas/prisma-client';

jest.mock('@mas/backend-checkpoints', () => ({ CheckpointsService: class {} }));
jest.mock('@mas/backend-prisma', () => ({ PrismaService: class {} }));
jest.mock('@mas/backend-requirements', () => ({ RequirementRemindersService: class {} }));
jest.mock('@mas/backend-shared', () => ({ formatCurrency: { format: String } }));
jest.mock('@nestjs/schedule', () => ({
  Cron: () => () => undefined,
  CronExpression: { EVERY_5_MINUTES: '*/5 * * * *', EVERY_MINUTE: '* * * * *' },
}));
import { UsersOnProgramsService } from './users-on-programs.service';

const connectionString = process.env['TASK_REVIEW_TEST_DATABASE_URL'];
if (connectionString && !new URL(connectionString).pathname.startsWith('/metro_task_review_verify_')) {
  throw new Error('Task review integration tests require an isolated metro_task_review_verify_ database.');
}
const integration = connectionString ? describe : describe.skip;

integration('Task verification persistence', () => {
  let prisma: PrismaClient;
  beforeAll(() => {
    prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: connectionString! }) });
  });
  afterAll(async () => {
    await prisma?.$disconnect();
  });
  it('keeps reports and verification separate, and requires fresh review after withdrawal and resubmission', async () => {
    const token = crypto.randomUUID();
    const partner = await prisma.partner.create({ data: { name: `Review test ${token}` } });
    const participant = await prisma.user.create({
      data: { email: `participant-${token}@example.com`, firstName: 'Test', lastName: 'Participant' },
    });
    const reviewer = await prisma.user.create({
      data: {
        email: `reviewer-${token}@example.com`,
        role: 'Partner_Staff',
        partnerId: partner.id,
        firstName: 'Test',
        lastName: 'Reviewer',
      },
    });
    const program = await prisma.program.create({ data: { name: 'Review test', partnerId: partner.id } });
    await prisma.usersOnPrograms.create({
      data: { userId: participant.id, programId: program.id, requirementStatus: [] },
    });
    const requirement = await prisma.requirement.create({ data: { programId: program.id, name: 'Submit a budget' } });
    const service = new UsersOnProgramsService(prisma as never, {} as never, {} as never);
    const claim = await service.completeRequirement(participant.id, program.id, requirement.id);
    const body = { verified: true, completedAt: claim.completedAt.toISOString() };
    const verified = await service.verifyRequirement(program.id, participant.id, requirement.id, reviewer.id, body);
    expect(verified.verifiedAt).not.toBeNull();
    expect(verified.verifiedBy?.id).toBe(reviewer.id);
    const unverified = await service.verifyRequirement(program.id, participant.id, requirement.id, reviewer.id, {
      ...body,
      verified: false,
    });
    expect(unverified.completedAt).toEqual(claim.completedAt);
    expect(unverified.verifiedAt).toBeNull();
    await service.verifyRequirement(program.id, participant.id, requirement.id, reviewer.id, body);
    await service.uncompleteRequirement(participant.id, program.id, requirement.id);
    await expect(
      service.verifyRequirement(program.id, participant.id, requirement.id, reviewer.id, body),
    ).rejects.toBeInstanceOf(ConflictException);
    const newClaim = await service.completeRequirement(participant.id, program.id, requirement.id);
    expect(newClaim.completedAt).not.toEqual(claim.completedAt);
    await expect(
      service.verifyRequirement(program.id, participant.id, requirement.id, reviewer.id, body),
    ).rejects.toBeInstanceOf(ConflictException);
    const review = await service.getTaskReview(program.id);
    expect(review.participants[0].completions[0].verifiedAt).toBeNull();
    expect(review.participants[0].completions[0].verifiedBy).toBeNull();
  });
});
