import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@mas/backend-prisma';
import { mapUser, randomPassword } from '@mas/backend-shared';
import { PatchUserDto } from './dto/patch-user.dto';
import { UserFull, UsersNamesOnly } from '@mas/models';
import { CreateUserDto } from './dto/create-user.dto';
import * as argon from 'argon2';
import { ConfigService } from '@nestjs/config';
import { AuthService as BetterAuthService } from '@thallesp/nestjs-better-auth';
import { MailService } from '@mas/backend-mail';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private betterAuth: BetterAuthService,
    private config: ConfigService,
    private mailService: MailService,
  ) {}

  async getUsers(requestingUser: Pick<UserFull, 'role' | 'partnerId'>) {
    const orderBy = [{ firstName: 'asc' as const }, { lastName: 'asc' as const }];

    if (requestingUser.role === 'Administrator') {
      const users = await this.prisma.user.findMany({ orderBy });
      return users.map((obj) => mapUser(obj));
    }

    if (requestingUser.role !== 'Partner_Staff' || !requestingUser.partnerId) {
      return [];
    }

    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { role: 'Partner_Staff', partnerId: requestingUser.partnerId },
          {
            role: null,
            UsersOnPrograms: { some: { program: { partnerId: requestingUser.partnerId } } },
          },
        ],
      },
      orderBy,
    });
    return users.map((obj) => mapUser(obj));
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new BadRequestException(['That user does not exist']);
    }

    return mapUser(user);
  }

  async getUsersNames(): Promise<UsersNamesOnly[]> {
    const users = await this.prisma.user.findMany({
      select: { firstName: true, lastName: true, id: true, email: true },
    });

    return users;
  }

  async getUsername(id: string): Promise<UsersNamesOnly> {
    const user = await this.prisma.user.findUnique({
      select: { firstName: true, lastName: true, id: true, email: true },
      where: { id },
    });
    if (!user) {
      throw new BadRequestException(['User not found!']);
    }

    return user;
  }

  async createUser(createUser: CreateUserDto) {
    const emailCheck = await this.prisma.user.findUnique({
      where: { email: createUser.email },
    });
    if (emailCheck) {
      throw new BadRequestException(['That email is already taken']);
    }
    const password = await argon.hash(randomPassword());
    try {
      const createdUser = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            ...createUser,
            name: `${createUser.firstName} ${createUser.lastName}`.trim(),
          },
        });
        await tx.account.create({
          data: {
            issuer: 'local:credential',
            accountId: user.id,
            providerId: 'credential',
            userId: user.id,
            password,
          },
        });
        return user;
      });
      const publicAppUrl = (this.config.get<string>('PUBLIC_APP_URL') ?? 'https://brpatl.com').replace(/\/+$/, '');
      await this.betterAuth.api.requestPasswordReset({
        body: { email: createdUser.email, redirectTo: `${publicAppUrl}/reset-password` },
      });
      return mapUser(createdUser);
    } catch {
      throw new BadRequestException(['There was an error creating the user']);
    }
  }

  async patchUser(id: string, user: PatchUserDto) {
    if (user.partnerId) {
      const partner = await this.prisma.partner.findFirst({
        where: { id: user.partnerId },
      });
      if (!partner) {
        throw new Error('The partner does not');
      }
    }
    const _user = await this.prisma.user.update({
      where: { id },
      data: {
        ...user,
        updatedAt: new Date(),
      },
      include: { partner: true },
    });
    return mapUser(_user);
  }

  async getPartnerEmails(partnerId: string) {
    const users = await this.prisma.user.findMany({
      where: { partnerId },
      select: { email: true },
    });

    return users.map((obj) => obj.email);
  }

  async sendBulkEmail(subject: string, body: string) {
    const users = await this.prisma.user.findMany({
      select: { email: true },
    });
    const emails = users.map((u) => u.email);
    await this.mailService.sendBulkEmail(emails, subject, body);
  }
}
