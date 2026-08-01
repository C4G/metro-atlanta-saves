import { ProgramsModule } from '@mas/backend-programs';
import { Module } from '@nestjs/common';
import { AlliesOnProgramsController } from './allies-on-programs.controller';
import { AlliesOnProgramsService } from './allies-on-programs.service';

@Module({
  providers: [AlliesOnProgramsService],
  controllers: [AlliesOnProgramsController],
  imports: [ProgramsModule],
  exports: [AlliesOnProgramsService],
})
export class AlliesOnProgramsModule {}
