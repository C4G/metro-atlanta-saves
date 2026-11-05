import { ForbiddenException } from '@nestjs/common';

jest.mock('@mas/backend-prisma', () => ({ PrismaService: class {} }));
jest.mock('@mas/backend-shared', () => ({
  ...jest.requireActual('../../../shared/src/lib/util/validate-user-any-role'),
  ...jest.requireActual('../../../shared/src/lib/util/validate-user-is-admin-or-staff'),
  ...jest.requireActual('../../../shared/src/lib/util/decorator/role.decorator'),
  ...jest.requireActual('../../../shared/src/lib/util/guard/role.guard'),
  ...jest.requireActual('../../../shared/src/lib/util/is-user-admin'),
  ManagedSessionGuard: class {},
}));
import { ProgramsController } from './programs.controller';

describe('Changing a program partner', () => {
  const update = jest.fn();
  const controller = new ProgramsController({
    findOne: jest.fn().mockResolvedValue({ partnerId: 'partner-1' }),
    update,
  } as never);
  const request = (role: string) => ({ user: { id: 'user-1', role, partnerId: 'partner-1' } }) as never;

  beforeEach(() => update.mockReset());

  it('lets administrators move a program to another partner', async () => {
    await controller.update(request('Administrator'), 'program-1', { partnerId: 'partner-2' });
    expect(update).toHaveBeenCalledWith('program-1', { partnerId: 'partner-2' });
  });

  it('stops partner staff from moving their program to another partner', async () => {
    await expect(
      controller.update(request('Partner_Staff'), 'program-1', { partnerId: 'partner-2' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(update).not.toHaveBeenCalled();
  });

  it('lets partner staff save other settings with their own partner', async () => {
    await controller.update(request('Partner_Staff'), 'program-1', { partnerId: 'partner-1', name: 'Pilot' });
    expect(update).toHaveBeenCalled();
  });
});
