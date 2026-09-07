import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AddBoardMemberDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    example: 'better-auth-user-id',
  })
  userId!: string;
}
