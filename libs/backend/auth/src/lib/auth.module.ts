import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ManagedSessionGuard } from '@mas/backend-shared';

@Global()
@Module({
  controllers: [AuthController],
  providers: [AuthService, ManagedSessionGuard],
  exports: [AuthService, ManagedSessionGuard],
})
export class AuthModule {}
