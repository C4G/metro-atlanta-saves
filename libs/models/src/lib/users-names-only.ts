import { User } from '@mas/prisma-client/browser';

export type UsersNamesOnly = Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>;
