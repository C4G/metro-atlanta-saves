import { ApiProperty } from '@nestjs/swagger';
import { YesNoMaybe } from '@mas/prisma-client';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class EnrollDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    example: '12345678-1234-1234-1234-123456789012',
    description: 'The program id to enroll in',
  })
  programId!: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    example: '12345678-1234-1234-1234-123456789012',
    description: 'The users id to enroll in the program',
  })
  userId!: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    example: '1231231234',
    description: 'The users phone number',
  })
  phone!: string;

  @IsString()
  @ApiProperty({
    type: String,
    example: '2024-01-01T00:00:00.000Z',
    description: 'the users birth date',
  })
  birthdate!: string;

  @IsString()
  @ApiProperty({
    type: String,
    example: 'Asian',
    description: 'the users race',
  })
  race!: string;

  @IsString()
  @ApiProperty({
    type: String,
    example: 'Male',
    description: 'the users gender',
  })
  gender!: string;

  @IsString()
  @ApiProperty({
    type: String,
    example: 'Computing 4 Good',
    description: 'the users current place of employment',
  })
  placeOfEmployment!: string;

  @IsString()
  @ApiProperty({
    type: String,
    example: 'Manager',
    description: 'the users current job title',
  })
  jobTitle!: string;

  @IsInt()
  @ApiProperty({
    type: Number,
    example: 24,
    description: 'number of months employed',
  })
  monthsEmployed!: number;

  @IsInt()
  @ApiProperty({
    type: Number,
    example: 12345,
    description: 'zip code for the user',
  })
  zipCode!: number;

  @IsString()
  @ApiProperty({
    type: String,
    example: 'Atlanta',
    description: 'The county where the user resides',
  })
  address!: string;

  @IsInt()
  @ApiProperty({
    type: Number,
    example: 60_000,
    description: 'The users annual salary',
  })
  annualIncome!: number;

  @IsOptional()
  @IsEnum(YesNoMaybe)
  @ApiProperty({
    required: false,
    example: 'Yes',
    enum: YesNoMaybe,
    description: 'The users willingness to go to meetings',
  })
  meetingAvailablility?: YesNoMaybe;

  @IsOptional()
  @IsEnum(YesNoMaybe)
  @ApiProperty({
    required: false,
    example: 'Yes',
    enum: YesNoMaybe,
    description: 'Will the employer allow the user to attend meetings',
  })
  employerCommitted?: YesNoMaybe;

  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    type: String,
    example: 'I am interested because I want to save money',
    description: 'The reasons the user is interested in the program',
  })
  interest?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    type: String,
    example: 'I want to gain savings knowledge',
    description: 'What the user hopes to gain from the program',
  })
  gain?: string;
}
