import { IsBoolean, IsISO8601, IsOptional } from 'class-validator';

export class VerifyRequirementDto {
  @IsBoolean()
  verified!: boolean;

  @IsOptional()
  @IsISO8601({ strict: true })
  completedAt?: string;
}
