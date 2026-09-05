import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ManagedSessionGuard } from '@mas/backend-shared';
import { DiscussionBoardService } from './discussion-board.service';
import { DiscussionService } from './discussion.service';
import { CreateDiscussionBoardDto } from './dto/create-discussion-board.dto';
import { UpdateDiscussionBoardDto } from './dto/update-discussion-board.dto';
import { AddBoardMemberDto } from './dto/add-board-member.dto';
import { CreateDiscussionPostDto } from './dto/create-discussion-post.dto';
import { CreateDiscussionCommentDto } from './dto/create-discussion-comment.dto';

@ApiTags('Discussion Boards')
@ApiBearerAuth()
@UseGuards(ManagedSessionGuard)
@Controller('discussion-boards')
export class DiscussionBoardController {
  constructor(
    private readonly boardService: DiscussionBoardService,
    private readonly discussionService: DiscussionService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new discussion board',
    description: 'Only administrators can create discussion boards',
  })
  @ApiResponse({
    status: 201,
    description: 'Discussion board created successfully',
  })
  async createBoard(@Request() req: any, @Body() dto: CreateDiscussionBoardDto) {
    return this.boardService.createBoard(req.user.id, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all discussion boards accessible to the current user',
    description: 'Returns boards where user is a member or creator',
  })
  @ApiResponse({
    status: 200,
    description: 'List of accessible discussion boards',
  })
  async getUserBoards(@Request() req: any) {
    return this.boardService.getUserBoards(req.user.id);
  }

  @Get('admin/all')
  @ApiOperation({
    summary: 'Get all discussion boards (admin only)',
    description: 'Returns all boards in the system',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all discussion boards',
  })
  async getAllBoards(@Request() req: any) {
    return this.boardService.getAllBoards(req.user.id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a specific discussion board',
  })
  @ApiResponse({
    status: 200,
    description: 'Discussion board details',
  })
  async getBoardById(@Request() req: any, @Param('id') boardId: string) {
    return this.boardService.getBoardById(req.user.id, boardId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a discussion board',
    description: 'Only the board creator or admins can update the board',
  })
  @ApiResponse({
    status: 200,
    description: 'Discussion board updated successfully',
  })
  async updateBoard(@Request() req: any, @Param('id') boardId: string, @Body() dto: UpdateDiscussionBoardDto) {
    return this.boardService.updateBoard(req.user.id, boardId, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a discussion board',
    description: 'Only the board creator or admins can delete the board',
  })
  @ApiResponse({
    status: 200,
    description: 'Discussion board deleted successfully',
  })
  async deleteBoard(@Request() req: any, @Param('id') boardId: string) {
    await this.boardService.deleteBoard(req.user.id, boardId);
    return { message: 'Discussion board deleted successfully' };
  }

  @Post(':id/members')
  @ApiOperation({
    summary: 'Add a member to a discussion board',
    description: 'Only the board creator or admins can add members',
  })
  @ApiResponse({
    status: 201,
    description: 'Member added successfully',
  })
  async addMember(@Request() req: any, @Param('id') boardId: string, @Body() dto: AddBoardMemberDto) {
    await this.boardService.addMember(req.user.id, boardId, dto.userId);
    return { message: 'Member added successfully' };
  }

  @Delete(':id/members/:userId')
  @ApiOperation({
    summary: 'Remove a member from a discussion board',
    description: 'Only the board creator or admins can remove members',
  })
  @ApiResponse({
    status: 200,
    description: 'Member removed successfully',
  })
  async removeMember(@Request() req: any, @Param('id') boardId: string, @Param('userId') userId: string) {
    await this.boardService.removeMember(req.user.id, boardId, userId);
    return { message: 'Member removed successfully' };
  }

  @Patch(':id/members/:userId/admin')
  @ApiOperation({
    summary: 'Toggle board admin status for a member',
    description: 'Only the board creator or global admins can change member admin status',
  })
  @ApiResponse({
    status: 200,
    description: 'Member admin status updated',
  })
  async toggleMemberAdmin(
    @Request() req: any,
    @Param('id') boardId: string,
    @Param('userId') userId: string,
    @Body() body: { isAdmin: boolean },
  ) {
    await this.boardService.toggleMemberAdmin(req.user.id, boardId, userId, body.isAdmin);
    return { message: 'Member admin status updated successfully' };
  }

  @Get(':id/members')
  @ApiOperation({
    summary: 'Get all members of a discussion board',
  })
  @ApiResponse({
    status: 200,
    description: 'List of board members',
  })
  async getBoardMembers(@Request() req: any, @Param('id') boardId: string) {
    return this.boardService.getBoardMembers(req.user.id, boardId);
  }

  @Get(':id/users/search')
  @ApiOperation({
    summary: 'Search users to add to a board (board admin or global staff)',
  })
  @ApiResponse({ status: 200, description: 'List of matching users' })
  async searchUsersForBoard(@Request() req: any, @Param('id') boardId: string, @Query('q') query: string) {
    return this.boardService.searchUsersForBoard(req.user.id, boardId, query ?? '');
  }

  @Post(':id/posts')
  @ApiOperation({
    summary: 'Create a new post in a discussion board',
  })
  @ApiResponse({
    status: 201,
    description: 'Post created successfully',
  })
  async createPostForBoard(@Request() req: any, @Param('id') boardId: string, @Body() dto: CreateDiscussionPostDto) {
    return this.discussionService.createPostForBoard(req.user, boardId, dto);
  }

  @Get(':id/posts')
  @ApiOperation({
    summary: 'Get all posts in a discussion board',
  })
  @ApiResponse({
    status: 200,
    description: 'List of board posts',
  })
  async getPostsForBoard(@Param('id') boardId: string) {
    return this.discussionService.getPostsForBoard(boardId);
  }

  @Post(':id/posts/:postId/comments')
  @ApiOperation({
    summary: 'Create a comment on a board post',
  })
  @ApiResponse({
    status: 201,
    description: 'Comment created successfully',
  })
  async createCommentForBoardPost(
    @Request() req: any,
    @Param('id') boardId: string,
    @Param('postId') postId: string,
    @Body() dto: CreateDiscussionCommentDto,
  ) {
    return this.discussionService.createComment(req.user, postId, dto);
  }

  @Delete(':id/posts/:postId/comments/:commentId')
  @ApiOperation({
    summary: 'Delete a comment from a board post',
  })
  @ApiResponse({
    status: 200,
    description: 'Comment deleted successfully',
  })
  async removeCommentFromBoard(
    @Request() req: any,
    @Param('id') boardId: string,
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
  ) {
    return this.discussionService.removeComment(postId, commentId, req.user);
  }

  @Post(':id/tags')
  @ApiOperation({
    summary: 'Create a tag for board posts',
  })
  @ApiResponse({
    status: 201,
    description: 'Tag created successfully',
  })
  async createTagForBoard(@Param('id') boardId: string, @Body() dto: any) {
    return this.discussionService.createTagForBoard(boardId, dto);
  }

  @Get(':id/my-votes')
  @ApiOperation({
    summary: "Get current user's comment votes for all posts in a board",
  })
  async getMyVotesForBoard(@Request() req: any, @Param('id') boardId: string) {
    return this.discussionService.getUserVotesForBoard(req.user.id, boardId);
  }

  @Get(':id/tags')
  @ApiOperation({
    summary: 'Get all tags for a board',
  })
  @ApiResponse({
    status: 200,
    description: 'List of board tags',
  })
  async getTagsForBoard(@Param('id') boardId: string) {
    return this.discussionService.getTagsForBoard(boardId);
  }

  @Delete(':id/tags/:tagId')
  @ApiOperation({
    summary: 'Delete a tag from a board',
  })
  @ApiResponse({
    status: 200,
    description: 'Tag deleted successfully',
  })
  async deleteTagForBoard(@Param('id') boardId: string, @Param('tagId') tagId: string) {
    return this.discussionService.deleteTagForBoard(boardId, tagId);
  }

  @Get('push/vapid-public-key')
  @ApiOperation({ summary: 'Get VAPID public key for web push subscriptions' })
  getVapidPublicKey() {
    return { publicKey: this.discussionService.getVapidPublicKey() };
  }

  @Post('push/subscribe')
  @ApiOperation({ summary: 'Save a push subscription for the current user' })
  async subscribePush(@Request() req: any, @Body() body: { endpoint: string; keys: { p256dh: string; auth: string } }) {
    await this.discussionService.savePushSubscription(req.user.id, body.endpoint, body.keys.p256dh, body.keys.auth);
    return { ok: true };
  }

  @Post('push/unsubscribe')
  @ApiOperation({ summary: 'Remove a push subscription for the current user' })
  async unsubscribePush(@Request() req: any, @Body() body: { endpoint: string }) {
    await this.discussionService.deletePushSubscription(req.user.id, body.endpoint);
    return { ok: true };
  }
}
