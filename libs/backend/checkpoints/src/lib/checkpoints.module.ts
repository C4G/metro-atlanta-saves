import { Module } from '@nestjs/common';
import { CheckpointsService } from './checkpoints.service';
import { CheckpointsController } from './checkpoints.controller';
import { ProgramsModule } from '@mas/backend-programs';
import { UsersModule } from '@mas/backend-users';

@Module({
  controllers: [CheckpointsController],
  providers: [CheckpointsService],
  exports: [CheckpointsService],
  imports: [ProgramsModule, UsersModule],
})
export class CheckpointsModule {}
