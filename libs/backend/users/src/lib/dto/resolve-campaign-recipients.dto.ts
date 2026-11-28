import { IsDefined, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { EmailCampaignAudience } from './send-bulk-email.dto';

export class ResolveCampaignRecipientsDto {
  @IsDefined()
  @IsObject()
  @ApiProperty({ type: Object, description: 'The selected campaign audience' })
  audience!: EmailCampaignAudience;
}
