## Why

The application now uses Better Auth sessions, but sign-in and registration still require users to enter an email address and password. Google sign-in and Google One Tap will give users a familiar, faster way to enter the application while keeping account identity and session creation under the existing authentication system.

## What Changes

- Add Google as a sign-in and registration provider through Better Auth.
- Add Google One Tap to the login and registration experiences, with existing email/password flows remaining available.
- Match verified Google identities to existing accounts by email and preserve the application's existing user identity and authorization data.
- Configure Google OAuth credentials and authorized origins for local and deployed environments.
- Define safe handling for unverified Google email addresses, OAuth cancellation or failure, and browser environments where One Tap is unavailable.

## Capabilities

### New Capabilities

- `authentication/google-identity`: Google SSO and One Tap behavior, including account matching and session creation.

### Modified Capabilities

- None. The active Better Auth migration introduces the authentication foundation; this follow-on change adds a separate provider capability.

## Impact

- Better Auth provider configuration and Google credential configuration in the backend.
- Angular login and registration experiences and the shared auth client/session flow.
- Deployment environment configuration for Google OAuth client credentials and allowed origins.
- User/account persistence through Better Auth's existing account model; existing application roles, partner associations, and user identifiers must remain authoritative.
