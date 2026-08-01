import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@Controller('health')
@ApiTags('health')
export class HealthController {
  /**
   * Container healthcheck. Deliberately dependency-free — a transient database
   * blip should not cause the orchestrator to kill an otherwise healthy process.
   */
  @Get()
  check() {
    return { status: 'ok' };
  }
}
