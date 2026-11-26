import { createEmailUnsubscribeToken, readEmailUnsubscribeToken } from './email-unsubscribe-token';

describe('email unsubscribe tokens', () => {
  const secret = 'a-test-unsubscribe-secret-that-is-at-least-32-bytes';

  it('round-trips an email address using a signed token', () => {
    const token = createEmailUnsubscribeToken('member@example.com', secret);

    expect(readEmailUnsubscribeToken(token, secret)).toBe('member@example.com');
  });

  it('rejects a token signed with a different secret or a modified payload', () => {
    const token = createEmailUnsubscribeToken('member@example.com', secret);
    const [, payload, signature] = token.split('.');

    expect(readEmailUnsubscribeToken(token, `${secret}-wrong`)).toBeUndefined();
    expect(readEmailUnsubscribeToken(`v1.${payload}.${signature.slice(0, -1)}x`, secret)).toBeUndefined();
  });

  it.each(['', 'v2.payload.signature', 'v1..signature', 'v1.payload.', 'v1.payload.signature.extra'])(
    'rejects malformed token %s',
    (token) => {
      expect(readEmailUnsubscribeToken(token, secret)).toBeUndefined();
    },
  );
});
