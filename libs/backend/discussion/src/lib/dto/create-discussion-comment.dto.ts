import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateDiscussionCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50000)
  @ApiProperty({
    type: String,
    example: 'I use a fixed baseline and then add extra in high-income months.',
    description: 'The text body of a comment',
  })
  body!: string;

  @IsUUID()
  @IsOptional()
  @ApiProperty({
    type: String,
    example: 'uuid-of-parent-comment',
    description: 'Optional: ID of the parent comment if this is a reply',
  })
  parentCommentId?: string;
}
