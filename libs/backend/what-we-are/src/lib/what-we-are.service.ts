import { Injectable } from '@nestjs/common';
import { PrismaService } from '@mas/backend-prisma';
import { UpdateWhatWeAreDto } from './dto/update-what-we-are.dto';

@Injectable()
export class WhatWeAreService {
  constructor(private readonly prismaService: PrismaService) {}

  find() {
    return this.prismaService.whatWeAre.findFirst();
  }

  update(data: UpdateWhatWeAreDto) {
    const { id, whoWeAreDescription, whatWeDoDescription, hidden } = data;
    if (id) {
      return this.prismaService.whatWeAre.update({
        where: { id },
        data: { whoWeAreDescription, whatWeDoDescription, ...(hidden !== undefined ? { hidden } : {}) },
      });
    }
    return this.prismaService.whatWeAre.create({
      data: { whoWeAreDescription, whatWeDoDescription },
    });
  }
}
