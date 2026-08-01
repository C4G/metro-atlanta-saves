import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdatePeerEvaluationGuideDto {
  @IsString()
  @ApiProperty({
    type: String,
    example: '12345678-1234-1234-1234-123456789012',
    description: 'The peer evaluation guide id',
  })
  id!: string;

  @IsString()
  @ApiProperty({
    type: String,
    example: '<p>Instructions here</p>',
    description: 'The peer evaluation guide body',
  })
  body!: string;
}
