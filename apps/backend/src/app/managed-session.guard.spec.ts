import { ExecutionContext } from '@nestjs/common';
import { AuthService as BetterAuthService } from '@thallesp/nestjs-better-auth';
import { PrismaService } from '@mas/backend-prisma';
import { ManagedSessionGuard } from '@mas/backend-shared';

describe('ManagedSessionGuard', () => {
  it('loads the current application user from the managed session identity', async () => {
    const request = { headers: { cookie: 'better-auth.session_token=session-token' } } as any;
    const auth = {
      api: {
        getSession: jest.fn().mockResolvedValue({
          user: { id: 'user-1' },
          session: { id: 'session-1' },
        }),
      },
    } as unknown as BetterAuthService;
    const user = {
      id: 'user-1',
      email: 'user@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'Partner_Staff',
      partnerId: 'partner-1',
      hash: 'legacy-hash',
      forgot: null,
    } as any;
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue(user) },
    } as unknown as PrismaService;
    const guard = new ManagedSessionGuard(auth, prisma);
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(auth.api.getSession).toHaveBeenCalled();
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-1' } });
    expect(request.user).toMatchObject({ id: 'user-1', role: 'Partner_Staff', partnerId: 'partner-1' });
    expect(request.session).toMatchObject({ session: { id: 'session-1' }, user: { id: 'user-1' } });
  });

  it('rejects a missing managed session', async () => {
    const auth = {
      api: { getSession: jest.fn().mockResolvedValue(null) },
    } as unknown as BetterAuthService;
    const prisma = {} as PrismaService;
    const guard = new ManagedSessionGuard(auth, prisma);
    const context = {
      switchToHttp: () => ({ getRequest: () => ({ headers: {} }) }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).rejects.toThrow('Authentication required');
  });
});
