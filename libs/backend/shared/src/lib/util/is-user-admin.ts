import { UserFull } from '@mas/models';

export const isUserAdmin = (req: Request & { user: UserFull }) => req.user.role === 'Administrator';
