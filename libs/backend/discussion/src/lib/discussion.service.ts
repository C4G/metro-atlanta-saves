import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateDiscussionPostDto } from './dto/create-discussion-post.dto';
import { CreateDiscussionCommentDto } from './dto/create-discussion-comment.dto';
import { CreateDiscussionTagDto } from './dto/create-discussion-tag.dto';
import { UpdateDiscussionPostDto } from './dto/update-discussion-post.dto';
import { UpdateDiscussionCommentDto } from './dto/update-discussion-comment.dto';
import { PrismaService } from '@mas/backend-prisma';
import { MailService } from '@mas/backend-mail';
import { UserFull } from '@mas/models';
import { CommentVoteType, Prisma } from '@mas/prisma-client';
import { v4 } from 'uuid';
import * as webpush from 'web-push';

type DiscussionRow = {
  postId: string;
  postTitle: string;
  postBody: string;
  postIsAnnouncement: boolean;
  postIsPinned: boolean;
  postCreatedAt: Date;
  authorId: string;
  authorFirstName: string;
  authorLastName: string;
  authorRole: 'Administrator' | 'Partner_Staff' | null;
  authorEmail: string;
  authorProfilePicture: string | null;
  commentId: string | null;
  commentBody: string | null;
  commentParentCommentId: string | null;
  commentCreatedAt: Date | null;
  commentAuthorId: string | null;
  commentAuthorFirstName: string | null;
  commentAuthorLastName: string | null;
  commentAuthorRole: 'Administrator' | 'Partner_Staff' | null;
  commentAuthorEmail: string | null;
  commentAuthorProfilePicture: string | null;
  commentUpvotes: number | null;
  commentDownvotes: number | null;
  tags: Array<{ id: string; name: string; color: string }>;
};

type AuthorInfo = {
  id: string;
  firstName: string;
  lastName: string;
  role: 'Administrator' | 'Partner_Staff' | null;
  email: string;
  profilePicture: string | null;
};

export type DiscussionComment = {
  id: string;
  body: string;
  createdAt: Date;
  upvotes: number;
  downvotes: number;
  author: AuthorInfo;
  replies: DiscussionComment[];
};

export type DiscussionPost = {
  id: string;
  title: string;
  body: string;
  isAnnouncement: boolean;
  isPinned: boolean;
  createdAt: Date;
  author: AuthorInfo;
  tags: Array<{ id: string; name: string; color: string }>;
  comments: DiscussionComment[];
};

@Injectable()
export class DiscussionService {
  private readonly logger = new Logger(DiscussionService.name);

