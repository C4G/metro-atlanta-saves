import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCohortDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    example: 'Cohort Name',
    description: 'The name of the cohort',
  })
  name!: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    example: 'Cohort Description',
    description: 'The description for the cohort',
  })
  description!: string;
}
