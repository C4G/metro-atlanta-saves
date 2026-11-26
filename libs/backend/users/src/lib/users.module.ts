import { Global, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { EmailPreferencesService } from './email-preferences.service';
import { EmailPreferencesController } from './email-preferences.controller';

@Global()
@Module({
  providers: [UsersService, EmailPreferencesService],
  controllers: [UsersController, EmailPreferencesController],
  exports: [UsersService, EmailPreferencesService],
})
export class UsersModule {}
