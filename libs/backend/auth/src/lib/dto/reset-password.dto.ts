import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail()
  @IsNotEmpty()
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
    description: 'The users new password',
  })
  password!: string;

  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    example: '12345678-1234-1234-1234-123456789012',
    description: 'The token generated and sent in the email query param',
  })
  token!: string;
}
