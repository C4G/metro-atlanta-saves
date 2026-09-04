## TDD execution policy

Every behavior-changing task below SHALL follow red-green-refactor: first add or update a focused automated test, run it, and confirm it fails for the expected reason; then implement the smallest change, rerun the focused test until it passes, refactor if needed, and run the relevant broader suite before marking the task complete. Record the test command and outcome in the implementation handoff or pull request.

## 1. Authentication foundation

- [x] 1.1 Add Better Auth, the Prisma adapter, and the selected NestJS integration dependencies, then verify the lockfile and application build resolve them successfully
- [x] 1.2 Add a failing bootstrap integration test for the Better Auth handler and route, then configure the PostgreSQL/Prisma adapter, existing `users` table mapping, trusted origins, `BETTER_AUTH_SECRET`, and `/api/auth`; verify the handler test passes through the real application bootstrap
- [x] 1.3 Add failing integration tests for credentialed local requests, same-origin production requests, cookie attributes, and NestJS body-parser ordering, then configure request handling; verify sign-in, sign-out, and session lookup pass through the actual server
- [x] 1.4 Add a failing configuration test for temporary rollback-only `JWT_SECRET` handling and legacy bearer rejection by the Better Auth handler, then implement the configuration distinction; verify Better Auth uses its own secret, ignores legacy bearer tokens, and leaves rollback configuration available (protected-route rejection is verified in `3.4`)

## 2. Database schema and credential migration

- [x] 2.1 Add failing Prisma/schema tests for preserving existing user IDs, domain roles, partner associations, and program memberships, then generate and reconcile the Better Auth schema with the existing `User` model; verify Prisma generation, schema validation, and preservation tests pass
- [x] 2.2 Add failing migration tests for Better Auth user, account, session, verification, and separate auth-permission persistence, then add the required schema and migration; verify the reviewed migration is additive and does not drop application data
- [x] 2.3 Add failing backfill tests for identity fields, deterministic names, existing emails, and the agreed verification policy, then implement the user backfill; verify row counts and identity mappings match before and after the backfill
- [x] 2.4 Add failing credential migration tests for existing Argon2 hashes and plaintext-password exclusion, then backfill credential-account rows and preserve the legacy `hash` column; verify representative migrated hashes pass the existing Argon2 verifier
- [x] 2.5 Make the SQL credential-account backfill idempotent and preserve existing hashes; verify the migration creates one credential account per existing user without modifying valid mappings

## 3. Better Auth credential and session integration

- [x] 3.1 Add failing password tests for valid legacy passwords, invalid passwords, new passwords, and changed passwords, then configure Better Auth hashing and verification; verify the focused password suite and relevant backend suite pass
- [x] 3.2 Add failing backend integration tests for email/password registration, sign-in, sign-out, session lookup, password reset, profile preservation, and mail behavior, then implement the Better Auth flows; verify the endpoint contract and reset flow pass
- [x] 3.3 Add failing guard tests for managed-session validation, current-user loading, current role, partner, and relationship data, then implement the NestJS session guard; verify the guard test passes and role or partner changes take effect on the next request
- [x] 3.4 Add failing protected-route tests for legacy JWT rejection and valid managed-session acceptance, then replace controller dependencies on the legacy JWT guard while preserving role checks and `UserFull` consumers; verify the focused route suite passes
- [x] 3.5 Add failing current-user and profile endpoint tests for identity and response compatibility, then update those endpoints to use the managed session; verify the authenticated user ID and profile data remain unchanged after migration

## 4. Scoped impersonation

- [x] 4.1 Add failing permission tests for Administrator, Partner Staff, and all other roles, then define the Better Auth/admin permission mapping without making `Partner_Staff` a global administrator; verify the complete permission suite passes
- [x] 4.2 Add failing database-backed authorization tests covering same-partner membership, different-partner membership, missing partner association, regular targets, and elevated targets, then implement the requester/target authorization query; verify the full allow/deny matrix passes
- [x] 4.3 Add failing session tests for target identity, originating-user metadata, bounded expiration, target user IDs, and absence of the `originalToken` cookie, then implement start-impersonation; verify the resulting request user is the target and the origin is retained
- [x] 4.4 Add failing integration tests for stop-impersonation, session invalidation, restoration of the originating session, expired sessions, and non-originating stop requests, then implement the return flow; verify all return-path and expiration tests pass
- [x] 4.5 Add failing candidate-query and direct-request tests for Administrator and Partner Staff scopes, then update candidate discovery and server authorization; verify filtered-out targets are hidden and direct bypass requests are rejected

## 5. Frontend and SSR migration

- [x] 5.1 Add failing Angular auth-store tests for sign-in, sign-out, session refresh, page reload, and current-user loading, then replace browser-readable JWT and `originalToken` state with Better Auth session/client calls; verify the focused frontend suite passes
- [x] 5.2 Add failing browser and SSR interceptor/guard tests for managed-cookie forwarding and authorization state loading, then update Angular guards and HTTP/SSR interceptors; verify authenticated browser and SSR requests reach protected API routes
- [x] 5.3 Add failing impersonation UI/store tests for target IDs, server-provided candidates, managed session state, and returning to the origin, then update the impersonation flow; verify Partner Staff see only permitted candidates and can stop impersonating
- [x] 5.4 Add failing cutover cookie tests for removing `accessToken` and `originalToken` without affecting unrelated cookies, then implement the cutover cleanup and intended HttpOnly/same-origin settings; verify the cookie migration tests pass

## 6. Regression, rollout, and cleanup

- [x] 6.1 Run the complete backend unit and integration suites covering credential migration, password verification, session invalidation, current-user loading, legacy JWT rejection, role changes, partner scoping, elevated-target rejection, and impersonation expiration; verify all backend checks pass
- [ ] 6.2 Run the complete frontend and e2e suites covering existing-user sign-in, registration, password reset, protected routes, SSR authentication, Administrator impersonation, scoped Partner Staff impersonation, and stop-impersonation; verify all checks pass against a migrated database
- [ ] 6.3 Run the schema and credential migration against a database copy or staging environment, compare user/account/relationship counts, test representative account types, and document the deploy and rollback procedure; verify the migration report contains no unexplained mismatches
- [ ] 6.4 Deploy the coordinated backend, frontend, and database changes, monitor sign-in/session/reset/impersonation failures, and verify existing passwords work while old JWTs are rejected before declaring cutover complete
- [ ] 6.5 After rollback is no longer required, remove the legacy JWT strategy, Passport/JWT dependencies, JWT-only cookies and endpoints, temporary `JWT_SECRET` configuration, and legacy password hash storage only after verification; verify production no longer references retired auth paths
