jest.mock('@thallesp/nestjs-better-auth', () => ({
  AuthService: class AuthService {},
}));
jest.mock('better-auth/node', () => ({
  fromNodeHeaders: jest.fn(),
}));

import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { UserFull } from '@mas/models';
import { DiscussionBoardService } from './discussion-board.service';
import { DiscussionController } from './discussion.controller';
import { DiscussionService } from './discussion.service';

describe('DiscussionController private images', () => {
  const user = { id: 'user-1' } as UserFull;
  let boardService: { getBoardById: jest.Mock };
  let controller: DiscussionController;

  beforeEach(() => {
    boardService = { getBoardById: jest.fn().mockResolvedValue({ id: 'board-1' }) };
    controller = new DiscussionController({} as DiscussionService, boardService as unknown as DiscussionBoardService);
  });

  it('stores a discussion image under its board and returns an authenticated URL', async () => {
    const result = await controller.uploadImage({ user } as Express.Request, 'board-1', {
      filename: 'generated.png',
      path: '/uploads/discussion-images/board-1/generated.png',
    } as Express.Multer.File);

    expect(boardService.getBoardById).toHaveBeenCalledWith('user-1', 'board-1');
    expect(result).toEqual({ url: '/api/discussion-posts/images/board-1/generated.png' });
  });

  it('does not authorize uploads for a board the user cannot access', async () => {
    boardService.getBoardById.mockRejectedValue(new ForbiddenException());

    await expect(
      controller.uploadImage({ user } as Express.Request, 'board-1', {
        filename: 'generated.png',
        path: '/uploads/discussion-images/board-1/generated.png',
      } as Express.Multer.File),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('requires a safe board identifier when serving an image', async () => {
    const response = { sendFile: jest.fn() } as unknown as Express.Response;

    await expect(
      controller.serveBoardImage({ user } as Express.Request, '../private', 'image.png', response),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(boardService.getBoardById).not.toHaveBeenCalled();
  });
});
