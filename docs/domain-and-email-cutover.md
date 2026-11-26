# Production domain and Resend cutover

This runbook covers the production move from `brpatl.com` to
`metroatlantasaves.com`, the Resend mail setup used by both deployments, and
rollback. Production runs in the Coolify resource `metro-atlanta-saves` on the
DigitalOcean server `brp-01`; staging runs in `metro-atlanta-saves-staging` at
`https://metro-atlanta-saves.c4g.dev`.

## Email and environment configuration

Configure `RESEND_API_KEY`, `MAIL_FROM`, and the same random
`EMAIL_UNSUBSCRIBE_SECRET` as backend-only runtime values in both Coolify
resources. For local Compose use, put them in the ignored root `.env` file. Do
not commit a real key or secret or pass either to the frontend. Generate the
unsubscribe secret with `openssl rand -hex 32` and keep the same value in both
environments.

| Setting                       | Production                                            | Staging                                                         |
| ----------------------------- | ----------------------------------------------------- | --------------------------------------------------------------- |
| `PUBLIC_APP_URL`              | `https://metroatlantasaves.com`                       | `https://metro-atlanta-saves.c4g.dev`                           |
| `BETTER_AUTH_URL`             | `https://metroatlantasaves.com`                       | Keep `https://metro-atlanta-saves.c4g.dev`                      |
| `BETTER_AUTH_ALLOWED_HOSTS`   | `metroatlantasaves.com`                               | Keep the existing value (normally empty)                        |
| `CORS_ORIGIN`                 | `https://metroatlantasaves.com`                       | Keep `https://metro-atlanta-saves.c4g.dev`                      |
| `MAIL_FROM`                   | `no-reply@metroatlantasaves.com`                      | `no-reply@metroatlantasaves.com`                                |
| `RESEND_API_KEY`              | Resend API key, backend only                          | Resend API key, backend only                                    |
| `EMAIL_UNSUBSCRIBE_SECRET`    | Shared random secret, backend only                    | Same shared secret, backend only                                |
| `EMAIL_UNSUBSCRIBE_URL`       | `https://metroatlantasaves.com/api/users/unsubscribe` | Same production unsubscribe endpoint                            |
| `EMAIL_PREFERENCE_SOURCE_URL` | Leave empty; production uses its database             | `https://metroatlantasaves.com/api/users/campaign-suppressions` |
| `VAPID_SUBJECT`               | `https://metroatlantasaves.com`                       | Do not change for this cutover                                  |

Staging keeps its existing hostname, DNS records, TLS, edge routing, and
authentication origin. It uses Resend and sends to the recipients selected by
staging actions, except campaign messages exclude opted-out addresses. Campaign
unsubscribe links from both environments target production, and staging checks
the production preference endpoint using the shared secret. If that check is
missing or unavailable, staging does not send the campaign. The staging database is copied
from production and contains real user addresses, so staging actions can email
real users. Do not use a production-sized recipient list for a test campaign.

The existing `MAIL_FROM` assumption is `no-reply@metroatlantasaves.com`; verify
that sender with Resend before enabling delivery. If the sender changes, update
the value in both backend runtimes.

## Resend domain and DNS

1. Add and verify `metroatlantasaves.com` in Resend.
2. Publish the exact DNS records Resend provides for outbound sending. Preserve
   or merge existing SPF records as Resend instructs. A return-path record may
   include MX records on a provider-specified subdomain; add it only at the
   host Resend names and do not treat it as an inbound mailbox.
3. Remove the existing inbound MX records for `brpatl.com`. Do not configure an
   inbound mailbox or mail integration for either website domain.
4. Keep `brpatl.com` and `www.brpatl.com` web DNS records pointed at the
   production droplet while they are needed for HTTPS redirects. Do not change
   DNS for `metro-atlanta-saves.c4g.dev`.

## Production web DNS, Coolify, and TLS

1. Point the `metroatlantasaves.com` apex and `www.metroatlantasaves.com` at
   the existing production droplet using the authoritative DNS provider's
   supported apex and alias records.
2. Add the new production hosts to the `metro-atlanta-saves` Coolify resource
   and confirm Traefik routes the apex to the frontend/API stack.
3. Configure HTTP and HTTPS redirects to
   `https://metroatlantasaves.com` for `brpatl.com`, `www.brpatl.com`, and
   `www.metroatlantasaves.com`. Preserve request paths and query strings,
   including `/api` paths. Redirect `http://metroatlantasaves.com` to its
   HTTPS equivalent.
4. Keep valid TLS certificates for the canonical apex and every HTTPS redirect
   hostname. Do not add the production hosts, redirects, DNS records, or TLS
   configuration to the staging resource.

## Production Google authentication

Update the production Google OAuth client and consent-screen settings to use
`metroatlantasaves.com`. Use
`https://metroatlantasaves.com/api/auth/callback/google` as the production
redirect URI and `https://metroatlantasaves.com` as its JavaScript origin.
Keep staging's existing `c4g.dev` origin, callback, and OAuth settings.

Set the production backend's `BETTER_AUTH_URL`,
`BETTER_AUTH_ALLOWED_HOSTS`, and `CORS_ORIGIN` to the values in the table. The
old domain and `www` aliases are website redirects; users authenticate on the
canonical apex. Remove the `admin@brpatl.com` contact from the privacy policy.
Set production `VAPID_SUBJECT` to the canonical HTTPS origin.

## Deploy and verify

1. Build and publish the backend and frontend images through the existing
   deployment workflow.
2. Configure `RESEND_API_KEY`, `MAIL_FROM`, and the shared
   `EMAIL_UNSUBSCRIBE_SECRET` in both Coolify backend runtimes. Set
   `EMAIL_PREFERENCE_SOURCE_URL` only in staging to the production endpoint in
   the table; keep it empty in production.
   Configure the production public URL and auth values as listed above; leave
   staging's site and auth settings alone.
3. Deploy production and confirm the canonical site and
   `https://metroatlantasaves.com/api/health` return successfully over HTTPS.
4. Check redirect status, target, path, and query preservation for HTTP and
   HTTPS requests to each old/alternate host, including a page and an `/api`
   path. For example:

   ```sh
   curl -sS -o /dev/null -w '%{http_code} %{redirect_url}\n' \
     'https://brpatl.com/example?source=cutover'
   ```

5. Send controlled transactional and campaign messages using addresses whose
   owners expect the email. Confirm campaign mail contains a visible
   unsubscribe link and both one-click headers; unsubscribe a controlled
   recipient and verify later campaigns exclude that address in both
   environments. Confirm each multi-recipient message is
   separately addressed and no other recipient appears in its To, CC, or BCC
   fields. A batch request still counts every recipient toward Resend's
   transactional email quota.
6. Confirm staging still resolves at
   `https://metro-atlanta-saves.c4g.dev`, its DNS/TLS/routing are unchanged,
   and its email links point to that origin. Staging sends to original selected
   recipients, so only trigger staging email actions when those recipients
   should receive the message.

## Rollback

Keep the previous production image, old website DNS records and TLS, and
existing SMTP runtime values until cutover is accepted. To roll back, restore
the previous image and its production URL/auth settings, then point the
canonical production host back to the prior routing. Keep the new domain's
Resend verification records available while diagnosing; they do not affect
inbound mail. Staging's hostname, DNS, TLS, routing, and authentication remain
as they were throughout the production rollback.
