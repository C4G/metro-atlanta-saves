import { PrismaClient, Role } from '@mas/prisma-client';
import * as argon from 'argon2';

export const seedUsers = async (prisma: PrismaClient) => {
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
    const userData = {
      ...data,
      name: `${data.firstName} ${data.lastName}`,
      emailVerified: true,
    };
    const user = await prisma.user.upsert({
      where: { email: data.email },
      create: userData,
      update: userData,
    });
    await prisma.account.upsert({
      where: {
        account_issuer_accountId_uidx: {
          issuer: 'local:credential',
          accountId: user.id,
        },
      },
      create: {
        issuer: 'local:credential',
        accountId: user.id,
        providerId: 'credential',
        userId: user.id,
        password,
      },
      update: { providerId: 'credential', userId: user.id, password },
    });
  }
  console.log('Users ensured: ', { count: users.length });
};
