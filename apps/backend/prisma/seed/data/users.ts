import { PrismaClient, Role } from '@mas/prisma-client';
import * as argon from 'argon2';

export const seedUsers = async (prisma: PrismaClient) => {
  const hasData = await prisma.user.count();
  if (hasData) {
    console.log('No users seeded');
    return;
  }
  const hashedPassword = await argon.hash('P@ssw0rd123!');
  const data = await prisma.user.createMany({
    data: [
      {
        firstName: 'Admin',
        lastName: 'Test',
        email: 'admin@test.com',
        hash: hashedPassword,
        role: Role.Administrator,
        bio: 'I am an administrator!',
      },
      {
        firstName: 'Org',
        lastName: 'Test',
        email: 'org@test.com',
        hash: hashedPassword,
        role: Role.Administrator,
        bio: 'I am an administrator!',
      },
      {
        firstName: 'Partner',
        lastName: 'Test',
        email: 'partner@test.com',
        hash: hashedPassword,
        role: Role.Partner_Staff,
        bio: 'I am a partner staff member!',
      },
      {
        firstName: 'Basic',
        lastName: 'Test',
        email: 'basic@test.com',
        hash: hashedPassword,
        bio: 'I am a basic user with no role!',
      },
    ],
  });
  console.log('Users added: ', { data });

  // Create Better Auth Account records so credentials work via /api/auth/sign-in/email.
  // Better Auth stores passwords in the `accounts` table, not the `users` table.
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  for (const user of users) {
    await prisma.account.create({
      data: {
        userId: user.id,
        accountId: user.id,
        providerId: 'credential',
        issuer: 'credential',
        password: hashedPassword,
      },
    });
  }
  console.log('Better Auth accounts created for seeded users.');
};
