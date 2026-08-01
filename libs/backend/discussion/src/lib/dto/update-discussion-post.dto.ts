import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateDiscussionPostDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  @ApiProperty({ type: String, description: 'Updated title of the post' })
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50000)
  @ApiProperty({ type: String, description: 'Updated body of the post' })
  body!: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @ApiProperty({ type: [String], description: 'Tag IDs to assign to the post', required: false })
  tagIds?: string[];
}
