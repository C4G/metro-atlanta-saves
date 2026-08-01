import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateUserGuideDto {
  @IsString()
  @ApiProperty({
    type: String,
    example: '12345678-1234-1234-1234-123456789012',
    description: 'The user guides id',
  })
  id!: string;

  @IsString()
  @ApiProperty({
    type: String,
    example: 'The Body section',
    description: 'The user guide body',
  })
  body!: string;
}
