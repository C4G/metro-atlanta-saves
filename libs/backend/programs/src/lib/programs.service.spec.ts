import { PrismaService } from '@mas/backend-prisma';
import { Test } from '@nestjs/testing';

import { ProgramsService } from './programs.service';

describe('ProgramsService', () => {
  const findMany = jest.fn();
  let service: ProgramsService;

  beforeEach(async () => {
    findMany.mockReset();
    const module = await Test.createTestingModule({
      providers: [
        ProgramsService,
        {
          provide: PrismaService,
          useValue: { program: { findMany } },
        },
      ],
    }).compile();

    service = module.get(ProgramsService);
  });

  it('searches program names and descriptions case-insensitively', async () => {
    findMany.mockResolvedValue([]);

    await service.findAllForPartner('partner-1', ' savings ');

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          partnerId: 'partner-1',
          OR: [
            { name: { contains: 'savings', mode: 'insensitive' } },
            { description: { contains: 'savings', mode: 'insensitive' } },
          ],
        },
      }),
    );
  });

  it('does not add search conditions for an empty term', async () => {
    findMany.mockResolvedValue([]);

    await service.findAll('   ');

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
  });
});
