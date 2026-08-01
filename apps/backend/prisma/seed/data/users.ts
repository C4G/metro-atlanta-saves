import { PrismaClient, Role } from '@prisma/client';
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
};
