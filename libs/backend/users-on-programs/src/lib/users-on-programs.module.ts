import { Module } from '@nestjs/common';
import { UsersOnProgramsService } from './users-on-programs.service';
import { UsersOnProgramsController } from './users-on-programs.controller';
import { ProgramsModule } from '@mas/backend-programs';
import { CheckpointsModule } from '@mas/backend-checkpoints';
import { RequirementsModule } from '@mas/backend-requirements';

@Module({
  providers: [UsersOnProgramsService],
  controllers: [UsersOnProgramsController],
  imports: [ProgramsModule, CheckpointsModule, RequirementsModule],
  exports: [UsersOnProgramsService],
})
export class UsersOnProgramsModule {}
