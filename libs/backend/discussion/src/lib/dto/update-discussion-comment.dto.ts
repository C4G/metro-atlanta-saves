import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateDiscussionCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50000)
  @ApiProperty({ type: String, description: 'Updated body of the comment or reply' })
  body!: string;
}
