import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CheckpointName } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

function IsAfterStartDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isAfterStartDate',
      target: (object as any).constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: string, args: ValidationArguments) {
          const startDate = (args.object as any).startDate;
          if (!value || !startDate) return true;
          return new Date(value) > new Date(startDate);
        },
        defaultMessage() {
          return 'End date must be after start date';
        },
      },
    });
  };
}

export class CreateProgramDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    example: 'Program Name',
    description: 'The name of the program',
  })
  name!: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    example: 'Program description',
    description: 'The description of the program',
  })
  description!: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    example: '12345678-1234-1234-1234-123456789012',
    description: 'The partner organization id that is running the program',
  })
  partnerId!: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    type: String,
    example: '2024-01-01T00:00:00.000Z',
    description: 'the start date of the program',
  })
  startDate?: string;

  @IsAfterStartDate()
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    type: String,
    example: '2024-01-01T00:00:00.000Z',
    description: 'the end date of the program',
  })
  endDate?: string;

  @IsArray()
  @IsOptional()
  @ApiPropertyOptional({
    type: String,
    example: [{ name: 'Month 1' }],
    description: 'list of checkpoint names',
  })
  checkpointNames?: CheckpointName[];

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({
    type: Boolean,
    example: false,
    description: 'Whether this program is a template that can be cloned',
  })
  isTemplate?: boolean;
}
