import { BadRequestException, Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto, ForgotPasswordDto, ResetPasswordDto, SignUpDto } from './dto';
import { ManagedSessionGuard } from '@mas/backend-shared';
import { UserFull } from '@mas/models';
import { PatchUserDto } from '@mas/backend-users';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Controller('auth')
@ApiBearerAuth()
@ApiTags('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get()
  @UseGuards(ManagedSessionGuard)
  getMe(@Req() request: Request & { user: UserFull }) {
    if (!request.user) {
      throw new BadRequestException(['No user details provided']);
    }
    return this.authService.getUser(request.user.email);
  }

  @Post('signup')
  signup(@Body() dto: SignUpDto) {
    return this.authService.signup(dto);
  }

  @Post('signin')
  signin(@Body() dto: AuthDto) {
    return this.authService.signin(dto);
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Patch()
  @UseGuards(ManagedSessionGuard)
  async patchMe(@Req() request: Request & { user: UserFull }, @Body() userDto: PatchUserDto) {
    if (request.user.id !== userDto.id) {
      throw new BadRequestException(['No user details provided']);
    }
    return this.authService.patchUser(userDto);
  }
}
