import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export enum TagColor {
  BLUE = 'blue',
  GREEN = 'green',
  RED = 'red',
  ORANGE = 'orange',
  PURPLE = 'purple',
  YELLOW = 'yellow',
}

export class CreateDiscussionTagDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @ApiProperty({
    type: String,
    example: 'budgeting',
    description: 'The tag name',
  })
  name!: string;

  @IsOptional()
  @IsEnum(TagColor)
  @ApiProperty({
    enum: TagColor,
    example: 'blue',
    description: 'The tag background color',
  })
  color?: TagColor = TagColor.BLUE;
}
