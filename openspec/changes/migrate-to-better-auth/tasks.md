## 1. Authentication foundation

- [ ] 1.1 Add Better Auth, the Prisma adapter, and the selected NestJS integration dependencies, then verify the lockfile and application build resolve them successfully
- [ ] 1.2 Add Better Auth configuration with the PostgreSQL/Prisma adapter, existing `users` table mapping, trusted origins, `BETTER_AUTH_SECRET`, and the existing `/api/auth` route, then verify the auth handler responds through the application bootstrap path
- [ ] 1.3 Configure the Better Auth session cookie and request handling for same-origin production, credentialed local development, and NestJS body-parser ordering, then verify sign-in, sign-out, and session lookup requests in an integration test
- [ ] 1.4 Retain `JWT_SECRET` as a temporary rollback-only setting while documenting that the new application rejects legacy JWTs, and verify configuration validation distinguishes the active Better Auth secret from the temporary legacy secret

## 2. Database schema and credential migration

- [ ] 2.1 Generate the Better Auth Prisma schema and reconcile it with the existing `User` model and relations without changing existing user IDs, domain role values, partner associations, or program memberships; verify Prisma generation and schema validation succeed
- [ ] 2.2 Add the required Better Auth user, account, session, and verification persistence plus any separate auth-permission fields needed to keep `Administrator` and `Partner_Staff` domain roles distinct; verify the reviewed migration is additive and does not drop application data
- [ ] 2.3 Backfill Better Auth identity fields from existing users, including a deterministic display name from first and last names and the existing email, and mark legacy accounts according to the agreed verification policy; verify row counts and identity mappings match before and after the backfill
- [ ] 2.4 Backfill credential-account rows using each existing Argon2 hash without exposing or storing plaintext passwords, preserve the legacy `hash` column during rollout, and verify a representative set of migrated hashes with the existing Argon2 verifier
- [ ] 2.5 Create an idempotent migration verification or repair command for missing account rows, duplicate mappings, and hash mismatches, and verify it reports actionable failures without modifying valid mappings

## 3. Better Auth credential and session integration

- [ ] 3.1 Configure Better Auth password hashing and verification to accept the existing Argon2 format and apply the configured policy to new or changed passwords, then verify valid legacy passwords succeed and invalid passwords create no session
- [ ] 3.2 Implement email/password registration, sign-in, sign-out, session lookup, and password reset using Better Auth while preserving the application’s current profile and mail flows; verify the endpoint contract and reset flow with backend integration tests
- [ ] 3.3 Implement a NestJS session guard that validates the managed session, loads the current full application user from the existing user record, and attaches current role, partner, and relationship data to the request; verify role and partner changes take effect on the next request
- [ ] 3.4 Replace protected-controller authentication dependencies on the legacy JWT guard while preserving existing role checks and `UserFull` consumers; verify all protected routes reject requests with only a legacy JWT and accept requests with a valid managed session
- [ ] 3.5 Update current-user and profile endpoints to use the managed session identity and preserve existing response expectations where required; verify the authenticated user ID and profile data remain unchanged after migration

## 4. Scoped impersonation

- [ ] 4.1 Define the Better Auth/admin permission mapping so only `Administrator` receives unrestricted impersonation authority and `Partner_Staff` does not become a global Better Auth administrator; verify permission assignments for both roles in unit tests
- [ ] 4.2 Implement the server-side target authorization query using the requester’s current role and partner, rejecting missing partner associations and elevated targets for Partner Staff and requiring a target membership in a program owned by the requester’s partner; verify the full allow/deny matrix with database-backed tests
- [ ] 4.3 Implement start-impersonation using a target user ID and managed session metadata that records the originating user, with a bounded expiration and no `originalToken` cookie; verify the resulting request user is the target and the origin is retained
- [ ] 4.4 Implement stop-impersonation to invalidate the target session and restore the originating session, and reject expired or non-originating stop requests; verify return-path and expiration behavior with integration tests
- [ ] 4.5 Update the candidate endpoint/query to return all valid targets for Administrators and only in-scope regular users for Partner Staff, while keeping server authorization authoritative; verify direct requests for filtered-out targets are rejected

## 5. Frontend and SSR migration

- [ ] 5.1 Replace browser-readable JWT and `originalToken` state in the Angular auth store with Better Auth session/client calls and current-user data; verify sign-in, sign-out, session refresh, and page reload behavior
- [ ] 5.2 Update Angular guards and HTTP/SSR interceptors to forward the managed session cookie and load authorization state from the server instead of decoding JWT claims; verify authenticated browser requests and SSR requests reach protected API routes
- [ ] 5.3 Update the impersonation UI and stores to use target user IDs, server-provided candidates, managed session state, and the stop-impersonation flow; verify Partner Staff see only permitted candidates and can return to the originating account
- [ ] 5.4 Clear legacy `accessToken` and `originalToken` cookies during the cutover path and ensure new auth cookies use the intended HttpOnly and same-origin settings; verify old cookies are removed without clearing unrelated application cookies

## 6. Verification, rollout, and cleanup

- [ ] 6.1 Add unit and integration coverage for credential migration, password verification, session invalidation, current-user loading, legacy JWT rejection, role changes, partner scoping, elevated-target rejection, and impersonation expiration; verify the backend test suite passes
- [ ] 6.2 Add end-to-end coverage for existing-user sign-in, registration, password reset, protected routes, SSR authentication, Administrator impersonation, scoped Partner Staff impersonation, and stop-impersonation; verify the frontend and e2e suites pass against a migrated database
- [ ] 6.3 Run the schema and credential migration against a database copy or staging environment, compare user/account/relationship counts, test representative account types, and document the deploy and rollback procedure; verify the migration report contains no unexplained mismatches
- [ ] 6.4 Deploy the coordinated backend, frontend, and database changes, monitor sign-in/session/reset/impersonation failures, and verify existing passwords work while old JWTs are rejected before declaring cutover complete
- [ ] 6.5 After rollback is no longer required, remove the legacy JWT strategy, Passport/JWT dependencies, JWT-only cookies and endpoints, temporary `JWT_SECRET` configuration, and legacy password hash storage only after verification; verify production no longer references retired auth paths
