import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDiscussionPostDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  @ApiProperty({
    type: String,
    example: 'How do you budget for variable income months?',
    description: 'The discussion post title',
  })
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50000)
  @ApiProperty({
    type: String,
    example: 'I have a different income each month. What has worked for everyone else?',
    description: 'The body text of the discussion post',
  })
  body!: string;

  @IsArray()
  @IsOptional()
  @ApiProperty({
    type: [String],
    example: ['finances', 'budgeting'],
    description: 'Array of tag IDs to associate with this post',
  })
  tagIds?: string[];

  @IsBoolean()
  @IsOptional()
  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Whether this post is an announcement (only admins can set this to true)',
  })
  isAnnouncement?: boolean;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'When true, sends an email notification to all enrolled users (announcements only)',
  })
  sendEmailNotification?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(50000)
  @ApiProperty({
    type: String,
    example: 'Please read this important announcement...',
    description: 'Optional custom body for the email notification. Falls back to the post body if omitted.',
  })
  emailBody?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    type: String,
    example: 'https://brpatl.com/discussion/abc123',
    description: 'The board URL from the client, used as the link in the email notification.',
  })
  boardUrl?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    type: String,
    example: 'a1b2c3d4-...',
    description: 'Pre-generated UUID from the client to use as the post ID.',
  })
  postId?: string;
}
