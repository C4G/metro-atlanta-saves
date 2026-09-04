## Context

The application is an Nx workspace containing a NestJS API, an Angular SSR frontend, and a PostgreSQL database accessed through Prisma 7. The current authentication system signs the complete application user with a one-year JWT, validates only the bearer token payload, and stores the token in browser-readable `accessToken` and `originalToken` cookies. Protected controllers share a JWT guard and a role guard. The current impersonation endpoint accepts a target email but does not receive or authorize against the requesting user; candidate filtering exists in the user-list service but is not a security boundary.

The existing `users` table is referenced by many application tables. It contains separate first and last names, an optional application role (`Administrator` or `Partner_Staff`), an optional `partnerId`, and an Argon2 password hash in `hash`. Program membership is represented by `UsersOnPrograms`, joined to `Program`, which owns a `partnerId`.

## Goals / Non-Goals

**Goals:**

- Adopt Better Auth's server-managed database sessions and preserve existing user identities and passwords.
- Make the cutover explicit: old JWTs are rejected and users sign in again.
- Keep application authorization based on the existing domain roles and partner relationships.
- Provide auditable session-based impersonation with a strict partner-program boundary for Partner Staff.
- Preserve SSR, same-origin production routing, password reset, and existing protected API behavior.

**Non-Goals:**

- Preserving or exchanging existing JWT sessions.
- Replacing the application's domain roles with a generic authorization model.
- Granting Partner Staff global Better Auth administrative privileges.
- Introducing social login, passkeys, organizations, or other authentication methods as part of this migration.

## Decisions

### Use database-backed sessions rather than Better Auth JWTs

Use Better Auth's primary session mechanism with an HttpOnly session cookie. Better Auth's JWT plugin is intended for issuing separate JWKS-verifiable tokens for services and is not a drop-in replacement for the current HS256 application JWT. Database-backed sessions provide revocation and allow the server to load current user and authorization data.

The backend will expose Better Auth under the existing `/api/auth` origin and the protected API will use a session-aware guard. The guard will load the complete application user from the existing user record and attach it to the request so existing services and role checks continue to receive `UserFull`-compatible data.

### Keep domain roles separate from Better Auth administrative permissions

The application role remains the source of truth for business authorization. Better Auth's Admin plugin may be used for its impersonation session lifecycle, but its administrative role/permission storage must not accidentally turn `Partner_Staff` into a global administrator. If the plugin's role schema cannot be safely mapped to a separate auth-permission field, a small custom auth endpoint/plugin will provide the same constrained operation while retaining Better Auth session metadata.

Administrator authorization will allow any target user. Partner Staff authorization will require all of the following:

1. The requester has application role `Partner_Staff`.
2. The requester has a non-null `partnerId`.
3. The target is either another `Partner_Staff` user with the same `partnerId`, or a regular user with no application role.
4. For a regular target, a `UsersOnPrograms` membership exists where the related program's `partnerId` equals the requester's `partnerId`.

The check will use current database relationships and will not rely on the candidate list returned to the frontend.

### Preserve Argon2 credentials through an account migration

Create Better Auth credential-account records for existing users and carry the existing Argon2 hash into the credential password field. Configure password verification to understand the existing Argon2 format and use the same policy for new passwords. Keep the legacy `hash` field until staging and production verification confirms that every migrated account can authenticate, then remove it in a later cleanup migration.

Existing users will receive the required Better Auth identity fields through an additive migration. Existing accounts will be marked as verified because the current application has no email-verification state. New email-verification behavior is outside this change.

### Migrate impersonation from two JWTs to session metadata

The browser will no longer store a second administrator JWT. Starting impersonation creates a target session with an originating-user reference; stopping impersonation returns to the originating session. The request user during impersonation represents the target, so existing application authorization behaves as the target user. The originating identity is retained separately for stopping the flow and auditability.

The endpoint will accept a target user ID rather than trusting an email supplied by the client. The candidate UI will use the same authorization scope as the server, but the server will repeat the check before creating the session.

### Integrate the auth handler carefully with NestJS

Mount the Better Auth handler before body-parsing middleware or use the supported NestJS integration with body parsing disabled as required by the handler. Keep CORS credentials enabled for local development and preserve the production single-origin `/api` routing. Add an integration test for auth requests through the actual NestJS bootstrap path.

### Use a hard cutover with rollback protection

Deploy database changes and the new backend/frontend together. The deployment may retain `JWT_SECRET` temporarily so the previous image can be rolled back, but the new application will not accept legacy JWTs. Clear legacy cookies during the first authenticated frontend load. Remove the old JWT dependencies and secret only after the cutover is verified and rollback is no longer required.

## Risks / Trade-offs

- [Password-account migration misses or corrupts a hash] -> Run the migration against a database copy first, preserve the original `hash` column during verification, and test representative existing accounts before removing it.
- [Better Auth schema conflicts with the existing `users` model or role enum] -> Generate the schema, manually reconcile it with existing Prisma relations, and use a separate auth-permission field if the Admin plugin role field cannot safely use the domain role.
- [NestJS body parsing prevents auth requests from being read] -> Mount the handler in the documented order and test sign-in, sign-out, session lookup, and impersonation through the real server.
- [Partner Staff bypasses the filtered candidate list] -> Treat the backend partner-program query as the only security boundary and test direct requests for users from other partners.
- [Impersonation exposes target elevated privileges] -> Reject administrators and out-of-partner staff targets for Partner Staff and evaluate protected requests as the target identity.
- [All users are logged out at deployment] -> Announce the sign-in requirement and verify that existing passwords work before production cutover.
- [Rollback leaves incompatible cookies] -> Keep rollback credentials available temporarily and clear both legacy and new auth cookies during the transition path.
