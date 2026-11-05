import { IsISO8601, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class RecordPaymentDto {
  @Matches(/^(?!0+(\.0+)?$)\d{1,7}(\.\d{1,2})?$/, { message: 'Enter the amount paid, for example 250 or 250.00' })
  amount!: string;

  @IsISO8601({ strict: true })
  paidAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  checkNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  paidBy?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
