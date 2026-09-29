import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ManagedSessionGuard } from '@mas/backend-shared';
import { GoogleAuthConfigController } from './google-auth-config.controller';

@Global()
@Module({
  controllers: [AuthController, GoogleAuthConfigController],
  providers: [AuthService, ManagedSessionGuard],
  exports: [AuthService, ManagedSessionGuard],
})
export class AuthModule {}
