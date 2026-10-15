import { Module } from '@nestjs/common';
import { RequirementsService } from './requirements.service';
import { RequirementsController } from './requirements.controller';
import { ProgramsModule } from '@mas/backend-programs';
import { RequirementRemindersService } from './requirement-reminders.service';

@Module({
  controllers: [RequirementsController],
  providers: [RequirementsService, RequirementRemindersService],
  exports: [RequirementsService, RequirementRemindersService],
  imports: [ProgramsModule],
})
export class RequirementsModule {}
