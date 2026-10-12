import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsJSON, IsOptional, IsString } from 'class-validator';

export class UpdateWhatWeAreDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    type: String,
    example: '12345678-1234-1234-1234-123456789012',
    description: 'The id',
    required: false,
  })
  id?: string;

  @IsString()
  @ApiProperty({ type: String, example: 'Who we are' })
  eyebrow!: string;

  @IsString()
  @ApiProperty({ type: String, example: 'Atlanta nonprofits working together' })
  title!: string;

  @IsString()
  @ApiProperty({
    type: String,
    example: 'Building Resilient Professionals is a coalition...',
    description: 'The Who We Are description',
  })
  whoWeAreDescription!: string;

  @IsString()
  @ApiProperty({
    type: String,
    example: 'Our goal is to initiate pilot programs...',
    description: 'The What We Do description',
  })
  whatWeDoDescription!: string;

  @IsString()
  @ApiProperty({ type: String, example: 'Learn more about us' })
  buttonText!: string;

  @IsString()
  @ApiProperty({ type: String, example: '/about-us' })
  buttonLink!: string;

  @IsJSON()
  @IsString()
  @ApiProperty({ type: String, description: 'JSON-encoded partner organizations' })
  partnersJson!: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Whether the Who We Are section is hidden on the home page',
    required: false,
  })
  hidden?: boolean;
}
