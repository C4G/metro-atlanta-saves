# Google sign-in and One Tap setup

Google sign-in is optional. The backend enables both Google OAuth and One Tap only when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are present. If either is absent, `/api/google-auth/config` returns `{"clientId":null}`, the Google button and One Tap are hidden, and email/password remains available. The secret stays on the backend.

Create a Google OAuth **Web application** client for staging and another for production. Separate Google Cloud projects are recommended so staging can remain in Testing while production is published. Configure each client's ID and secret only in its corresponding backend environment.

In Google Auth Platform → **Branding**, register `c4g.dev` for staging and `brpatl.com` for production as authorized domains. The project owner must be able to verify each domain if Google requests it. Complete the application name, support email, homepage, and privacy policy fields for the production consent screen. In **Audience**, choose External: add staging tester Google accounts while staging is in Testing, and publish the production project for public sign-in.

Use `https://brpatl.com/privacy-policy` for the production privacy policy URL, and `https://brpatl.com` for its homepage URL. The homepage footer links to that same policy page. For staging, use `https://metro-atlanta-saves.c4g.dev/privacy-policy` and its matching homepage. Before publishing, confirm the privacy contact address and policy text match the organization's actual practices.

In Google Auth Platform → **Clients**, create clients of type **Web application** and enter these exact values:

| Environment            | Authorized JavaScript origin for One Tap | Authorized redirect URI for OAuth                              |
| ---------------------- | ---------------------------------------- | -------------------------------------------------------------- |
| Local frontend and API | `http://localhost:4200`                  | `http://localhost:3000/api/auth/callback/google`               |
| Staging                | `https://metro-atlanta-saves.c4g.dev`    | `https://metro-atlanta-saves.c4g.dev/api/auth/callback/google` |
| Production, apex       | `https://brpatl.com`                     | `https://brpatl.com/api/auth/callback/google`                  |
| Production, www        | `https://www.brpatl.com`                 | `https://www.brpatl.com/api/auth/callback/google`              |

Put both production rows in the **same production client**. The local row can go in the staging client; also add `http://localhost` as an authorized JavaScript origin for Google Identity Services local testing. Origins contain only scheme and hostname (and port when used), without a path or trailing slash. Redirect URIs include the exact `/api/auth/callback/google` path. One Tap uses the JavaScript origin; do not add `/api/auth/one-tap/callback` as a Google redirect URI.

Set these backend environment values in Coolify:

| Environment | `BETTER_AUTH_URL`                     | `BETTER_AUTH_ALLOWED_HOSTS` | `CORS_ORIGIN`                               |
| ----------- | ------------------------------------- | --------------------------- | ------------------------------------------- |
| Staging     | `https://metro-atlanta-saves.c4g.dev` | leave empty                 | `https://metro-atlanta-saves.c4g.dev`       |
| Production  | `https://brpatl.com`                  | `brpatl.com,www.brpatl.com` | `https://brpatl.com,https://www.brpatl.com` |

Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to the values from that environment's client. `BETTER_AUTH_URL` is the fallback public API origin; with `BETTER_AUTH_ALLOWED_HOSTS` set, Better Auth chooses the requested production hostname for its OAuth callback and session cookie. The frontend and API must share the same public hostname for each request. The client secret must never be sent to the browser.

The frontend fetches the public client ID from `/api/google-auth/config`. One Tap submits a Google ID token to `/api/auth/one-tap/callback`; Better Auth verifies its signature, expiry, and audience. The backend also requires a trusted `Origin` header on this endpoint. Google OAuth and One Tap both require Google's `email_verified` claim and use the existing application user record for roles and partner associations. A new Google account needs a first and last name; when Google does not provide enough name information, the user is directed to email registration.

Before enabling production credentials, test in a non-production deployment with its own registered origin and callback URI:

1. Sign in with Google as an existing email/password user. Confirm the same user ID, role, partner association, and profile remain, and that a managed session is created.
2. Register a new user with Google, then repeat with One Tap. Confirm required names are populated, no application role or partner is granted, and both sessions work after reload.
3. Try an unverified Google email, an invalid or expired One Tap credential, and a request from an untrusted origin. Confirm no new user or session is created.
4. Dismiss or block One Tap and cancel OAuth. Confirm the visible Google button and email/password forms still work.
5. Unset one Google credential and restart. Confirm Google options disappear and email/password sign-in still works.
