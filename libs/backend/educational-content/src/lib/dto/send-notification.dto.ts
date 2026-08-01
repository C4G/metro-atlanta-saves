import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendNotificationDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    example: 'New educational content is available!',
    description: 'The heading displayed at the top of the email',
  })
  heading!: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    example: 'Check out the latest resources we have added for you.',
    description: 'The body text of the email',
  })
  body!: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    type: String,
    example: '12345678-1234-1234-1234-123456789012',
    description: 'Send to all users enrolled in this program',
  })
  programId?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    type: String,
    example: '12345678-1234-1234-1234-123456789012',
    description: 'Send to a specific user by their ID',
  })
  userId?: string;
}
