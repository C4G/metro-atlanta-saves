## Context

See `proposal.md` for motivation and `specs/authentication/google-identity/spec.md` for the behavior contract. The completed Better Auth migration supplies managed sessions, a Prisma-backed user/account model, email/password auth, and an Angular auth store that calls the `/api/auth` endpoints. User first and last names are required application fields; roles and partner associations remain domain data on the existing user record.

## Goals / Non-Goals

**Goals:**

- Add Google OAuth and Google One Tap as two entry points into the same Better Auth session and user model.
- Preserve existing user records and their application authorization when a verified Google identity matches by email.
- Keep email/password flows available as an equivalent fallback.

**Non-Goals:**

- Add other social providers, Google Workspace domain restrictions, or organization-level access rules.
- Change application roles, partner authorization, or password authentication.
- Treat Google profile claims as a source of application permissions.

## Decisions

### Use Better Auth for both Google entry points

Configure Google's OAuth client in the existing Better Auth instance and use its One Tap plugin/client support for the One Tap credential flow. Both paths must resolve to the same managed session behavior and identity checks. This keeps provider tokens and validation on the authentication boundary and avoids a separate client-side Google token/session implementation. A hand-built Google Identity Services flow with a custom token endpoint was considered, but it would duplicate provider credential handling and session issuance.

### Require a verified Google email for account matching

Use the provider's verified email as the matching key for existing accounts and reject identities without a verified email. A matching identity links to and authenticates the existing user record so user IDs, profile fields, roles, partner associations, and related records remain intact. A new account must satisfy the same eligibility rules as the existing email registration flow. Google names can seed required name fields for a new record; account setup must handle missing or incomplete name claims without granting privileges.

Implicit linking of verified emails was chosen to let current email/password users use Google without creating duplicate accounts. Linking based on an unverified address or silently replacing an existing provider link was rejected because it could enable account takeover. Existing account-linking behavior and any migration-specific callback configuration must be checked against the deployed Better Auth version before implementation.

### Render One Tap as an optional path

Offer One Tap on login and registration pages, but retain the visible Google sign-in action and email/password forms. Browser support, user settings, privacy choices, and FedCM behavior control whether One Tap appears or succeeds, so the UI must not depend on the prompt being available. Provider failure or dismissal should leave a clear path to the existing forms.

### Configure explicit origins and deployment credentials

Add Google client ID and secret as server configuration, and use the client ID with the One Tap client. Register the exact OAuth callback URI and permitted frontend origins for local and deployed environments. Do not expose the client secret to the browser. Keep the accepted One Tap origin aligned with the application's trusted-origin and deployment configuration.

## Risks / Trade-offs

- [Email linking semantics differ across Better Auth versions or provider responses] → Verify behavior for verified and unverified Google accounts against the installed version, and explicitly reject unverified email authentication.
- [Google OAuth callback or One Tap origins are misconfigured] → Document environment-specific callback/origin values and verify local and production configuration before enabling the provider.
- [Google does not return both required name fields] → Define a safe name completion path for new accounts and never infer authorization fields from Google profile data.
- [One Tap is blocked by browser privacy settings or unsupported environments] → Preserve the Google button and email/password form as always-available alternatives.
- [A new provider path weakens account enrollment controls] → Apply the same registration eligibility rules and server-side checks as email registration before persisting a user or issuing a session.

## Migration Plan

1. Configure Google OAuth credentials, redirect URIs, and authorized frontend origins for non-production and production environments.
2. Deploy the backend and frontend support while keeping email/password authentication available.
3. Verify returning-user linking, new-user registration, One Tap fallback behavior, and managed-session creation in a non-production environment.
4. Enable Google sign-in and One Tap for production and monitor provider errors; rollback by disabling Google provider configuration while leaving existing sessions and email/password sign-in intact.

## Open Questions

- Confirm the production and local Google OAuth client IDs, authorized origins, and redirect URIs during deployment setup.
