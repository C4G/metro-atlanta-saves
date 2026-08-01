import { Injectable } from '@nestjs/common';
import { PrismaService } from '@mas/backend-prisma';
import { UpdatePeerEvaluationGuideDto } from './dto/update-peer-evaluation-guide.dto';

@Injectable()
export class PeerEvaluationGuideService {
  constructor(private readonly prismaService: PrismaService) {}

  find() {
    return this.prismaService.peerEvaluationGuide.findFirst();
  }

  update(data: UpdatePeerEvaluationGuideDto) {
    return this.prismaService.peerEvaluationGuide.update({
      where: { id: data.id },
      data,
    });
  }
}
