import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateDiscussionBoardDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  @ApiPropertyOptional({
    type: String,
    example: 'Updated Board Name',
  })
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  @ApiPropertyOptional({
    type: String,
    example: 'Updated description',
  })
  description?: string;
}
