import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class AuthDto {
  @IsEmail()
  @IsNotEmpty()
  @Transform((param) => param.value.trim().toLowerCase())
  @ApiProperty({
    type: String,
    example: 'test@brpatl.com',
    description: 'The users email',
  })
  email!: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    example: 'password',
    description: 'The users password',
  })
  password!: string;
}
