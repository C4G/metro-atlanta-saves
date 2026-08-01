import { UserFull } from '@mas/models';
import { User } from '@prisma/client';

export const mapUser = (user: User): UserFull => {
  const { hash, forgot, ...newUser } = user;
  return newUser;
};
