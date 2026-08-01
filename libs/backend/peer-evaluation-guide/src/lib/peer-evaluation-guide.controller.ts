import { Body, Controller, Get, Patch } from '@nestjs/common';
import { PeerEvaluationGuideService } from './peer-evaluation-guide.service';
import { UpdatePeerEvaluationGuideDto } from './dto/update-peer-evaluation-guide.dto';

@Controller('peer-evaluation-guide')
export class PeerEvaluationGuideController {
  constructor(private peerEvaluationGuideService: PeerEvaluationGuideService) {}

  @Get()
  findAll() {
    return this.peerEvaluationGuideService.find();
  }

  @Patch()
  update(@Body() updatePeerEvaluationGuideDto: UpdatePeerEvaluationGuideDto) {
    return this.peerEvaluationGuideService.update(updatePeerEvaluationGuideDto);
  }
}
