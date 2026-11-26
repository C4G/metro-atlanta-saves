## Why

The production site and its outbound mail still use `brpatl.com`, while the organization is moving to `metroatlantasaves.com`. Production needs a coordinated hostname cutover on its existing Coolify deployment and a move from SMTP to Resend so site links, authentication, and emails continue to work under the new brand.

## What Changes

- Make `https://metroatlantasaves.com` the production canonical origin and update application-generated links, authentication origins, and operational documentation to use it.
- Keep `brpatl.com` and `www.brpatl.com` available as HTTPS redirects to the new apex domain, preserving paths and query strings; redirect `www.metroatlantasaves.com` to the canonical apex as well.
- Update DNS and Coolify/Traefik routing and TLS for the new domain on the existing DigitalOcean production droplet, with rollout steps for external provider settings.
- Replace SMTP/Nodemailer delivery with Resend for existing application email in both production and staging, using server-only `RESEND_API_KEY` configuration and a sender verified for `metroatlantasaves.com` (assume `no-reply@metroatlantasaves.com`).
- Remove old-domain inbound mail routing and retire the `admin@brpatl.com` contact reference; no new inbound mailbox or inbound email integration is part of this change. Configure only the DNS records needed for website routing and Resend outbound sending.
- Update environment examples and Docker Compose forwarding for Resend without checking secrets into the repository. Configure Resend in both production and staging while keeping the staging site at `metro-atlanta-saves.c4g.dev` with its hostname, DNS, TLS, and edge routing unchanged. Staging sends to the original selected recipients, including real user addresses from its production copy.
- Add campaign unsubscribe handling for administrator bulk campaigns and educational-content announcements: visible unsubscribe links, RFC 8058 one-click headers, and persisted opt-out state. Make production the shared opt-out authority so staging campaigns to real addresses honor the same choices; operational account and discussion notices remain transactional.

## Capabilities

### New Capabilities

- `site-domain`: Defines the production canonical hostname, legacy-host redirects, generated links, authentication host configuration, and deployment routing expectations.
- `outbound-email`: Defines delivery of existing application emails through Resend in production and staging, sender identity, secret configuration, and failure behavior.

### Modified Capabilities

None.

## Impact

- Coolify Docker Compose routing and environment configuration for production and staging, production DNS records, Traefik TLS certificates, and production rollout on the DigitalOcean droplet.
- Backend mail service and dependencies, email templates and mail-triggering features, campaign opt-out persistence and endpoints, `.env.example`, and `docker-compose.yaml`.
- Public URL and authentication settings, hardcoded production web links, Google OAuth authorized origins/callbacks, and deployment/auth/email documentation.
- The Resend account must verify the selected sender domain and provide the API key through the backend runtime environment; the key must remain out of source control and browser bundles.
- The old domain remains in DNS for website redirects, but its existing inbound MX routing can be removed. Resend DNS records used for outbound sending must be kept distinct from inbound mailbox configuration.
