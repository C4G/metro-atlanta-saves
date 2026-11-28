import { IsDefined, IsNotEmpty, IsObject, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export type EmailCampaignAudience =
  | { type: 'users'; userIds: string[] }
  | { type: 'board'; boardId: string }
  | { type: 'program'; programId: string };

export class SendBulkEmailDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String, example: 'Monthly Update', description: 'Email subject' })
  subject!: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String, example: '<p>Hello everyone!</p>', description: 'Email body as HTML' })
  body!: string;

  @IsDefined()
  @IsObject()
  @ApiProperty({
    oneOf: [
      {
        type: 'object',
        properties: { type: { enum: ['users'] }, userIds: { type: 'array', items: { type: 'string' } } },
      },
      { type: 'object', properties: { type: { enum: ['board'] }, boardId: { type: 'string' } } },
      { type: 'object', properties: { type: { enum: ['program'] }, programId: { type: 'string' } } },
    ],
  })
  audience!: EmailCampaignAudience;
}

export class ResolveCampaignRecipientsDto {
  @IsDefined()
  @IsObject()
  @ApiProperty({ type: Object, description: 'The selected campaign audience' })
  audience!: EmailCampaignAudience;
}
