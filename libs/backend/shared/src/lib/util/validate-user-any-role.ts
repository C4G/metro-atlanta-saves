import { UserFull } from '@mas/models';

export const validateUserAnyRole = (req: Request & { user: UserFull }, id: string) =>
  req.user.role !== 'Administrator' && req.user.partnerId !== id;
