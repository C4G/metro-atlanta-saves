import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class AddBoardMemberDto {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    example: 'user-uuid',
  })
  userId!: string;
}
