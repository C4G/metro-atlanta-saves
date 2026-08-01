import { Module } from '@nestjs/common';
import { UserGuideController } from './user-guide.controller';
import { UserGuideService } from './user-guide.service';

@Module({
  controllers: [UserGuideController],
  providers: [UserGuideService],
  exports: [UserGuideService],
})
export class UserGuideModule {}
