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
import { basename, extname } from 'path';
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { DiscussionService } from './discussion.service';
import { CreateDiscussionPostDto } from './dto/create-discussion-post.dto';
import { CreateDiscussionCommentDto } from './dto/create-discussion-comment.dto';
import { CreateDiscussionTagDto } from './dto/create-discussion-tag.dto';
import { UpdateDiscussionPostDto } from './dto/update-discussion-post.dto';
import { UpdateDiscussionCommentDto } from './dto/update-discussion-comment.dto';
import { DISCUSSION_IMAGES_DIR, JwtGuard, privateDir, RoleGuard, Roles } from '@mas/backend-shared';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserFull } from '@mas/models';

@Controller('discussion-posts')
@ApiBearerAuth()
@ApiTags('discussion-posts')
export class DiscussionController {
  constructor(private readonly discussionService: DiscussionService) {}

  @Post('upload-image')
  @UseGuards(JwtGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (req, file, cb) => cb(null, privateDir(DISCUSSION_IMAGES_DIR)),
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
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    return { url: `/api/discussion-posts/images/${file.filename}` };
  }

  @Get('images/:filename')
  serveImage(@Param('filename') filename: string, @Res() res: Response) {
    return res.sendFile(basename(filename), { root: privateDir(DISCUSSION_IMAGES_DIR) });
  }

  @Post()
  @UseGuards(JwtGuard)
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
  @UseGuards(JwtGuard)
  createComment(
    @Req() req: Request & { user: UserFull },
    @Param('id') postId: string,
    @Body() dto: CreateDiscussionCommentDto,
  ) {
    return this.discussionService.createComment(req.user, postId, dto);
  }

  @Delete(':postId/comments/:commentId')
  @UseGuards(JwtGuard)
  removeComment(
    @Req() req: Request & { user: UserFull },
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
  ) {
    return this.discussionService.removeComment(postId, commentId, req.user);
  }

  @Post(':postId/comments/:commentId/vote')
  @UseGuards(JwtGuard)
  voteComment(
    @Req() req: Request & { user: UserFull },
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Body() dto: { type: 'UP' | 'DOWN' },
  ) {
    return this.discussionService.voteComment(req.user, postId, commentId, dto.type);
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  remove(@Req() req: Request & { user: UserFull }, @Param('id') id: string) {
    return this.discussionService.removePost(id, req.user);
  }

  @Patch(':id')
  @UseGuards(JwtGuard)
  updatePost(@Req() req: Request & { user: UserFull }, @Param('id') id: string, @Body() dto: UpdateDiscussionPostDto) {
    return this.discussionService.updatePost(id, req.user, dto);
  }

  @Patch(':postId/comments/:commentId')
  @UseGuards(JwtGuard)
  updateComment(
    @Req() req: Request & { user: UserFull },
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Body() dto: UpdateDiscussionCommentDto,
  ) {
    return this.discussionService.updateComment(postId, commentId, req.user, dto);
  }

  @Patch(':id/pin')
  @UseGuards(JwtGuard)
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
  @UseGuards(JwtGuard, RoleGuard)
  createTag(@Body() dto: CreateDiscussionTagDto) {
    return this.discussionService.createTag(dto);
  }

  @Delete('tags/:id')
  @Roles('Administrator', 'Partner_Staff')
  @UseGuards(JwtGuard, RoleGuard)
  deleteTag(@Param('id') id: string) {
    return this.discussionService.deleteTag(id);
  }
}
