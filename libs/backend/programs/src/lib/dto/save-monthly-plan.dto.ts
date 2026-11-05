import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export const MAX_PROGRAM_MONTHS = 36;

export class MonthAssignmentDto {
  @IsString()
  @ApiProperty({ type: String })
  requirementId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_PROGRAM_MONTHS)
  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'The 1-based month, or null to leave the task unscheduled',
  })
  month!: number | null;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @ApiPropertyOptional({ type: String, description: 'A new name for the task' })
  name?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true, description: 'A new due date, or null' })
  dueAt?: string | null;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ type: String, nullable: true, description: 'Learning content to attach, or null' })
  educationalContentId?: string | null;
}

export class NewPlanTaskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @ApiProperty({ type: String, example: 'Upload bank statement' })
  name!: string;

  @IsInt()
  @Min(1)
  @Max(MAX_PROGRAM_MONTHS)
  @ApiProperty({ type: Number, example: 2, description: 'The 1-based month the task belongs to' })
  month!: number;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  dueAt?: string | null;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ type: String, nullable: true })
  educationalContentId?: string | null;
}

export class SaveMonthlyPlanDto {
  @IsInt()
  @Min(1)
  @Max(MAX_PROGRAM_MONTHS)
  @ApiProperty({ type: Number, example: 6, description: 'How many months the program runs' })
  months!: number;

  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => MonthAssignmentDto)
  @ApiProperty({ type: [MonthAssignmentDto] })
  assignments!: MonthAssignmentDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => NewPlanTaskDto)
  @ApiPropertyOptional({ type: [NewPlanTaskDto], description: 'Tasks to create as part of the plan' })
  newTasks?: NewPlanTaskDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  @IsString({ each: true })
  @ApiPropertyOptional({ type: [String], description: 'Tasks to delete from the program' })
  removedRequirementIds?: string[];
}
