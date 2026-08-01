import { User } from '@prisma/client';

export type UsersNamesOnly = Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>;
