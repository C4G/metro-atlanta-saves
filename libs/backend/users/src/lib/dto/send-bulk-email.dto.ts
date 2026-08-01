import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendBulkEmailDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String, example: 'Monthly Update', description: 'Email subject' })
  subject!: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String, example: '<p>Hello everyone!</p>', description: 'Email body as HTML' })
  body!: string;
}
