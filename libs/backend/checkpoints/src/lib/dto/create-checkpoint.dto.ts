import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCheckpointDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    example: 'Month 1',
    description: 'The name of the checkpoint',
  })
  name!: string;

  @IsNumber({ maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false })
  @IsOptional()
  @ApiPropertyOptional({
    type: Number,
    example: 100,
    description: 'The amount of money the user has saved so far in the program',
  })
  savedMoney!: number;

  @IsInt()
  @IsOptional()
  @ApiPropertyOptional({
    type: Number,
    example: 740,
    description: 'The users credit score at the time of the checkpoint',
  })
  creditScore!: number;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    type: String,
    example: 'Applied for job at McDonalds',
    description: 'The users application status',
  })
  application?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    example: '12345678-1234-1234-1234-123456789012',
    description: 'The users id',
  })
  userId!: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    example: '12345678-1234-1234-1234-123456789012',
    description: 'The programs id',
  })
  programId!: string;
}
