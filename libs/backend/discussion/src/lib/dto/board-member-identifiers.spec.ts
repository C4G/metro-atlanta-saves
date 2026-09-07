import { validate } from 'class-validator';
import { AddBoardMemberDto } from './add-board-member.dto';
import { CreateDiscussionBoardDto } from './create-discussion-board.dto';

describe('discussion board member identifiers', () => {
  const betterAuthUserId = '5QWGJjo9aRE0Cvjq3Sg0H06ka7XUryWz';

  it('accepts a Better Auth user ID when creating a board', async () => {
    const dto = Object.assign(new CreateDiscussionBoardDto(), {
      name: 'Test board',
      memberIds: [betterAuthUserId],
    });

    await expect(validate(dto)).resolves.toEqual([]);
  });

  it('accepts a Better Auth user ID when adding a board member', async () => {
    const dto = Object.assign(new AddBoardMemberDto(), { userId: betterAuthUserId });

    await expect(validate(dto)).resolves.toEqual([]);
  });

  it('rejects empty member identifiers', async () => {
    const dto = Object.assign(new CreateDiscussionBoardDto(), {
      name: 'Test board',
      memberIds: [''],
    });

    await expect(validate(dto)).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ property: 'memberIds' })]),
    );
  });
});
