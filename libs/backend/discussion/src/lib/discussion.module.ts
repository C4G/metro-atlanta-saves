import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@mas/backend-prisma';
import { MailModule } from '@mas/backend-mail';
import { DiscussionService } from './discussion.service';
import { DiscussionController } from './discussion.controller';
import { DiscussionBoardService } from './discussion-board.service';
import { DiscussionBoardController } from './discussion-board.controller';

@Module({
  imports: [PrismaModule, MailModule, ConfigModule],
  controllers: [DiscussionController, DiscussionBoardController],
  providers: [DiscussionService, DiscussionBoardService],
  exports: [DiscussionService, DiscussionBoardService],
})
export class DiscussionModule {}
