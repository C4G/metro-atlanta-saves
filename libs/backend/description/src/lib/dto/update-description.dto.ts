import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateDescriptionDto {
  @IsString()
  @ApiProperty({
    type: String,
    example: '12345678-1234-1234-1234-123456789012',
    description: 'The descriptions id',
  })
  id!: string;

  @IsString()
  @ApiProperty({
    type: String,
    example: 'The Title section',
    description: 'The description title',
  })
  title!: string;

  @IsString()
  @ApiProperty({
    type: String,
    example: 'The Body section',
    description: 'The description body',
  })
  body!: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    type: String,
    example: 'Apply Now',
    description: 'The text that appears on the button',
    required: false,
  })
  buttonText?: string;

  @IsOptional()
  @IsUrl()
  @ApiProperty({
    type: String,
    example: 'https://www.brpatl.com/apply',
    description: 'The link the user will be taken to on button click',
    required: false,
  })
  buttonLink?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    type: String,
    example: '/api/description/logo/logo.webp',
    description: 'The logo image URL',
    required: false,
  })
  logoUrl?: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Whether the description section is hidden on the home page',
    required: false,
  })
  hidden?: boolean;
}
