import { BadRequestException } from '@nestjs/common';
jest.mock('@mas/backend-shared', () => ({ mapUser: jest.fn(), randomPassword: jest.fn() }));
import { UsersService } from './users.service';
import type { EmailCampaignAudience } from './dto/send-bulk-email.dto';

const createService = () => {
  const prisma = {
    user: { findMany: jest.fn() },
    discussionBoard: { findUnique: jest.fn() },
    discussionBoardMember: { findMany: jest.fn() },
    program: { findUnique: jest.fn() },
  };
  const mailService = { sendBulkCampaignEmail: jest.fn().mockResolvedValue(undefined) };
  const emailPreferences = { filterCampaignRecipients: jest.fn(async (emails: string[]) => emails) };
  const service = new UsersService(
    prisma as never,
    {} as never,
    {} as never,
    mailService as never,
    emailPreferences as never,
  );

  return { service, prisma, mailService, emailPreferences };
};

describe('UsersService campaign recipients', () => {
  it('resolves selected users, deduplicates IDs and emails, and applies campaign preferences', async () => {
    const { service, prisma, emailPreferences } = createService();
    prisma.user.findMany.mockResolvedValue([
      { id: 'user-1', email: 'member@example.com' },
      { id: 'user-2', email: ' member@example.com ' },
    ]);
    emailPreferences.filterCampaignRecipients.mockResolvedValue(['member@example.com']);

    await expect(
      service.resolveCampaignAudience({ type: 'users', userIds: ['user-1', 'user-1', 'user-2'] }),
    ).resolves.toEqual(['member@example.com']);

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: { id: { in: ['user-1', 'user-2'] } },
      select: { id: true, email: true },
    });
    expect(emailPreferences.filterCampaignRecipients).toHaveBeenCalledWith(['member@example.com']);
  });

  it('resolves only non-admin board participants and excludes allies associated with the board program', async () => {
    const { service, prisma } = createService();
    prisma.discussionBoard.findUnique.mockResolvedValue({ programId: 'program-1' });
    prisma.discussionBoardMember.findMany.mockResolvedValue([
      { user: { email: 'participant@example.com' } },
      { user: { email: 'participant@example.com' } },
    ]);

    await expect(service.resolveCampaignAudience({ type: 'board', boardId: 'board-1' })).resolves.toEqual([
      'participant@example.com',
    ]);
    expect(prisma.discussionBoardMember.findMany).toHaveBeenCalledWith({
      where: {
        boardId: 'board-1',
        isAdmin: false,
        user: { role: null, alliesOnPrograms: { none: { programId: 'program-1' } } },
      },
      select: { user: { select: { email: true } } },
    });
  });

  it('resolves only program participants and excludes allies associated with the program', async () => {
    const { service, prisma } = createService();
    prisma.program.findUnique.mockResolvedValue({
      UsersOnPrograms: [{ user: { email: 'participant@example.com' } }],
    });

    await expect(service.resolveCampaignAudience({ type: 'program', programId: 'program-1' })).resolves.toEqual([
      'participant@example.com',
    ]);
    expect(prisma.program.findUnique).toHaveBeenCalledWith({
      where: { id: 'program-1' },
      select: {
        UsersOnPrograms: {
          where: { user: { role: null, alliesOnPrograms: { none: { programId: 'program-1' } } } },
          select: { user: { select: { email: true } } },
        },
      },
    });
  });

  it.each([
    ['no audience', null],
    ['empty user list', { type: 'users', userIds: [] }],
    ['mixed user audience fields', { type: 'users', userIds: ['user-1'], boardId: 'board-1' }],
    ['unknown audience type', { type: 'all' }],
  ])('rejects %s', async (_description, audience) => {
    const { service, prisma } = createService();
    await expect(service.resolveCampaignAudience(audience as EmailCampaignAudience)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.user.findMany).not.toHaveBeenCalled();
    expect(prisma.discussionBoard.findUnique).not.toHaveBeenCalled();
    expect(prisma.program.findUnique).not.toHaveBeenCalled();
  });

  it('rejects unknown selected users and boards', async () => {
    const { service, prisma } = createService();
    prisma.user.findMany.mockResolvedValue([]);
    await expect(service.resolveCampaignAudience({ type: 'users', userIds: ['missing'] })).rejects.toBeInstanceOf(
      BadRequestException,
    );

    prisma.discussionBoard.findUnique.mockResolvedValue(null);
    await expect(service.resolveCampaignAudience({ type: 'board', boardId: 'missing' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('does not send a campaign when the selected audience has no eligible recipients', async () => {
    const { service, prisma, mailService } = createService();
    prisma.discussionBoard.findUnique.mockResolvedValue({ programId: null });
    prisma.discussionBoardMember.findMany.mockResolvedValue([]);

    await expect(
      service.sendBulkEmail('Subject', '<p>Body</p>', { type: 'board', boardId: 'board-1' }),
    ).rejects.toThrow('The selected audience has no eligible email recipients.');
    expect(mailService.sendBulkCampaignEmail).not.toHaveBeenCalled();
  });

  it('sends the resolved and preference-filtered recipients through the campaign mailer', async () => {
    const { service, prisma, mailService, emailPreferences } = createService();
    prisma.user.findMany.mockResolvedValue([{ id: 'user-1', email: 'member@example.com' }]);
    emailPreferences.filterCampaignRecipients.mockResolvedValue(['member@example.com']);

    await service.sendBulkEmail('Subject', '<p>Body</p>', { type: 'users', userIds: ['user-1'] });

    expect(mailService.sendBulkCampaignEmail).toHaveBeenCalledWith(['member@example.com'], 'Subject', '<p>Body</p>');
  });
});
