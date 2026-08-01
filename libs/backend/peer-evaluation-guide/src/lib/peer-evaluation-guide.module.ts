import { Module } from '@nestjs/common';
import { PeerEvaluationGuideController } from './peer-evaluation-guide.controller';
import { PeerEvaluationGuideService } from './peer-evaluation-guide.service';

@Module({
  controllers: [PeerEvaluationGuideController],
  providers: [PeerEvaluationGuideService],
  exports: [PeerEvaluationGuideService],
})
export class PeerEvaluationGuideModule {}
