import { BadRequestException, Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
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

  @Patch()
  @UseGuards(ManagedSessionGuard)
  async patchMe(@Req() request: Request & { user: UserFull }, @Body() userDto: PatchUserDto) {
    if (request.user.id !== userDto.id) {
      throw new BadRequestException(['No user details provided']);
    }
    return this.authService.patchUser(userDto);
  }
}
