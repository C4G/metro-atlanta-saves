import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class SaveFrequentTaskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @ApiProperty({ type: String, example: 'Upload bank statement' })
  name!: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ type: String, nullable: true, description: 'Learning content the task links to' })
  educationalContentId?: string | null;
}
