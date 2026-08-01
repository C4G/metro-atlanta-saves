import { Module } from '@nestjs/common';
import { LearningsService } from './learnings.service';
import { LearningsController } from './learnings.controller';

@Module({
  controllers: [LearningsController],
  providers: [LearningsService],
  exports: [LearningsService],
})
export class LearningsModule {}
