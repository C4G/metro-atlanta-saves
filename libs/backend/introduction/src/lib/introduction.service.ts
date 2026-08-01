import { Injectable } from '@nestjs/common';
import { basename } from 'path';
import { PrismaService } from '@mas/backend-prisma';
import { UpdateIntroductionDto } from './dto/update-introduction.dto';

@Injectable()
export class IntroductionService {
  constructor(private readonly prismaService: PrismaService) {}

  find() {
    return this.prismaService.introduction.findFirst();
  }

  update(file: Express.Multer.File | undefined, data: UpdateIntroductionDto) {
    const { id, ...rest } = data;
    const updateData = file ? { ...rest, imageUrl: `/api/introduction/image/${basename(file.path)}` } : rest;
    return this.prismaService.introduction.update({
      where: { id },
      data: updateData,
    });
  }
}
