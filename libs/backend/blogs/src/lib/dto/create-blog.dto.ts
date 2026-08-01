import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBlogDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    example: 'Blog Title',
    description: 'the title of the blog',
  })
  title!: string;

  @IsString()
  @ApiProperty({
    type: String,
    example: 'This is the body of my blog post',
    description: 'the body section of the blog',
  })
  body!: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    type: String,
    example: 'Blog subtitle',
    description: 'the sub title section of the blog',
  })
  subTitle?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    type: String,
    example: 'my-blog-slug',
    description: 'The slug for the blog - this is auto generated from the title if not provided',
  })
  slug?: string;
}
