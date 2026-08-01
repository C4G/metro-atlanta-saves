import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateLearningDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    example: 'My Learning Resource',
    description: 'The title of the learning resource',
  })
  title!: string;

  @IsString()
  @ApiProperty({
    type: String,
    example: 'My Learning Body',
    description: 'The body section of the learning resource',
  })
  body!: string;

  @IsInt()
  @ApiPropertyOptional({
    type: Number,
    default: 999,
    example: 5,
    description: 'The order in which the learning resource should be displayed',
  })
  sequence = 999;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    type: Boolean,
    default: false,
    example: false,
    description: 'Whether the learning item is hidden on the home page',
  })
  hidden?: boolean;
}
