## 1. Google Provider and Account Handling

- [x] 1.1 Configure the Google provider in Better Auth with server-side client credentials and verify valid credentials are loaded from the runtime configuration.
- [x] 1.2 Configure verified-email account matching and new-user profile mapping; verify tests cover existing account preservation, new account creation, unverified email rejection, and no role or partner privilege assignment from Google claims.
- [x] 1.3 Configure the Better Auth One Tap server and client integration with the authorized client ID and origins; verify invalid or unauthorized One Tap credentials are rejected without creating a session.

## 2. Login and Registration Experiences

- [x] 2.1 Add Google sign-in actions to login and registration that initiate the managed Google flow and verify successful completion returns the user to the application with the current session.
- [x] 2.2 Add Google One Tap to login and registration pages and verify dismissal, unsupported browser behavior, and provider errors leave Google button and email/password sign-in usable.
- [x] 2.3 Verify successful Google sign-in refreshes the shared auth state and follows the same post-auth navigation behavior as existing sign-in.

## 3. Deployment Configuration and Integration

- [x] 3.1 Document Google OAuth client ID, client secret, callback URI, and authorized origins for local and deployed environments; verify startup fails safely or disables Google auth when required provider configuration is absent.
- [x] 3.2 Verify the full login and registration flow in a non-production environment for returning and new users, including managed session creation and preservation of existing roles and partner associations (confirmed by the user).
  - [x] Returning users can sign in through One Tap and the Google button on the login and registration pages (confirmed by the user).
  - [x] New Google users can register and receive a managed session (confirmed by the user).
  - [x] Existing roles and partner associations remain intact after Google sign-in (confirmed by the user).
- [x] 3.3 Verify the configured One Tap prompt uses the intended production origin and that email/password login remains available when Google configuration is disabled (confirmed by the user).
