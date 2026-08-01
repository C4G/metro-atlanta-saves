import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateIntroductionDto {
  @IsString()
  @ApiProperty({
    type: String,
    example: '12345678-1234-1234-1234-123456789012',
    description: 'The introductions id',
  })
  id!: string;

  @IsString()
  @ApiProperty({
    type: String,
    example: 'The Title section',
    description: 'The introduction title',
  })
  title!: string;

  @IsString()
  @ApiProperty({
    type: String,
    example: 'The Image Text',
    description: 'The introduction image text',
  })
  imageText!: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    type: String,
    example: 'The Image URL',
    description: 'The introduction image url',
    required: false,
  })
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Whether the hero image section is hidden on the home page',
    required: false,
  })
  hidden?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Whether only the hero image is hidden (section heading still shows)',
    required: false,
  })
  imageHidden?: boolean;
}
