## Why

The application currently uses long-lived, client-readable JWTs containing copied user data, with authentication, password reset, and impersonation implemented across custom NestJS and Angular code. Migrating to Better Auth will provide server-managed sessions, session revocation, and a maintained authentication flow while preserving existing users' Argon2 passwords.

## What Changes

- Add Better Auth to the NestJS backend using the existing PostgreSQL/Prisma database.
- Preserve existing user IDs, profile data, application roles, partner relationships, and Argon2 password credentials.
- Add Better Auth session, credential-account, verification, and impersonation persistence as needed.
- Replace the legacy JWT guard with a Better Auth session guard for protected API routes.
- Replace browser-side JWT decoding and `accessToken`/`originalToken` cookies with Better Auth session handling.
- Preserve email/password sign-in, registration, password reset, profile updates, and application role checks.
- Add session-based impersonation with these authorization rules:
  - `Administrator` users may impersonate any permitted target.
  - `Partner_Staff` users may impersonate other `Partner_Staff` users for the same partner, or regular users enrolled in at least one program owned by their partner.
  - `Partner_Staff` users may not impersonate administrators or partner staff from another partner.
  - Other users may not impersonate anyone.
- **BREAKING**: Existing JWT access tokens and cookies will no longer authenticate after cutover; users will sign in again.
- **BREAKING**: Authentication endpoints and cookie behavior may change to Better Auth conventions unless compatibility wrappers are retained.
- Retire the legacy JWT secret, signing service, Passport JWT strategy, and custom token cookies after the cutover is verified.

## Capabilities

### New Capabilities

- `authentication/better-auth`: Better Auth sessions, credential migration, application authorization, and scoped user impersonation.

### Modified Capabilities

None. The repository has no existing OpenSpec capability specifications.

## Impact

- Backend auth module, NestJS request guards, role handling, auth endpoints, mail/password-reset integration, and impersonation behavior.
- Prisma user schema and migrations, including Better Auth core tables and credential-account records.
- Angular auth store, route guards, HTTP interceptors, SSR cookie forwarding, and impersonation UI state.
- Runtime configuration and deployment secrets, including a new Better Auth secret and removal of legacy JWT configuration after migration.
- Protected API behavior across the controllers currently using the legacy JWT guard.
