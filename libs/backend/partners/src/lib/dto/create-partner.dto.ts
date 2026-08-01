import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreatePartnerDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    example: 'Partner Organization',
    description: 'The partners name',
  })
  name!: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    type: String,
    example: '123 N Main St',
    description: 'The partners address',
  })
  address?: string;

  @IsOptional()
  @IsUrl()
  @ApiPropertyOptional({
    type: String,
    example: 'https://www.twitter.com/brpatl',
    description: 'The partners twitter url',
  })
  twitter?: string;

  @IsOptional()
  @IsUrl()
  @ApiPropertyOptional({
    type: String,
    example: 'https://www.facebook.com/brpatl',
    description: 'The partners facebook url',
  })
  facebook?: string;

  @IsOptional()
  @IsUrl()
  @ApiPropertyOptional({
    type: String,
    example: 'https://www.linkedin.com/brpatl',
    description: 'The partners linkedin url',
  })
  linkedIn?: string;

  @IsOptional()
  @IsUrl()
  @ApiPropertyOptional({
    type: String,
    example: 'https://www.tiktok.com/brpatl',
    description: 'The partners tiktok url',
  })
  tiktok?: string;

  @IsOptional()
  @IsUrl()
  @ApiPropertyOptional({
    type: String,
    example: 'https://www.brpatl.com',
    description: 'The partners website url',
  })
  website?: string;
}
