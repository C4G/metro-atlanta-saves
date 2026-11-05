import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateUsersOnProgramsDto } from './create-users-on-programs.dto';

describe('CreateUsersOnProgramsDto', () => {
  it('accepts adding someone with only the person and program, leaving the rest to defaults', async () => {
    const dto = plainToInstance(CreateUsersOnProgramsDto, { userId: 'person-1', programId: 'program-1' });
    expect(await validate(dto)).toEqual([]);
  });

  it('still checks the optional details when they are sent', async () => {
    const dto = plainToInstance(CreateUsersOnProgramsDto, {
      userId: 'person-1',
      programId: 'program-1',
      married: 'yes',
      requirementStatus: [1],
    });
    expect((await validate(dto)).map(({ property }) => property).sort()).toEqual(['married', 'requirementStatus']);
  });
});
