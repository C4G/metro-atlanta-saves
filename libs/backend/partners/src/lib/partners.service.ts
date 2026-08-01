import { BadRequestException, Injectable } from '@nestjs/common';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { PrismaService } from '@mas/backend-prisma';

@Injectable()
export class PartnersService {
  constructor(private prismaService: PrismaService) {}

  async create(partner: CreatePartnerDto) {
    try {
      const createdPartner = await this.prismaService.partner.create({
        data: partner,
      });

      return createdPartner;
    } catch (error: any) {
      throw new BadRequestException([error?.message || 'Failed to create partner']);
    }
  }

  async findAll() {
    return await this.prismaService.partner.findMany();
  }

  async findOne(id: string) {
    return await this.prismaService.partner.findUnique({
      where: { id },
    });
  }

  async update(id: string, body: Partial<CreatePartnerDto>) {
    return await this.prismaService.partner.update({
      where: { id },
      data: { ...body, updatedAt: new Date() },
    });
  }

  async remove(id: string) {
    const partner = await this.prismaService.partner.findUnique({
      where: { id },
      select: { users: true, program: true },
    });
    if (!partner) {
      throw new BadRequestException(['The partner does not exist']);
    }
    if (partner?.users.length) {
      throw new BadRequestException(['Cannot delete partner. Linked users must be removed']);
    }
    if (partner?.program.length) {
      throw new BadRequestException(['Cannot delete partner. Linked programs must be removed']);
    }
    try {
      return await this.prismaService.partner.delete({
        where: { id },
      });
    } catch (error: any) {
      throw new BadRequestException([error?.message || 'Failed to delete partner']);
    }
  }
}
