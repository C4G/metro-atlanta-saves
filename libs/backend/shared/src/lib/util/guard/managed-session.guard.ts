import { PrismaService } from '@mas/backend-prisma';
import { UserFull } from '@mas/models';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService as BetterAuthService } from '@thallesp/nestjs-better-auth';
import { fromNodeHeaders } from 'better-auth/node';
import { mapUser } from '../map-user';

type ManagedRequest = {
  headers: Record<string, string | string[] | undefined>;
  user?: UserFull;
  session?: unknown;
};

@Injectable()
export class ManagedSessionGuard implements CanActivate {
  constructor(
    private readonly betterAuth: BetterAuthService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ManagedRequest>();
    const session = await this.betterAuth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });

    if (!session) {
      throw new UnauthorizedException('Authentication required');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    request.user = mapUser(user);
    request.session = session;
    return true;
  }
}
