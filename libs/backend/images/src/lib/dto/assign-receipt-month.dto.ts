import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

export class AssignReceiptMonthDto {
  @IsInt()
  @Min(1)
  @Max(36)
  @ApiProperty({ type: Number, example: 2, description: 'The 1-based program month to file the receipt under' })
  month!: number;
}
