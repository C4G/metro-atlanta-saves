import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ManagedSessionGuard } from '@mas/backend-shared';

@Global()
@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtService, ManagedSessionGuard],
  exports: [JwtService, AuthService, ManagedSessionGuard],
})
export class AuthModule {}
