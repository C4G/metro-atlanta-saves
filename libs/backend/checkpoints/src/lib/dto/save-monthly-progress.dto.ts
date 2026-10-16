import { IsInt, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class SaveMonthlyProgressDto {
  @IsNumber({ maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false })
  @Min(0)
  savedMoney!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  creditScore?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  application?: string | null;
}
