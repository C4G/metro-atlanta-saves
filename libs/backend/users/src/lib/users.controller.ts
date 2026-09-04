import { Body, Controller, Get, HttpCode, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ManagedSessionGuard, RoleGuard, Roles } from '@mas/backend-shared';
import { UsersService } from './users.service';
import { PatchUserDto } from './dto/patch-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { SendBulkEmailDto } from './dto/send-bulk-email.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserFull } from '@mas/models';

@Controller('users')
@ApiBearerAuth()
@UseGuards(ManagedSessionGuard, RoleGuard)
@ApiTags('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  me(@Req() request: Request & { user: UserFull }) {
    return request.user;
  }

  @Get()
  @Roles('Administrator', 'Partner_Staff')
  users(@Req() request: Request & { user: UserFull }) {
    return this.usersService.getUsers(request.user);
  }

  @Get('names')
  @Roles('Administrator', 'Partner_Staff')
  usersNames() {
    return this.usersService.getUsersNames();
  }

  @Get('names/:id')
  @Roles('Administrator', 'Partner_Staff')
  usersName(@Param('id') id: string) {
    return this.usersService.getUsername(id);
  }

  @Post()
  @Roles('Administrator', 'Partner_Staff')
  createUser(@Body() body: CreateUserDto) {
    return this.usersService.createUser(body);
  }

  @Patch('me')
  patchMe(@Req() request: Request & { user: UserFull }, @Body() body: Omit<PatchUserDto, 'id'>) {
    return this.usersService.patchUser(request.user.id, { ...body, id: request.user.id });
  }

  @Patch('/:id')
  @Roles('Administrator')
  user(@Param('id') id: string, @Body() body: PatchUserDto) {
    return this.usersService.patchUser(id, body);
  }

  @Post('send-email')
  @HttpCode(204)
  @Roles('Administrator')
  sendBulkEmail(@Body() body: SendBulkEmailDto) {
    return this.usersService.sendBulkEmail(body.subject, body.body);
  }
}
