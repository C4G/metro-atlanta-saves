import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateStoryDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    example: 'Story title',
    description: 'The title for the story',
  })
  name!: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    example: 'Story description',
    description: 'The description for the story',
  })
  description!: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Whether the story is hidden on the home page',
    required: false,
  })
  hidden?: boolean;
}
