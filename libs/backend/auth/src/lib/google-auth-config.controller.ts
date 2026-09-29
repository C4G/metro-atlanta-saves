import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { googleCredentials } from './better-auth';

@Controller('google-auth')
export class GoogleAuthConfigController {
  constructor(private readonly config: ConfigService) {}

  @Get('config')
  getConfig(): { clientId: string | null } {
    return { clientId: googleCredentials(this.config)?.clientId ?? null };
  }
}
