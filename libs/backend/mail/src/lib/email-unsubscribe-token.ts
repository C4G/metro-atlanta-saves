import { createHmac, timingSafeEqual } from 'node:crypto';

const TOKEN_VERSION = 'v1';

export function createEmailUnsubscribeToken(email: string, secret: string): string {
  const payload = Buffer.from(email, 'utf8').toString('base64url');
  const unsignedToken = `${TOKEN_VERSION}.${payload}`;
  const signature = createHmac('sha256', secret).update(unsignedToken).digest('base64url');
  return `${unsignedToken}.${signature}`;
}

export function readEmailUnsubscribeToken(token: string, secret: string): string | undefined {
  const [version, payload, signature, ...extra] = token.split('.');
  if (version !== TOKEN_VERSION || !payload || !signature || extra.length > 0) {
    return undefined;
  }

  const unsignedToken = `${version}.${payload}`;
  const expected = createHmac('sha256', secret).update(unsignedToken).digest();
  let supplied: Buffer;
  try {
    supplied = Buffer.from(signature, 'base64url');
  } catch {
    return undefined;
  }
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
    return undefined;
  }

  try {
    const email = Buffer.from(payload, 'base64url').toString('utf8');
    return email.includes('@') ? email : undefined;
  } catch {
    return undefined;
  }
}
