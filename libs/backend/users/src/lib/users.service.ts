import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@mas/backend-prisma';
import { mapUser, randomPassword } from '@mas/backend-shared';
import { PatchUserDto } from './dto/patch-user.dto';
import { UsersNamesOnly } from '@mas/models';
import { CreateUserDto } from './dto/create-user.dto';
import * as argon from 'argon2';
import { MailService } from '@mas/backend-mail';
import { v4 } from 'uuid';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async getUsers(partnerId: string | null) {
    if (partnerId) {
      // user is partner

      const programsAndUsers = await this.prisma.program.findMany({
        where: { partnerId },
        include: { UsersOnPrograms: { select: { userId: true } } },
      });

      const userIds = programsAndUsers.map((program) => program.UsersOnPrograms.map((user) => user.userId)).flat();

      const users = await this.prisma.user.findMany({
        where: { id: { in: userIds }, role: null },
      });
      return users.map((obj) => mapUser(obj));
    } else {
      // user is admin
      const users = await this.prisma.user.findMany({
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      });

      return users.map((obj) => mapUser(obj));
    }
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
    const passHash = await argon.hash(randomPassword());
    const token = v4();
    try {
      const createdUser = await this.prisma.user.create({
        data: {
          ...createUser,
          hash: passHash,
          forgot: token,
        },
      });
      const { hash, forgot, ...user } = createdUser;
      await this.mailService.sendAccountCreated(user.email, token);
      return user;
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
