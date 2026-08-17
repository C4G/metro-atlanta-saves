import { SetMetadata } from '@nestjs/common';
import type { Role } from '@mas/prisma-client';

export const Roles = (...args: Role[]) => SetMetadata('roles', args);
