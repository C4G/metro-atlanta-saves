import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '@mas/backend-prisma';
import { AuthDto, SignUpDto } from './dto';
import * as argon from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { mapUser } from '@mas/backend-shared';
import { ForgotResponse, UserFull } from '@mas/models';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { MailService } from '@mas/backend-mail';
import { v4 } from 'uuid';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Prisma, User } from '@mas/prisma-client';
import { PatchUserDto } from '@mas/backend-users';

@Injectable({})
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private mailService: MailService,
  ) {}

  async updateLastLogin(id: string) {
    await this.prisma.user.update({
      where: { id },
      data: { lastLogin: new Date() },
    });
  }

  async getUser(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new BadRequestException(['No user details provided']);
    }
    await this.updateLastLogin(user.id);
    return mapUser(user);
  }

  async patchUser(userDto: PatchUserDto) {
    const user = await this.prisma.user.update({
      where: { id: userDto.id },
      data: {
        ...userDto,
        updatedAt: new Date(),
      },
    });

    return mapUser(user);
  }

  async signup(dto: SignUpDto) {
    //generate the password hash
    const hashValue = await argon.hash(dto.password);
    // save the new user in the db

    try {
      const createdUser = await this.prisma.user.create({
        data: {
          email: dto.email,
          hash: hashValue,
          firstName: dto.firstName,
          lastName: dto.lastName,
        },
      });
      const { hash, forgot, ...user } = createdUser;
      // return the saved user
      const accessToken = (await this.signToken(user)).access_token;

      await this.updateLastLogin(user.id);
      return { ...user, accessToken };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code == 'P2002') {
          throw new ForbiddenException(['Credentials taken']);
        }
      }

      throw new BadRequestException(['There was an error, please try again.']);
    }
  }

  async signin(dto: AuthDto): Promise<UserFull> {
    const _user: User | null = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });
    if (!_user) throw new ForbiddenException('Credentials incorrect');

    const pwMatches = await argon.verify(_user.hash, dto.password);

    if (!pwMatches) {
      throw new ForbiddenException('Credentials incorrect');
    }

    const user = mapUser(_user);
    const accessToken = (await this.signToken(user)).access_token;

    const firstProgram = await this.prisma.usersOnPrograms.findFirst({
      select: { programId: true },
      where: { userId: user.id },
    });

    await this.updateLastLogin(user.id);
    return { ...user, accessToken, firstProgramId: firstProgram?.programId };
  }

  async signToken(user: UserFull): Promise<{ access_token: string }> {
    const secret = this.config.get('JWT_SECRET');
    const token = await this.jwt.signAsync(user, {
      secret: secret,
    });
    return {
      access_token: token,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<ForgotResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      return { message: 'If the email is in the system you should recieve an email to reset your password.' };
    }
    const token = v4();
    await this.prisma.user.update({
      where: { email: dto.email },
      data: { forgot: token, updatedAt: new Date() },
    });
    await this.mailService.sendForgotPassword(dto.email, token);
    return { message: 'If the email is in the system you should recieve an email to reset your password.' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<UserFull> {
    const userCheck = await this.prisma.user.findUnique({
      where: { email: dto.email, forgot: dto.token },
    });

    if (!userCheck) {
      throw new ForbiddenException('Token or email is incorrect');
    }

    const hashValue = await argon.hash(dto.password);
    const _user = await this.prisma.user.update({
      where: { email: dto.email },
      data: {
        hash: hashValue,
        forgot: null,
        updatedAt: new Date(),
      },
    });
    const user = mapUser(_user);
    const accessToken = (await this.signToken(user)).access_token;

    return { ...user, accessToken };
  }
}
