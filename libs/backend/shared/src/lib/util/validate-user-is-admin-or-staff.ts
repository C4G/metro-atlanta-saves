import { UserFull } from '@mas/models';

export const validateUserIsAdminOrStaff = (req: Request & { user: UserFull }) =>
  req.user.role === 'Administrator' || req.user.role === 'Partner_Staff';
