import { Module } from '@nestjs/common';
import { RequirementsService } from './requirements.service';
import { RequirementsController } from './requirements.controller';
import { ProgramsModule } from '@mas/backend-programs';

@Module({
  controllers: [RequirementsController],
  providers: [RequirementsService],
  exports: [RequirementsService],
  imports: [ProgramsModule],
})
export class RequirementsModule {}
