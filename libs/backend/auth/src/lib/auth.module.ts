import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';

@Global()
@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtService],
  exports: [JwtService, AuthService],
})
export class AuthModule {}
