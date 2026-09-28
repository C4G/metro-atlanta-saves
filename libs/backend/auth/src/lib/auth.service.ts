import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@mas/backend-prisma';
import { mapUser } from '@mas/backend-shared';
import { PatchUserDto } from '@mas/backend-users';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async updateLastLogin(id: string) {
    await this.prisma.user.update({
      where: { id },
      data: { lastLogin: new Date() },
    });
  }

  async getUser(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new BadRequestException(['No user details provided']);
    }
    await this.updateLastLogin(user.id);
    return mapUser(user);
  }

  async patchUser(userDto: PatchUserDto) {
    const user = await this.prisma.user.update({
      where: { id: userDto.id },
      data: { ...userDto, updatedAt: new Date() },
    });
    return mapUser(user);
  }
}
