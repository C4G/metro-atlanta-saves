import { IsEmail, IsNotEmpty, IsOptional, IsString, Validate } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@mas/prisma-client';

function isValidRoles(value: Role) {
  const validValues = [Role.Administrator, Role.Partner_Staff];
  return value === undefined || validValues.includes(value); // Check if value is undefined or in the list of valid values
}

export class CreateUserDto {
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

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    type: String,
    example: 'I am a user and I rock!',
    default: undefined,
    description: 'The users bio for their profile',
  })
  bio?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    type: String,
    example: '12345678-1234-1234-1234-123456789012',
    default: undefined,
    description: 'The partnerId of the user to link to a partner',
  })
  partnerId?: string;

  @IsOptional()
  @IsString()
  @Validate(isValidRoles, { each: true })
  @ApiPropertyOptional({
    enum: Role,
    default: undefined,
    enumName: 'Role',
    description: 'The role of the user',
    example: Role.Partner_Staff,
  })
  role?: Role;
}
