import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUsersOnProgramsDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    example: '12345678-1234-1234-1234-123456789012',
    description: 'The userId of the user to be added to the program',
  })
  userId!: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    example: '12345678-1234-1234-1234-123456789012',
    description: 'The programId of the program the user is being added to',
  })
  programId!: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  @ApiPropertyOptional({
    type: String,
    isArray: true,
    example: ['12345678-1234-1234-1234-123456789012'],
    description: 'The ids of the requirements the user has completed',
  })
  requirementStatus?: string[];

  @IsBoolean()
  @ApiPropertyOptional({
    type: Boolean,
    default: false,
    description: 'If the user is married',
  })
  married?: boolean;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    type: String,
    example: 'High school',
    description: 'Education status of the user',
  })
  educationStatus?: string;

  @IsBoolean()
  @ApiPropertyOptional({
    type: Boolean,
    default: false,
    description: 'If the user is in the military',
  })
  militaryStatus?: boolean;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    type: String,
    example: 'Home Depot',
    description: 'The users place of employment',
  })
  placeOfEmployment?: string;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({
    type: Number,
    example: 48000,
    description: 'The users annual income',
  })
  annualIncome?: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({
    type: Number,
    example: 600,
    description: 'The total amount the user has been paid out',
  })
  totalAmountPaidOut?: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({
    type: Number,
    example: 24,
    description: 'The number of months the user has been employed',
  })
  monthsEmployed?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    type: String,
    example: '123 N Main St',
    description: 'The users address',
  })
  address?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    type: String,
    example: '2024-01-01T00:00:00.000Z',
    description: 'The start date for the user in the program',
  })
  start?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    type: String,
    example: '2024-01-01T00:00:00.000Z',
    description: 'The end date for the user in the program',
  })
  end?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    type: String,
    example: '1985-01-01T00:00:00.000Z',
    description: 'The users date of birth',
  })
  birthdate?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    type: String,
    example: '2024-01-01T00:00:00.000Z',
    description: 'The date the user was paid from the program',
  })
  paidDate?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    type: String,
    example: '123-123-1234',
    description: 'The users phone number',
  })
  phone?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    type: String,
    example: 'Male',
    description: 'The users gender',
  })
  gender?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    type: String,
    example: 'White',
    description: 'The users race',
  })
  race?: string;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    type: Boolean,
    default: false,
    description: 'Did the user receive a credit score incentive',
  })
  creditScoreIncentive?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    type: Boolean,
    default: false,
    description: 'Did the user graduate from the program',
  })
  graduated?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    type: Boolean,
    default: false,
    description: 'Is the user currently in-active in the program',
  })
  inactive?: boolean;
}
