import { UserFull } from '@mas/models';
import { User } from '@mas/prisma-client';

export const mapUser = (user: User): UserFull => {
  const { emailUnsubscribedAt, ...safeUser } = user;
  void emailUnsubscribedAt;
  return safeUser;
};
