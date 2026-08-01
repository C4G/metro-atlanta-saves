import { UserFull } from '@mas/models';

export const isUserParterStaff = (req: Request & { user: UserFull }) => req.user.role === 'Partner_Staff';
