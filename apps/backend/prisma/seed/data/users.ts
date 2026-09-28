import { PrismaClient, Role } from '@mas/prisma-client';
import * as argon from 'argon2';

export const seedUsers = async (prisma: PrismaClient) => {
  const hasData = await prisma.user.count();
  if (hasData) {
    console.log('No users seeded');
    return;
  }

  const password = await argon.hash('P@ssw0rd123!');
  const users = [
    {
      firstName: 'Admin',
      lastName: 'Test',
      email: 'admin@test.com',
      role: Role.Administrator,
      bio: 'I am an administrator!',
    },
    {
      firstName: 'Org',
      lastName: 'Test',
      email: 'org@test.com',
      role: Role.Administrator,
      bio: 'I am an administrator!',
    },
    {
      firstName: 'Partner',
      lastName: 'Test',
      email: 'partner@test.com',
      role: Role.Partner_Staff,
      bio: 'I am a partner staff member!',
    },
    {
      firstName: 'Basic',
      lastName: 'Test',
      email: 'basic@test.com',
      bio: 'I am a basic user with no role!',
    },
  ];

  for (const data of users) {
    const user = await prisma.user.create({
      data: { ...data, name: `${data.firstName} ${data.lastName}`, emailVerified: true },
    });
    await prisma.account.create({
      data: {
        issuer: 'local:credential',
        accountId: user.id,
        providerId: 'credential',
        userId: user.id,
        password,
      },
    });
  }

  console.log('Users added: ', { count: users.length });
};
