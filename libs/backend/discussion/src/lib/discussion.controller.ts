import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { basename, extname, join } from 'path';
import { unlink } from 'fs/promises';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { DiscussionService } from './discussion.service';
import { CreateDiscussionPostDto } from './dto/create-discussion-post.dto';
import { CreateDiscussionCommentDto } from './dto/create-discussion-comment.dto';
import { CreateDiscussionTagDto } from './dto/create-discussion-tag.dto';
import { UpdateDiscussionPostDto } from './dto/update-discussion-post.dto';
import { UpdateDiscussionCommentDto } from './dto/update-discussion-comment.dto';
import { DISCUSSION_IMAGES_DIR, ManagedSessionGuard, privateDir, RoleGuard, Roles } from '@mas/backend-shared';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserFull } from '@mas/models';
import { DiscussionBoardService } from './discussion-board.service';

const BOARD_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

const getBoardId = (request: Request): string | null => {
  const boardId = request.query?.['boardId'];
  return typeof boardId === 'string' && BOARD_ID_PATTERN.test(boardId) ? boardId : null;
};

@Controller('discussion-posts')
@ApiBearerAuth()
@ApiTags('discussion-posts')
export class DiscussionController {
  constructor(
    private readonly discussionService: DiscussionService,
    private readonly discussionBoardService: DiscussionBoardService,
  ) {}

  @Post('upload-image')
  @UseGuards(ManagedSessionGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const boardId = getBoardId(req);
          if (!boardId) {
            return cb(new BadRequestException('A valid board ID is required'), '');
          }
          cb(null, privateDir(join(DISCUSSION_IMAGES_DIR, boardId)));
        },
        filename: (req, file, cb) => {
          cb(null, `${uuidv4()}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Only image files are allowed'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadImage(
    @Req() req: Request & { user: UserFull },
    @Query('boardId') boardId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');

    try {
      await this.discussionBoardService.getBoardById(req.user.id, boardId);
    } catch (error) {
      await unlink(file.path).catch(() => undefined);
      throw error;
    }

    return { url: `/api/discussion-posts/images/${boardId}/${file.filename}` };
  }

  @Get('images/:boardId/:filename')
  @UseGuards(ManagedSessionGuard)
  async serveBoardImage(
    @Req() req: Request & { user: UserFull },
    @Param('boardId') boardId: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    if (!BOARD_ID_PATTERN.test(boardId)) {
      throw new BadRequestException('Invalid board ID');
    }

    await this.discussionBoardService.getBoardById(req.user.id, boardId);
    return res.sendFile(basename(filename), { root: privateDir(join(DISCUSSION_IMAGES_DIR, boardId)) });
  }

  // Kept for existing discussion HTML that references the original root-level image URL.
  @Get('images/:filename')
  @UseGuards(ManagedSessionGuard)
  serveImage(@Param('filename') filename: string, @Res() res: Response) {
    return res.sendFile(basename(filename), { root: privateDir(DISCUSSION_IMAGES_DIR) });
  }

  @Post()
  @UseGuards(ManagedSessionGuard)
  create(@Req() req: Request & { user: UserFull }, @Body() dto: CreateDiscussionPostDto) {
    return this.discussionService.createPost(req.user, dto);
  }

  @Get()
  findAll(@Query('boardId') boardId?: string) {
    return this.discussionService.findAll(boardId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.discussionService.findOne(id);
  }

  @Post(':id/comments')
  @UseGuards(ManagedSessionGuard)
  createComment(
    @Req() req: Request & { user: UserFull },
    @Param('id') postId: string,
    @Body() dto: CreateDiscussionCommentDto,
  ) {
    return this.discussionService.createComment(req.user, postId, dto);
  }

  @Delete(':postId/comments/:commentId')
  @UseGuards(ManagedSessionGuard)
  removeComment(
    @Req() req: Request & { user: UserFull },
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
  ) {
    return this.discussionService.removeComment(postId, commentId, req.user);
  }

  @Post(':postId/comments/:commentId/vote')
  @UseGuards(ManagedSessionGuard)
  voteComment(
    @Req() req: Request & { user: UserFull },
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Body() dto: { type: 'UP' | 'DOWN' },
  ) {
    return this.discussionService.voteComment(req.user, postId, commentId, dto.type);
  }

  @Delete(':id')
  @UseGuards(ManagedSessionGuard)
  remove(@Req() req: Request & { user: UserFull }, @Param('id') id: string) {
    return this.discussionService.removePost(id, req.user);
  }

  @Patch(':id')
  @UseGuards(ManagedSessionGuard)
  updatePost(@Req() req: Request & { user: UserFull }, @Param('id') id: string, @Body() dto: UpdateDiscussionPostDto) {
    return this.discussionService.updatePost(id, req.user, dto);
  }

  @Patch(':postId/comments/:commentId')
  @UseGuards(ManagedSessionGuard)
  updateComment(
    @Req() req: Request & { user: UserFull },
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Body() dto: UpdateDiscussionCommentDto,
  ) {
    return this.discussionService.updateComment(postId, commentId, req.user, dto);
  }

  @Patch(':id/pin')
  @UseGuards(ManagedSessionGuard)
  togglePin(@Param('id') id: string, @Req() req: any) {
    return this.discussionService.togglePin(id, req.user);
  }

  @Get('tags')
  getTags(@Query('boardId') boardId?: string) {
    if (boardId) {
      return this.discussionService.getTagsForBoard(boardId);
    }
    return this.discussionService.getAllTags();
  }

  @Get('tags/all')
  getAllTags(@Query('boardId') boardId?: string) {
    if (boardId) {
      return this.discussionService.getTagsForBoard(boardId);
    }
    return this.discussionService.getAllTags();
  }

  @Post('tags')
  @Roles('Administrator', 'Partner_Staff')
  @UseGuards(ManagedSessionGuard, RoleGuard)
  createTag(@Body() dto: CreateDiscussionTagDto) {
    return this.discussionService.createTag(dto);
  }

  @Delete('tags/:id')
  @Roles('Administrator', 'Partner_Staff')
  @UseGuards(ManagedSessionGuard, RoleGuard)
  deleteTag(@Param('id') id: string) {
    return this.discussionService.deleteTag(id);
  }
}