  constructor(
    private prismaService: PrismaService,
    private mailService: MailService,
    private configService: ConfigService,
  ) {
    const publicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');
    const subject = this.configService.get<string>('VAPID_SUBJECT') ?? 'mailto:admin@brpatl.com';
    if (publicKey && privateKey) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
    } else {
      this.logger.warn('VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY not set — push notifications disabled');
    }
  }

  async createPost(user: UserFull, dto: CreateDiscussionPostDto): Promise<DiscussionPost> {
    if (!user?.id) {
      throw new UnauthorizedException(['You must be logged in to create a post']);
    }

    if (dto.isAnnouncement && user.role !== 'Administrator' && user.role !== 'Partner_Staff') {
      throw new ForbiddenException('Only administrators can create announcements');
    }

    try {
      const id = v4();
      const isAnnouncement = dto.isAnnouncement ?? false;
      const inserted = await this.prismaService.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        INSERT INTO "discussionPosts" ("id", "createdAt", "updatedAt", "title", "body", "authorId", "isAnnouncement")
        VALUES (${id}, NOW(), NOW(), ${dto.title.trim()}, ${dto.body.trim()}, ${user.id}, ${isAnnouncement})
        RETURNING "id"
      `);

      if (dto.tagIds && dto.tagIds.length > 0) {
        for (const tagId of dto.tagIds) {
          await this.prismaService.$queryRaw(Prisma.sql`
            INSERT INTO "discussionPostTags" ("postId", "tagId")
            VALUES (${id}, ${tagId})
            ON CONFLICT DO NOTHING
          `);
        }
      }

      const createdPost = await this.findOne(inserted[0].id);

      return createdPost;
    } catch (error: unknown) {
      const message = `${(error as { message?: string })?.message ?? ''}`;
      if (message.includes('relation "discussionPosts" does not exist')) {
        throw new BadRequestException(['Discussion tables are missing. Run backend prisma migrate first.']);
      }
      throw new BadRequestException([(error as { message?: string })?.message || 'Failed to create discussion post']);
    }
  }

  async findAll(boardId?: string): Promise<DiscussionPost[]> {
    try {
      const rows = await this.baseQuery(undefined, boardId);
      return await this.mapRows(rows);
    } catch (error: unknown) {
      const message = `${(error as { message?: string })?.message ?? ''}`;
      if (message.includes('relation "discussionPosts" does not exist')) {
        throw new BadRequestException(['Discussion tables are missing. Run backend prisma migrate first.']);
      }
      throw error;
    }
  }

  async findOne(id: string): Promise<DiscussionPost> {
    const rows = await this.baseQuery(id, undefined);
    const posts = await this.mapRows(rows);
    const post = posts?.[0];

    if (!post) {
      throw new NotFoundException(['Discussion post not found']);
    }

    return post;
  }

  async createComment(user: UserFull, postId: string, dto: CreateDiscussionCommentDto) {
    const postFound = await this.prismaService.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT "id" FROM "discussionPosts" WHERE "id" = ${postId} LIMIT 1
    `);

    if (!postFound.length) {
      throw new NotFoundException(['Discussion post not found']);
    }

    if (dto.parentCommentId) {
      const parentCommentFound = await this.prismaService.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT "id" FROM "discussionComments" WHERE "id" = ${dto.parentCommentId} AND "postId" = ${postId} LIMIT 1
      `);

      if (!parentCommentFound.length) {
        throw new NotFoundException(['Parent comment not found in this post']);
      }
    }

    try {
      const commentId = v4();
      const comments = await this.prismaService.$queryRaw<
        Array<{
          id: string;
          body: string;
          createdAt: Date;
          authorId: string;
          authorFirstName: string;
          authorLastName: string;
          authorRole: 'Administrator' | 'Partner_Staff' | null;
          authorEmail: string;
        }>
      >(Prisma.sql`
        WITH inserted AS (
          INSERT INTO "discussionComments" ("id", "createdAt", "updatedAt", "body", "postId", "authorId", "parentCommentId")
          VALUES (${commentId}, NOW(), NOW(), ${dto.body.trim()}, ${postId}, ${user.id}, ${dto.parentCommentId || null})
          RETURNING "id", "body", "createdAt", "authorId"
        )
        SELECT
          i."id",
          i."body",
          i."createdAt",
          u."id" AS "authorId",
          u."firstName" AS "authorFirstName",
          u."lastName" AS "authorLastName",
          u."role" AS "authorRole",
          u."email" AS "authorEmail"
        FROM inserted i
        JOIN "users" u ON u."id" = i."authorId"
      `);

      return {
        id: comments[0].id,
        body: comments[0].body,
        createdAt: comments[0].createdAt,
        author: {
          id: comments[0].authorId,
          firstName: comments[0].authorFirstName,
          lastName: comments[0].authorLastName,
          role: comments[0].authorRole,
          email: comments[0].authorEmail,
        },
      };
    } catch (error: unknown) {
      const message = `${(error as { message?: string })?.message ?? ''}`;
      if (message.includes('relation "discussionComments" does not exist')) {
        throw new BadRequestException(['Discussion tables are missing. Run backend prisma migrate first.']);
      }
      throw new BadRequestException([(error as { message?: string })?.message || 'Failed to add comment']);
    }
  }

  async updatePost(id: string, user: UserFull, dto: UpdateDiscussionPostDto): Promise<DiscussionPost> {
    const post = await this.prismaService.$queryRaw<
      Array<{ id: string; authorId: string; boardId: string }>
    >(Prisma.sql`
      SELECT "id", "authorId", "boardId" FROM "discussionPosts" WHERE "id" = ${id}
    `);
    if (!post.length) throw new NotFoundException(['Discussion post not found']);

    const isAuthor = post[0].authorId === user.id;
    const isGlobalAdmin = user.role === 'Administrator' || user.role === 'Partner_Staff';

    let isBoardAdmin = false;
    if (!isAuthor && !isGlobalAdmin) {
      const membership = await this.prismaService.discussionBoardMember.findUnique({
        where: { boardId_userId: { boardId: post[0].boardId, userId: user.id } },
      });
      isBoardAdmin = membership?.isAdmin === true;
    }

    if (!isAuthor && !isGlobalAdmin && !isBoardAdmin)
      throw new ForbiddenException('You are not allowed to edit this post');

    await this.prismaService.$queryRaw(Prisma.sql`
      UPDATE "discussionPosts"
      SET "title" = ${dto.title.trim()}, "body" = ${dto.body.trim()}, "updatedAt" = NOW()
      WHERE "id" = ${id}
    `);

    if (dto.tagIds !== undefined) {
      await this.prismaService.$queryRaw(Prisma.sql`
        DELETE FROM "discussionPostTags" WHERE "postId" = ${id}
      `);
      for (const tagId of dto.tagIds) {
        await this.prismaService.$queryRaw(Prisma.sql`
          INSERT INTO "discussionPostTags" ("postId", "tagId")
          VALUES (${id}, ${tagId})
          ON CONFLICT DO NOTHING
        `);
      }
    }

    return this.findOne(id);
  }

  async updateComment(postId: string, commentId: string, user: UserFull, dto: UpdateDiscussionCommentDto) {
    const comment = await this.prismaService.$queryRaw<Array<{ id: string; authorId: string }>>(Prisma.sql`
      SELECT "id", "authorId" FROM "discussionComments"
      WHERE "id" = ${commentId} AND "postId" = ${postId}
    `);
    if (!comment.length) throw new NotFoundException(['Comment not found']);

    const isAuthor = comment[0].authorId === user.id;
    const isAdmin = user.role === 'Administrator';
    if (!isAuthor && !isAdmin) throw new ForbiddenException('You are not allowed to edit this comment');

    const updated = await this.prismaService.$queryRaw<Array<{ id: string; body: string }>>(Prisma.sql`
      UPDATE "discussionComments"
      SET "body" = ${dto.body.trim()}, "updatedAt" = NOW()
      WHERE "id" = ${commentId}
      RETURNING "id", "body"
    `);

    return { id: updated[0].id, body: updated[0].body };
  }

  async removePost(id: string, user: UserFull) {
    try {
      const post = await this.prismaService.$queryRaw<
        Array<{ id: string; authorId: string; boardId: string }>
      >(Prisma.sql`
        SELECT "id", "authorId", "boardId" FROM "discussionPosts"
        WHERE "id" = ${id}
      `);

      if (!post.length) {
        throw new NotFoundException(['Discussion post not found']);
      }

      const isAuthor = post[0].authorId === user.id;
      const isGlobalAdmin = user.role === 'Administrator' || user.role === 'Partner_Staff';

      let isBoardAdmin = false;
      if (!isAuthor && !isGlobalAdmin) {
        const membership = await this.prismaService.discussionBoardMember.findUnique({
          where: { boardId_userId: { boardId: post[0].boardId, userId: user.id } },
        });
        isBoardAdmin = membership?.isAdmin === true;
      }

      if (!isAuthor && !isGlobalAdmin && !isBoardAdmin) {
        throw new ForbiddenException('You are not allowed to delete this post');
      }

      const deleted = await this.prismaService.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        DELETE FROM "discussionPosts"
        WHERE "id" = ${id}
        RETURNING "id"
      `);

      return { id: deleted[0].id };
    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException([(error as { message?: string })?.message || 'Failed to delete post']);
    }
  }

  async removeComment(postId: string, commentId: string, user: UserFull) {
    try {
      const comment = await this.prismaService.$queryRaw<Array<{ id: string; authorId: string }>>(Prisma.sql`
        SELECT "id", "authorId" FROM "discussionComments"
        WHERE "id" = ${commentId} AND "postId" = ${postId}
      `);

      if (!comment.length) {
        throw new NotFoundException(['Discussion comment not found']);
      }

      const isAuthor = comment[0].authorId === user.id;
      const isGlobalAdmin = user.role === 'Administrator' || user.role === 'Partner_Staff';

      let isBoardAdmin = false;
      if (!isAuthor && !isGlobalAdmin) {
        const post = await this.prismaService.$queryRaw<Array<{ boardId: string }>>(Prisma.sql`
          SELECT "boardId" FROM "discussionPosts" WHERE "id" = ${postId} LIMIT 1
        `);
        if (post.length) {
          const membership = await this.prismaService.discussionBoardMember.findUnique({
            where: { boardId_userId: { boardId: post[0].boardId, userId: user.id } },
          });
          isBoardAdmin = membership?.isAdmin === true;
        }
      }

      if (!isAuthor && !isGlobalAdmin && !isBoardAdmin) {
        throw new ForbiddenException('You are not allowed to delete this comment');
      }

      const deleted = await this.prismaService.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        DELETE FROM "discussionComments"
        WHERE "id" = ${commentId}
        RETURNING "id"
      `);

      return { id: deleted[0].id };
    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException([(error as { message?: string })?.message || 'Failed to delete comment']);
    }
  }

  async togglePin(id: string, user: UserFull) {
    try {
      const post = await this.prismaService.$queryRaw<Array<{ isPinned: boolean; boardId: string }>>(Prisma.sql`
        SELECT "isPinned", "boardId" FROM "discussionPosts"
        WHERE "id" = ${id}
      `);

      if (!post.length) {
        throw new NotFoundException(['Discussion post not found']);
      }

      const isGlobalAdmin = user.role === 'Administrator' || user.role === 'Partner_Staff';

      if (!isGlobalAdmin) {
        const membership = await this.prismaService.discussionBoardMember.findUnique({
          where: { boardId_userId: { boardId: post[0].boardId, userId: user.id } },
        });
        if (!membership?.isAdmin) {
          throw new ForbiddenException('Only board admins or staff can pin posts');
        }
      }

      const newPinStatus = !post[0].isPinned;

      const updated = await this.prismaService.$queryRaw<Array<{ id: string; isPinned: boolean }>>(Prisma.sql`
        UPDATE "discussionPosts"
        SET "isPinned" = ${newPinStatus}
        WHERE "id" = ${id}
        RETURNING "id", "isPinned"
      `);

      return { id: updated[0].id, isPinned: updated[0].isPinned };
    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException([(error as { message?: string })?.message || 'Failed to toggle pin status']);
    }
  }

  async getAllTags() {
    try {
      return await this.prismaService.$queryRaw<Array<{ id: string; name: string; color: string }>>(Prisma.sql`
        SELECT "id", "name", "color" FROM "discussionTags"
        ORDER BY "name" ASC
      `);
    } catch (error: unknown) {
      const message = `${(error as { message?: string })?.message ?? ''}`;
      if (message.includes('relation "discussionTags" does not exist')) {
        throw new BadRequestException(['Discussion tables are missing. Run backend prisma migrate first.']);
      }
      throw new BadRequestException([(error as { message?: string })?.message || 'Failed to fetch tags']);
    }
  }

  async createTag(dto: CreateDiscussionTagDto) {
    try {
      const tagId = v4();
      const color = dto.color || 'blue';
      const inserted = await this.prismaService.$queryRaw<
        Array<{ id: string; name: string; color: string }>
      >(Prisma.sql`
        INSERT INTO "discussionTags" ("id", "name", "color")
        VALUES (${tagId}, ${dto.name.trim().toLowerCase()}, ${color})
        RETURNING "id", "name", "color"
      `);

      return inserted[0];
    } catch (error: unknown) {
      const message = `${(error as { message?: string })?.message ?? ''}`;
      if (message.includes('duplicate key value violates unique constraint')) {
        throw new BadRequestException(['Tag already exists']);
      }
      if (message.includes('relation "discussionTags" does not exist')) {
        throw new BadRequestException(['Discussion tables are missing. Run backend prisma migrate first.']);
      }
      throw new BadRequestException([(error as { message?: string })?.message || 'Failed to create tag']);
    }
  }

  async deleteTag(tagId: string) {
    try {
      const result = await this.prismaService.$queryRaw(Prisma.sql`
        DELETE FROM "discussionTags" WHERE "id" = ${tagId}
      `);
      if (!result || (result as unknown as { count?: number })?.count === 0) {
        throw new NotFoundException(['Tag not found']);
      }
      return { success: true, message: 'Tag deleted successfully' };
    } catch (error: unknown) {
      const message = `${(error as { message?: string })?.message ?? ''}`;
      if (message.includes('foreign key constraint')) {
        throw new BadRequestException(['Cannot delete tag that is in use by posts']);
      }
      if (message.includes('relation "discussionTags" does not exist')) {
        throw new BadRequestException(['Discussion tables are missing. Run backend prisma migrate first.']);
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException([(error as { message?: string })?.message || 'Failed to delete tag']);
    }
  }

  private async baseQuery(postId?: string, boardId?: string) {
    let condition = Prisma.sql``;

    if (postId || boardId) {
      const conditions: any[] = [];
      if (postId) {
        conditions.push(Prisma.sql`p."id" = ${postId}`);
      }
      if (boardId) {
        conditions.push(Prisma.sql`p."boardId" = ${boardId}`);
      }

      if (conditions.length === 1) {
        condition = Prisma.sql`WHERE ${conditions[0]}`;
      } else if (conditions.length > 1) {
        condition = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;
      }
    }

    const rows = await this.prismaService.$queryRaw<DiscussionRow[]>(Prisma.sql`
      SELECT DISTINCT
        p."id" AS "postId",
        p."title" AS "postTitle",
        p."body" AS "postBody",
        p."isAnnouncement" AS "postIsAnnouncement",
        p."isPinned" AS "postIsPinned",
        p."createdAt" AS "postCreatedAt",
        au."id" AS "authorId",
        au."firstName" AS "authorFirstName",
        au."lastName" AS "authorLastName",
        au."role" AS "authorRole",
        au."email" AS "authorEmail",
        (SELECT "path" FROM "images" WHERE "userId" = au."id" ORDER BY "createdAt" ASC LIMIT 1) AS "authorProfilePicture",
        c."id" AS "commentId",
        c."body" AS "commentBody",
        c."parentCommentId" AS "commentParentCommentId",
        c."createdAt" AS "commentCreatedAt",
        cu."id" AS "commentAuthorId",
        cu."firstName" AS "commentAuthorFirstName",
        cu."lastName" AS "commentAuthorLastName",
        cu."role" AS "commentAuthorRole",
        cu."email" AS "commentAuthorEmail",
        (SELECT "path" FROM "images" WHERE "userId" = cu."id" ORDER BY "createdAt" ASC LIMIT 1) AS "commentAuthorProfilePicture",
        c."upvotes" AS "commentUpvotes",
        c."downvotes" AS "commentDownvotes"
      FROM "discussionPosts" p
      JOIN "users" au ON au."id" = p."authorId"
      LEFT JOIN "discussionComments" c ON c."postId" = p."id" AND c."parentCommentId" IS NULL
      LEFT JOIN "users" cu ON cu."id" = c."authorId"
      LEFT JOIN "discussionPostTags" pt ON pt."postId" = p."id"
      LEFT JOIN "discussionTags" t ON t."id" = pt."tagId"
      ${condition}
      ORDER BY p."isPinned" DESC, p."createdAt" DESC, c."createdAt" ASC
    `);

    const postsWithTags = new Map<
      string,
      DiscussionRow & { tags: Array<{ id: string; name: string; color: string }> }
    >();
    for (const row of rows) {
      if (!postsWithTags.has(row.postId)) {
        postsWithTags.set(row.postId, { ...row, tags: [] });
      }
    }

    for (const postId of postsWithTags.keys()) {
      const tags = await this.prismaService.$queryRaw<Array<{ id: string; name: string; color: string }>>(Prisma.sql`
        SELECT t."id", t."name", t."color"
        FROM "discussionTags" t
        JOIN "discussionPostTags" pt ON pt."tagId" = t."id"
        WHERE pt."postId" = ${postId}
        ORDER BY t."name" ASC
      `);
      const post = postsWithTags.get(postId);
      if (post) {
        post.tags = tags;
      }
    }

    const rowsWithTags = rows.map((row) => ({
      ...row,
      tags: postsWithTags.get(row.postId)?.tags ?? [],
    }));

    return rowsWithTags;
  }

  private async mapRows(rows: DiscussionRow[]): Promise<DiscussionPost[]> {
    const postsMap = new Map<string, DiscussionPost>();
    const commentsMap = new Map<string, DiscussionComment>();

    for (const row of rows) {
      if (!postsMap.has(row.postId)) {
        postsMap.set(row.postId, {
          id: row.postId,
          title: row.postTitle,
          body: row.postBody,
          isAnnouncement: row.postIsAnnouncement,
          isPinned: row.postIsPinned,
          createdAt: row.postCreatedAt,
          author: {
            id: row.authorId,
            firstName: row.authorFirstName,
            lastName: row.authorLastName,
            role: row.authorRole,
            email: row.authorEmail,
            profilePicture: row.authorProfilePicture,
          },
          tags: row.tags || [],
          comments: [],
        });
      }

      if (row.commentId && row.commentBody && row.commentCreatedAt && row.commentAuthorId) {
        const comment: DiscussionComment = {
          id: row.commentId,
          body: row.commentBody,
          createdAt: row.commentCreatedAt,
          upvotes: Number(row.commentUpvotes ?? 0),
          downvotes: Number(row.commentDownvotes ?? 0),
          author: {
            id: row.commentAuthorId,
            firstName: row.commentAuthorFirstName ?? '',
            lastName: row.commentAuthorLastName ?? '',
            role: row.commentAuthorRole,
            email: row.commentAuthorEmail ?? '',
            profilePicture: row.commentAuthorProfilePicture,
          },
          replies: [],
        };
        commentsMap.set(row.commentId, comment);
        if (!row.commentParentCommentId) {
          const post = postsMap.get(row.postId);
          if (post) {
            post.comments.push(comment);
          }
        }
      }
    }

    const postIds = Array.from(postsMap.keys());
    if (postIds.length > 0) {
      type ReplyRow = {
        id: string;
        body: string;
        createdAt: Date;
        parentCommentId: string;
        upvotes: number;
        downvotes: number;
        authorId: string;
        authorFirstName: string;
        authorLastName: string;
        authorRole: 'Administrator' | 'Partner_Staff' | null;
        authorEmail: string;
        authorProfilePicture: string | null;
      };

      const allReplies = await this.prismaService.$queryRaw<ReplyRow[]>(Prisma.sql`
        SELECT
          c."id",
          c."body",
          c."createdAt",
          c."parentCommentId",
          c."upvotes",
          c."downvotes",
          u."id" AS "authorId",
          u."firstName" AS "authorFirstName",
          u."lastName" AS "authorLastName",
          u."role" AS "authorRole",
          u."email" AS "authorEmail",
          (SELECT "path" FROM "images" WHERE "userId" = u."id" ORDER BY "createdAt" ASC LIMIT 1) AS "authorProfilePicture"
        FROM "discussionComments" c
        JOIN "users" u ON u."id" = c."authorId"
        WHERE c."parentCommentId" IS NOT NULL
        AND c."postId" IN (${Prisma.join(postIds)})
        ORDER BY c."createdAt" ASC
      `);

      for (const reply of allReplies) {
        const replyComment: DiscussionComment = {
          id: reply.id,
          body: reply.body,
          createdAt: reply.createdAt,
          upvotes: Number(reply.upvotes ?? 0),
          downvotes: Number(reply.downvotes ?? 0),
          author: {
            id: reply.authorId,
            firstName: reply.authorFirstName,
            lastName: reply.authorLastName,
            role: reply.authorRole,
            email: reply.authorEmail,
            profilePicture: reply.authorProfilePicture,
          },
          replies: [],
        };
        commentsMap.set(reply.id, replyComment);

        const parentComment = commentsMap.get(reply.parentCommentId);
        if (parentComment) {
          parentComment.replies.push(replyComment);
        }
      }
    }

    return Array.from(postsMap.values());
  }

  async createPostForBoard(user: UserFull, boardId: string, dto: CreateDiscussionPostDto): Promise<DiscussionPost> {
    if (!user?.id) {
      throw new UnauthorizedException(['You must be logged in to create a post']);
    }

    const board = await this.prismaService.discussionBoard.findUnique({
      where: { id: boardId },
    });

    if (!board) {
      throw new NotFoundException('Discussion board not found');
    }

    const isMember = await this.prismaService.discussionBoardMember.findUnique({
      where: {
        boardId_userId: {
          boardId,
          userId: user.id,
        },
      },
    });

    if (!isMember && board.createdById !== user.id && user.role !== 'Administrator') {
      throw new ForbiddenException('You do not have access to this board');
    }

    if (
      dto.isAnnouncement &&
      user.role !== 'Administrator' &&
      user.role !== 'Partner_Staff' &&
      !isMember?.isAdmin &&
      board.createdById !== user.id
    ) {
      throw new ForbiddenException('Only administrators or board admins can create announcements');
    }

    try {
      const id = dto.postId ?? v4();
      const isAnnouncement = dto.isAnnouncement ?? false;
      const inserted = await this.prismaService.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        INSERT INTO "discussionPosts" ("id", "createdAt", "updatedAt", "title", "body", "authorId", "isAnnouncement", "boardId")
        VALUES (${id}, NOW(), NOW(), ${dto.title.trim()}, ${dto.body.trim()}, ${user.id}, ${isAnnouncement}, ${boardId})
        RETURNING "id"
      `);

      if (dto.tagIds && dto.tagIds.length > 0) {
        for (const tagId of dto.tagIds) {
          await this.prismaService.$queryRaw(Prisma.sql`
            INSERT INTO "discussionPostTags" ("postId", "tagId")
            VALUES (${id}, ${tagId})
            ON CONFLICT DO NOTHING
          `);
        }
      }

      const createdPost = await this.findOne(inserted[0].id);

      if (isAnnouncement && dto.sendEmailNotification) {
        try {
          const boardMembers = await this.prismaService.$queryRaw<Array<{ email: string }>>(Prisma.sql`
            SELECT DISTINCT u.email
            FROM "discussionBoardMembers" dbm
            JOIN "users" u ON u.id = dbm."userId"
            WHERE dbm."boardId" = ${boardId}
              AND u.email IS NOT NULL
          `);
          const emails = boardMembers.map((m) => m.email).filter(Boolean);
          if (emails.length > 0) {
            const boardUrl = dto.boardUrl ?? `https://brpatl.com/discussion/${boardId}`;
            const postUrl = `${boardUrl}?tab=announcements&post=${id}`;
            const emailContent =
              `${(dto.emailBody ?? dto.body).trim()}` +
              `<br><br><a href="${postUrl}" style="color:#1d4ed8;">View this post &rarr;</a>`;
            await this.mailService.sendBulkEmail(emails, dto.title.trim(), emailContent);
          }
        } catch (err) {
          this.logger.error('Email notification send failed', err);
          void 0;
        }
        try {
          await this.sendPushNotificationsToBoard(boardId, dto.title.trim(), dto.body.trim());
        } catch (err) {
          this.logger.error('Push notification send failed', err);
          void 0;
        }
      }

      return createdPost;
    } catch (error: unknown) {
      throw new BadRequestException([(error as { message?: string })?.message || 'Failed to create post in board']);
    }
  }

  async getPostsForBoard(boardId: string): Promise<DiscussionPost[]> {
    const board = await this.prismaService.discussionBoard.findUnique({
      where: { id: boardId },
    });

    if (!board) {
      throw new NotFoundException('Discussion board not found');
    }

    const rows = await this.prismaService.$queryRaw<DiscussionRow[]>(Prisma.sql`
      SELECT DISTINCT
        "p"."id" as "postId",
        "p"."title" as "postTitle",
        "p"."body" as "postBody",
        "p"."isAnnouncement" as "postIsAnnouncement",
        "p"."isPinned" as "postIsPinned",
        "p"."createdAt" as "postCreatedAt",
        "u"."id" as "authorId",
        "u"."firstName" as "authorFirstName",
        "u"."lastName" as "authorLastName",
        "u"."role" as "authorRole",
        "u"."email" as "authorEmail",
        (SELECT "path" FROM "images" WHERE "userId" = "u"."id" ORDER BY "createdAt" ASC LIMIT 1) as "authorProfilePicture",
        "c"."id" as "commentId",
        "c"."body" as "commentBody",
        "c"."parentCommentId" as "commentParentCommentId",
        "c"."createdAt" as "commentCreatedAt",
        "cu"."id" as "commentAuthorId",
        "cu"."firstName" as "commentAuthorFirstName",
        "cu"."lastName" as "commentAuthorLastName",
        "cu"."role" as "commentAuthorRole",
        "cu"."email" as "commentAuthorEmail",
        (SELECT "path" FROM "images" WHERE "userId" = "cu"."id" ORDER BY "createdAt" ASC LIMIT 1) as "commentAuthorProfilePicture",
        "c"."upvotes" AS "commentUpvotes",
        "c"."downvotes" AS "commentDownvotes",
        (SELECT COALESCE(JSON_AGG(JSON_BUILD_OBJECT('id', "id", 'name', "name", 'color', "color")), '[]'::json)
         FROM "discussionTags" dt INNER JOIN "discussionPostTags" dpt ON dt."id" = dpt."tagId"
         WHERE dpt."postId" = "p"."id") as "tags"
      FROM "discussionPosts" "p"
      LEFT JOIN "users" "u" ON "p"."authorId" = "u"."id"
      LEFT JOIN "discussionComments" "c" ON "p"."id" = "c"."postId" AND "c"."parentCommentId" IS NULL
      LEFT JOIN "users" "cu" ON "c"."authorId" = "cu"."id"
      WHERE "p"."boardId" = ${boardId}
      ORDER BY "p"."isPinned" DESC, "p"."createdAt" DESC
    `);

    return await this.mapRows(rows);
  }

  async createTagForBoard(
    boardId: string,
    dto: CreateDiscussionTagDto,
  ): Promise<{ id: string; name: string; color: string }> {
    const board = await this.prismaService.discussionBoard.findUnique({
      where: { id: boardId },
    });

    if (!board) {
      throw new NotFoundException('Discussion board not found');
    }

    try {
      const id = v4();
      const inserted = await this.prismaService.$queryRaw<
        Array<{ id: string; name: string; color: string }>
      >(Prisma.sql`
        INSERT INTO "discussionTags" ("id", "name", "color", "boardId")
        VALUES (${id}, ${dto.name.trim()}, ${dto.color || 'blue'}, ${boardId})
        RETURNING "id", "name", "color"
      `);

      return inserted[0];
    } catch (error: unknown) {
      const message = `${(error as { message?: string })?.message ?? ''}`;
      if (message.includes('duplicate key')) {
        throw new BadRequestException(['Tag already exists for this board']);
      }
      throw new BadRequestException([(error as { message?: string })?.message || 'Failed to create tag']);
    }
  }

  async getTagsForBoard(boardId: string): Promise<Array<{ id: string; name: string; color: string }>> {
    const board = await this.prismaService.discussionBoard.findUnique({
      where: { id: boardId },
    });

    if (!board) {
      throw new NotFoundException('Discussion board not found');
    }

    return await this.prismaService.discussionTag.findMany({
      where: { boardId },
      select: {
        id: true,
        name: true,
        color: true,
      },
    });
  }

  async deleteTagForBoard(boardId: string, tagId: string): Promise<void> {
    const tag = await this.prismaService.discussionTag.findUnique({
      where: { id: tagId },
    });

    if (!tag || tag.boardId !== boardId) {
      throw new NotFoundException('Tag not found in this board');
    }

    await this.prismaService.discussionTag.delete({
      where: { id: tagId },
    });
  }

  async getUserVotesForBoard(userId: string, boardId: string): Promise<Record<string, 'UP' | 'DOWN'>> {
    const votes = await this.prismaService.$queryRaw<Array<{ commentId: string; type: string }>>(Prisma.sql`
      SELECT dcv."commentId", dcv."type"::text
      FROM "discussionCommentVotes" dcv
      JOIN "discussionComments" dc ON dc."id" = dcv."commentId"
      JOIN "discussionPosts" dp ON dp."id" = dc."postId"
      WHERE dcv."userId" = ${userId}
      AND dp."boardId" = ${boardId}
    `);
    const result: Record<string, 'UP' | 'DOWN'> = {};
    for (const v of votes) {
      result[v.commentId] = v.type as 'UP' | 'DOWN';
    }
    return result;
  }

  async voteComment(
    user: UserFull,
    postId: string,
    commentId: string,
    type: 'UP' | 'DOWN',
  ): Promise<{ commentId: string; upvotes: number; downvotes: number; userVote: 'UP' | 'DOWN' | null }> {
    if (!user?.id) {
      throw new UnauthorizedException(['You must be logged in to vote']);
    }

    const comment = await this.prismaService.discussionComment.findFirst({
      where: { id: commentId, postId },
    });

    if (!comment) {
      throw new NotFoundException(['Comment not found']);
    }

    const existing = await this.prismaService.discussionCommentVote.findUnique({
      where: { commentId_userId: { commentId, userId: user.id } },
    });

    const voteType = type as CommentVoteType;

    if (existing) {
      if (existing.type === voteType) {
        await this.prismaService.discussionCommentVote.delete({
          where: { commentId_userId: { commentId, userId: user.id } },
        });
        await this.prismaService.discussionComment.update({
          where: { id: commentId },
          data: {
            upvotes: voteType === CommentVoteType.UP ? { decrement: 1 } : undefined,
            downvotes: voteType === CommentVoteType.DOWN ? { decrement: 1 } : undefined,
          },
        });
        const updated = await this.prismaService.discussionComment.findUniqueOrThrow({ where: { id: commentId } });
        return { commentId, upvotes: updated.upvotes, downvotes: updated.downvotes, userVote: null };
      } else {
        await this.prismaService.discussionCommentVote.update({
          where: { commentId_userId: { commentId, userId: user.id } },
          data: { type: voteType },
        });
        await this.prismaService.discussionComment.update({
          where: { id: commentId },
          data: {
            upvotes: voteType === CommentVoteType.UP ? { increment: 1 } : { decrement: 1 },
            downvotes: voteType === CommentVoteType.DOWN ? { increment: 1 } : { decrement: 1 },
          },
        });
        const updated = await this.prismaService.discussionComment.findUniqueOrThrow({ where: { id: commentId } });
        return { commentId, upvotes: updated.upvotes, downvotes: updated.downvotes, userVote: type };
      }
    } else {
      await this.prismaService.discussionCommentVote.create({
        data: { id: v4(), commentId, userId: user.id, type: voteType },
      });
      await this.prismaService.discussionComment.update({
        where: { id: commentId },
        data: {
          upvotes: voteType === CommentVoteType.UP ? { increment: 1 } : undefined,
          downvotes: voteType === CommentVoteType.DOWN ? { increment: 1 } : undefined,
        },
      });
      const updated = await this.prismaService.discussionComment.findUniqueOrThrow({ where: { id: commentId } });
      return { commentId, upvotes: updated.upvotes, downvotes: updated.downvotes, userVote: type };
    }
  }

  getVapidPublicKey(): string {
    return this.configService.get<string>('VAPID_PUBLIC_KEY') ?? '';
  }

  async savePushSubscription(userId: string, endpoint: string, p256dh: string, auth: string): Promise<void> {
    await this.prismaService.$queryRaw(Prisma.sql`
      INSERT INTO "pushSubscriptions" ("id", "createdAt", "userId", "endpoint", "p256dh", "auth")
      VALUES (${v4()}, NOW(), ${userId}, ${endpoint}, ${p256dh}, ${auth})
      ON CONFLICT ("endpoint") DO UPDATE SET "p256dh" = ${p256dh}, "auth" = ${auth}, "userId" = ${userId}
    `);
  }

  async deletePushSubscription(userId: string, endpoint: string): Promise<void> {
    await this.prismaService.$queryRaw(Prisma.sql`
      DELETE FROM "pushSubscriptions" WHERE "endpoint" = ${endpoint} AND "userId" = ${userId}
    `);
  }

  private async sendPushNotificationsToBoard(boardId: string, title: string, body: string): Promise<void> {
    const subscriptions = await this.prismaService.$queryRaw<
      Array<{ endpoint: string; p256dh: string; auth: string }>
    >(Prisma.sql`
      SELECT ps.endpoint, ps.p256dh, ps.auth
      FROM "pushSubscriptions" ps
      JOIN "discussionBoardMembers" dbm ON dbm."userId" = ps."userId"
      WHERE dbm."boardId" = ${boardId}
    `);

    this.logger.log(`Sending push to ${subscriptions.length} subscription(s) for board ${boardId}`);
    if (subscriptions.length === 0) return;

    const payload = JSON.stringify({
      message: title,
      body: body
        .replace(/<[^>]+>/g, '')
        .trim()
        .slice(0, 120),
      icon: '/assets/icons/192.png',
      data: { url: `/discussion-boards/${boardId}` },
    });
    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload),
      ),
    );

    const toDelete: string[] = [];
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        const status = (result.reason as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410) {
          toDelete.push(subscriptions[i].endpoint);
        }
      }
    });
    for (const endpoint of toDelete) {
      await this.prismaService.$queryRaw(Prisma.sql`
        DELETE FROM "pushSubscriptions" WHERE "endpoint" = ${endpoint}
      `);
    }
  }
}
