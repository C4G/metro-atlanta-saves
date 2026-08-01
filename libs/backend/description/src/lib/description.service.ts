import { Injectable } from '@nestjs/common';
import { basename } from 'path';
import { PrismaService } from '@mas/backend-prisma';
import { UpdateDescriptionDto } from './dto/update-description.dto';

@Injectable()
export class DescriptionService {
  constructor(private readonly prismaService: PrismaService) {}

  find() {
    return this.prismaService.description.findFirst();
  }

  update(file: Express.Multer.File | undefined, data: UpdateDescriptionDto) {
    const { id, ...rest } = data;
    const updateData = file ? { ...rest, logoUrl: `/api/description/logo/${basename(file.path)}` } : rest;
    return this.prismaService.description.update({
      where: { id },
      data: updateData,
    });
  }
}
