import { Injectable } from '@nestjs/common';
import { PrismaService } from '@mas/backend-prisma';
import { UpdateUserGuideDto } from './dto/update-user-guide.dto';

@Injectable()
export class UserGuideService {
  constructor(private readonly prismaService: PrismaService) {}

  find() {
    return this.prismaService.userGuide.findFirst();
  }

  update(data: UpdateUserGuideDto) {
    return this.prismaService.userGuide.update({
      where: { id: data.id },
      data,
    });
  }
}
