import { PartialType } from '@nestjs/swagger';
import { CreateUsersOnProgramsDto } from './create-users-on-programs.dto';

export class UpdateUsersOnProgramsDto extends PartialType(CreateUsersOnProgramsDto) {}
