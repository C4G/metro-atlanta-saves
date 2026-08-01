import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAlliesOnProgramsDto {
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
}
