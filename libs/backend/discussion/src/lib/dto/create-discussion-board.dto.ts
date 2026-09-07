import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateDiscussionBoardDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @ApiProperty({
    type: String,
    example: 'Test Program - Cohort 1 Discussion',
  })
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  @ApiPropertyOptional({
    type: String,
    example: 'Discussion board for Test Program Cohort 1 members',
  })
  description?: string;

  @IsUUID()
  @IsOptional()
  @ApiPropertyOptional({
    type: String,
    example: 'program-uuid',
  })
  programId?: string;

  @IsUUID()
  @IsOptional()
  @ApiPropertyOptional({
    type: String,
    example: 'cohort-uuid',
  })
  cohortId?: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiPropertyOptional({
    type: [String],
    example: ['better-auth-user-id-1', 'better-auth-user-id-2'],
  })
  memberIds?: string[];
}
