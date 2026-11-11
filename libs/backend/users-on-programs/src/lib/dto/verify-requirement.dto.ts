import { IsBoolean, IsISO8601 } from 'class-validator';

export class VerifyRequirementDto {
  @IsBoolean()
  verified!: boolean;

  @IsISO8601({ strict: true })
  completedAt!: string;
}
