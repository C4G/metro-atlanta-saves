import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@mas/backend-prisma';
import { CreateDiscussionBoardDto } from './dto/create-discussion-board.dto';
import { UpdateDiscussionBoardDto } from './dto/update-discussion-board.dto';
import { v4 } from 'uuid';

type BoardInfo = {
  id: string;
  name: string;
  description: string | null;
  programId: string | null;
  cohortId: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    bio: string | null;
  };
  memberCount: number;
  postCount: number;
};

@Injectable()
export class DiscussionBoardService {
  constructor(private readonly prisma: PrismaService) {}

  async createBoard(userId: string, dto: CreateDiscussionBoardDto): Promise<BoardInfo> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || (user.role !== 'Administrator' && user.role !== 'Partner_Staff')) {
      throw new ForbiddenException('Only administrators can create discussion boards');
    }

    const boardId = v4();

    const board = await this.prisma.discussionBoard.create({
      data: {
        id: boardId,
        name: dto.name,
        description: dto.description,
        programId: dto.programId,
        cohortId: dto.cohortId,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            bio: true,
          },
        },
        members: true,
        posts: true,
      },
    });

    // Automatically add the creator as a board member
    const memberIds = [userId];

    // Add any additional members from the DTO
    if (dto.memberIds && dto.memberIds.length > 0) {
      memberIds.push(...dto.memberIds);
    }

    // Remove duplicates and create members
    const uniqueMemberIds = Array.from(new Set(memberIds));
    await this.prisma.discussionBoardMember.createMany({
      data: uniqueMemberIds.map((memberId) => ({
        id: v4(),
        boardId,
        userId: memberId,
      })),
      skipDuplicates: true,
    });

    return {
      id: board.id,
      name: board.name,
      description: board.description,
      programId: board.programId,
      cohortId: board.cohortId,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
      createdBy: board.createdBy,
      memberCount: board.members.length,
      postCount: board.posts.length,
    };
  }

  async getUserBoards(userId: string): Promise<BoardInfo[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const boards = await this.prisma.discussionBoard.findMany({
      where: {
        OR: [
          { createdById: userId },
          {
            members: {
              some: {
                userId,
              },
            },
          },
        ],
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            bio: true,
          },
        },
        members: true,
        posts: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return boards.map((board) => ({
      id: board.id,
      name: board.name,
      description: board.description,
      programId: board.programId,
      cohortId: board.cohortId,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
      createdBy: board.createdBy,
      memberCount: board.members.length,
      postCount: board.posts.length,
    }));
  }

  async getAllBoards(userId: string): Promise<BoardInfo[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || (user.role !== 'Administrator' && user.role !== 'Partner_Staff')) {
      throw new ForbiddenException('Only administrators can view all boards');
    }

    const boards = await this.prisma.discussionBoard.findMany({
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            bio: true,
          },
        },
        members: true,
        posts: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return boards.map((board) => ({
      id: board.id,
      name: board.name,
      description: board.description,
      programId: board.programId,
      cohortId: board.cohortId,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
      createdBy: board.createdBy,
      memberCount: board.members.length,
      postCount: board.posts.length,
    }));
  }

  async getBoardById(userId: string, boardId: string): Promise<BoardInfo> {
    const board = await this.prisma.discussionBoard.findUnique({
      where: { id: boardId },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            bio: true,
          },
        },
        members: true,
        posts: true,
      },
    });

    if (!board) {
      throw new NotFoundException('Discussion board not found');
    }

    const isCreator = board.createdById === userId;
    const isMember = board.members.some((m: any) => m.userId === userId);
    const userRole = (await this.prisma.user.findUnique({ where: { id: userId } }))?.role;
    const isAdmin = userRole === 'Administrator' || userRole === 'Partner_Staff';

    if (!isCreator && !isMember && !isAdmin) {
      throw new ForbiddenException('You do not have access to this board');
    }

    return {
      id: board.id,
      name: board.name,
      description: board.description,
      programId: board.programId,
      cohortId: board.cohortId,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
      createdBy: board.createdBy,
      memberCount: board.members.length,
      postCount: board.posts.length,
    };
  }

  async updateBoard(userId: string, boardId: string, dto: UpdateDiscussionBoardDto): Promise<BoardInfo> {
    const board = await this.prisma.discussionBoard.findUnique({
      where: { id: boardId },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            bio: true,
          },
        },
        members: true,
        posts: true,
      },
    });

    if (!board) {
      throw new NotFoundException('Discussion board not found');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const isAdmin = user?.role === 'Administrator' || user?.role === 'Partner_Staff';
    const isCreator = board.createdById === userId;
    const boardMember = await this.prisma.discussionBoardMember.findUnique({
      where: { boardId_userId: { boardId, userId } },
    });
    const isBoardAdmin = boardMember?.isAdmin === true;

    if (!isAdmin && !isCreator && !isBoardAdmin) {
      throw new ForbiddenException('Only the board creator or admins can update this board');
    }

    const updated = await this.prisma.discussionBoard.update({
      where: { id: boardId },
      data: {
        name: dto.name,
        description: dto.description,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            bio: true,
          },
        },
        members: true,
        posts: true,
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      programId: updated.programId,
      cohortId: updated.cohortId,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      createdBy: updated.createdBy,
      memberCount: updated.members.length,
      postCount: updated.posts.length,
    };
  }

  async deleteBoard(userId: string, boardId: string): Promise<void> {
    const board = await this.prisma.discussionBoard.findUnique({
      where: { id: boardId },
    });

    if (!board) {
      throw new NotFoundException('Discussion board not found');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const isAdmin = user?.role === 'Administrator' || user?.role === 'Partner_Staff';
    const isCreator = board.createdById === userId;
    const boardMember = await this.prisma.discussionBoardMember.findUnique({
      where: { boardId_userId: { boardId, userId } },
    });
    const isBoardAdmin = boardMember?.isAdmin === true;

    if (!isAdmin && !isCreator && !isBoardAdmin) {
      throw new ForbiddenException('Only the board creator or admins can delete this board');
    }

    await this.prisma.discussionBoard.delete({
      where: { id: boardId },
    });
  }

  async addMember(userId: string, boardId: string, memberId: string): Promise<void> {
    const board = await this.prisma.discussionBoard.findUnique({
      where: { id: boardId },
    });

    if (!board) {
      throw new NotFoundException('Discussion board not found');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const isAdmin = user?.role === 'Administrator' || user?.role === 'Partner_Staff';
    const isCreator = board.createdById === userId;
    const boardMember = await this.prisma.discussionBoardMember.findUnique({
      where: { boardId_userId: { boardId, userId } },
    });
    const isBoardAdmin = boardMember?.isAdmin === true;

    if (!isAdmin && !isCreator && !isBoardAdmin) {
      throw new ForbiddenException('Only the board creator or admins can add members');
    }

    const memberExists = await this.prisma.user.findUnique({
      where: { id: memberId },
    });

    if (!memberExists) {
      throw new NotFoundException('User not found');
    }

    try {
      await this.prisma.discussionBoardMember.create({
        data: {
          id: v4(),
          boardId,
          userId: memberId,
        },
      });
    } catch {
      throw new BadRequestException('User is already a member of this board');
    }
  }

  async removeMember(userId: string, boardId: string, memberId: string): Promise<void> {
    const board = await this.prisma.discussionBoard.findUnique({
      where: { id: boardId },
    });

    if (!board) {
      throw new NotFoundException('Discussion board not found');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const isAdmin = user?.role === 'Administrator' || user?.role === 'Partner_Staff';
    const isCreator = board.createdById === userId;
    const boardMember = await this.prisma.discussionBoardMember.findUnique({
      where: { boardId_userId: { boardId, userId } },
    });
    const isBoardAdmin = boardMember?.isAdmin === true;

    if (!isAdmin && !isCreator && !isBoardAdmin) {
      throw new ForbiddenException('Only the board creator or admins can remove members');
    }

    await this.prisma.discussionBoardMember.deleteMany({
      where: {
        boardId,
        userId: memberId,
      },
    });
  }

  async getBoardMembers(userId: string, boardId: string): Promise<any[]> {
    const board = await this.prisma.discussionBoard.findUnique({
      where: { id: boardId },
    });

    if (!board) {
      throw new NotFoundException('Discussion board not found');
    }

    const currentUser = await this.prisma.user.findUnique({ where: { id: userId } });
    const isAdmin = currentUser?.role === 'Administrator' || currentUser?.role === 'Partner_Staff';
    const isCreator = board.createdById === userId;
    const isMember = await this.prisma.discussionBoardMember.findUnique({
      where: {
        boardId_userId: {
          boardId,
          userId,
        },
      },
    });

    if (!isAdmin && !isCreator && !isMember) {
      throw new ForbiddenException('You do not have access to this board');
    }

    const members = await this.prisma.discussionBoardMember.findMany({
      where: { boardId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            bio: true,
          },
        },
      },
    });

    return members.map((m) => ({
      ...m.user,
      joinedAt: m.createdAt,
      isAdmin: m.isAdmin,
    }));
  }

  async toggleMemberAdmin(
    requestingUserId: string,
    boardId: string,
    targetUserId: string,
    makeAdmin: boolean,
  ): Promise<void> {
    const board = await this.prisma.discussionBoard.findUnique({
      where: { id: boardId },
    });

    if (!board) {
      throw new NotFoundException('Discussion board not found');
    }

    const requestingUser = await this.prisma.user.findUnique({ where: { id: requestingUserId } });
    const isGlobalAdmin = requestingUser?.role === 'Administrator' || requestingUser?.role === 'Partner_Staff';
    const isCreator = board.createdById === requestingUserId;

    if (!isGlobalAdmin && !isCreator) {
      throw new ForbiddenException('Only the board creator or global admins can change member admin status');
    }

    const memberRecord = await this.prisma.discussionBoardMember.findUnique({
      where: { boardId_userId: { boardId, userId: targetUserId } },
    });

    if (!memberRecord) {
      throw new NotFoundException('User is not a member of this board');
    }

    await this.prisma.discussionBoardMember.update({
      where: { boardId_userId: { boardId, userId: targetUserId } },
      data: { isAdmin: makeAdmin },
    });
  }

  async searchUsersForBoard(requestingUserId: string, boardId: string, query: string): Promise<any[]> {
    const user = await this.prisma.user.findUnique({ where: { id: requestingUserId } });
    const isGlobalAdmin = user?.role === 'Administrator' || user?.role === 'Partner_Staff';

    if (!isGlobalAdmin) {
      const boardMember = await this.prisma.discussionBoardMember.findUnique({
        where: { boardId_userId: { boardId, userId: requestingUserId } },
      });
      if (!boardMember?.isAdmin) {
        throw new ForbiddenException('Only board admins can search users');
      }
    }

    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: { id: true, firstName: true, lastName: true, email: true },
      take: 20,
    });

    return users;
  }
}
