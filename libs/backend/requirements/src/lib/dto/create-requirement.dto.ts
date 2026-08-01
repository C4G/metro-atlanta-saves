import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRequirementDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    example: 'Requirement Name',
    description: 'The name of the requirement',
  })
  name!: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    type: String,
    example: '12345678-1234-1234-1234-123456789012',
    description: 'The id of the educaational content to be completed for this requirement',
  })
  educationalContentId?: string;
}
