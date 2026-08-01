import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SignUpDto {
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

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    example: 'Firstname',
    description: 'The users first name',
  })
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    example: 'Lastname',
    description: 'The users last name',
  })
  lastName!: string;
}
