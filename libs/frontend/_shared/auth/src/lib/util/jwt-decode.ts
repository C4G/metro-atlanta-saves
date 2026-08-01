import type { Role } from '@prisma/client';
import type { UserFull } from '@mas/models';

export interface JwtPayload {
  id: string;
  createdAt: string;
  updatedAt: string;
  lastLogin: string | null;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  partnerId: string | null;
  bio: string | null;
  iat?: number;
  exp?: number;
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Converts JWT payload to a partial user object with proper type conversions
 */
export function jwtPayloadToUserData(payload: JwtPayload): UserFull {
  return {
    id: payload.id,
    createdAt: new Date(payload.createdAt),
    updatedAt: new Date(payload.updatedAt),
    lastLogin: payload.lastLogin ? new Date(payload.lastLogin) : null,
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email,
    role: payload.role,
    partnerId: payload.partnerId,
    bio: payload.bio,
  };
}
