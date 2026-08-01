import { UserFull } from '@mas/models';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  matchRoles(routeRoles: string[], userRole: string): boolean {
    return routeRoles.includes(userRole);
  }

  canActivate(context: ExecutionContext): boolean {
    const routeRoles = this.reflector.get<string[]>('roles', context.getHandler());
    const userRole = (context.switchToHttp().getRequest().user as UserFull).role || '';
    if (!routeRoles) {
      return true;
    }
    return this.matchRoles(routeRoles, userRole);
  }
}
