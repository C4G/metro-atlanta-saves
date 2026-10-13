import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
    example: 'Attend the in-person meetup and check in with the program coordinator.',
    description: 'Instructions for an action the learner can manually mark as complete',
  })
  actionInstructions?: string | null;

  @IsDateString()
  @IsOptional()
  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    example: '2026-11-15T23:59:00.000Z',
    description: 'The shared due timestamp for this requirement across the program',
  })
  dueAt?: string | null;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    type: String,
    example: '12345678-1234-1234-1234-123456789012',
    description: 'The id of the educaational content to be completed for this requirement',
  })
  educationalContentId?: string;
}
