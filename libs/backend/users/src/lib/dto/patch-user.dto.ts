import { IsString } from 'class-validator';
import { CreateUserDto } from './create-user.dto';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class PatchUserDto extends PartialType(CreateUserDto) {
  @IsString()
  @ApiProperty({
    type: String,
    example: '12345678-1234-1234-1234-123456789012',
    description: 'The users id',
  })
  id!: string;
}
