## Context

See [proposal.md](proposal.md) for motivation and [the capability specs](specs/) for the required behavior. Production is a single Coolify Docker Compose resource on a DigitalOcean droplet; Coolify/Traefik handles the public routes and TLS, with `/api` routed to the backend and all other paths to the frontend. The current mail library is shared by the backend, uses Nodemailer SMTP and Handlebars templates, and has several hardcoded `brpatl.com` links. Production origins and SMTP settings are passed through `docker-compose.yaml`; `.env` is gitignored. Google authentication also relies on host/origin settings and an external OAuth client configuration.

## Goals / Non-Goals

**Goals:**

- Keep the existing single-origin frontend/API routing and existing email-trigger call sites while changing their production hostname and mail provider.
- Make domain changes and secret configuration explicit in repository examples and deployment runbooks, including steps that must be performed in Coolify, DNS, Google OAuth, and Resend.
- Limit hostname, DNS, TLS, and authentication-origin changes to production; preserve the staging site at `metro-atlanta-saves.c4g.dev` with its existing DNS, TLS, and edge routing, while switching its outbound mail provider to Resend too.
- Preserve the existing email templates and rich-text email formatting, and ensure bulk sends remain addressed to each intended user.
- Give bulk campaigns a visible, one-click unsubscribe flow backed by persistent user preference state, shared by production and staging.

**Non-Goals:**

- Move the application, database, uploads, or Coolify control plane to another host.
- Migrate inbound email hosting or mailboxes, or provide a replacement inbound email integration. Retire the old domain's inbound MX routing as part of the cutover.
- Preserve browser sessions across the move between unrelated domains; users with an existing `brpatl.com` cookie will need to authenticate on the new domain.
- Replace email content, add delivery analytics/webhooks, or create a new campaign-management system. Campaign unsubscribe preferences do not suppress transactional notices.

## Decisions

### Keep the application on the current Coolify stack and make the edge hostname-aware

Point the new domain records at the existing production droplet and add the new apex and `www` hostname to the production Coolify resource so Traefik can route them and issue certificates. Keep `metroatlantasaves.com` as the application host. Configure a temporary Traefik dynamic `RedirectRegex` middleware in Coolify for the old apex and old `www` hostnames, attached to both frontend and backend routers so redirects cover frontend paths and `/api`, preserving the path and query. Keep the new `www` hostname as a site alias without requiring a redirect. Retain the old domain's DNS and certificate coverage while redirects are required; Dynu URL forwarding must be disabled for those hosts so HTTPS reaches Traefik. Keep this temporary edge configuration out of the application Compose file.

Alternative considered: add a second application or proxy stack for the new domain. That duplicates routing and deployment state without a need to move the running services.

### Centralize public origins in the existing runtime configuration

Set the production `PUBLIC_APP_URL` and production configuration examples to the new canonical origin. Replace hardcoded production web links with that value on the backend, and derive browser-origin links from the active site where appropriate. Update production `BETTER_AUTH_URL`, allowed hosts, CORS origins, email campaign links, Google OAuth authorized origins/callbacks, and deployment/auth documentation. Keep the staging `PUBLIC_APP_URL` and authentication origin at `https://metro-atlanta-saves.c4g.dev`; staging email links must continue to use that origin. Remove the obsolete `admin@brpatl.com` privacy-policy contact and set the production web-push VAPID subject to the canonical HTTPS site URL. The [VAPID specification](https://www.rfc-editor.org/rfc/rfc8292) allows an HTTPS contact URI as the subject, so the application does not need to keep an inbound mailbox for push contact information. Keep the frontend and API on one origin so host-only auth cookies continue to work after users authenticate on the new domain. Retire the old domain's inbound MX routing; keep its website DNS records and TLS until redirects are no longer required. Add only the Resend DNS records required for outbound sending on the new domain, including any provider-specific return-path record, without enabling inbound mail handling. Do not change staging DNS, TLS, or edge routing as part of the production domain cutover.

Alternative considered: add a second base-URL variable for each email or feature. The existing `PUBLIC_APP_URL` already serves absolute email asset and reminder links, so expanding its use avoids competing production origins.

### Use Resend's Node SDK behind the existing MailService boundary

Keep the shared `MailService` boundary and transactional methods, replace SMTP delivery with the Resend SDK in both production and staging, and use the existing `MAIL_FROM` setting for a sender verified with Resend. Add `RESEND_API_KEY` to backend runtime configuration and Compose interpolation. Add an empty placeholder to `.env.example`; the real value remains in the ignored root `.env` for local Compose use and in each Coolify runtime's backend-only secret configuration. Do not configure SMTP fallback. Initialize provider access lazily so a missing key does not block application startup in either environment, while an attempted send without a key fails explicitly.

Keep the existing Handlebars templates and rich-text HTML transformations. For multi-recipient messages, submit one individually addressed message per recipient through Resend's batch API in provider-supported chunks; do not put the recipient list in To, CC, or BCC. Surface provider errors instead of reporting a send as successful. The batch endpoint reduces API requests, not recipient-based email quota: Resend counts each recipient, including BCC recipients, toward quota and advises against large BCC lists ([pricing](https://resend.com/pricing), [deliverability guidance](https://resend.com/guides/email/deliverability/avoid-outlook-spam-folder)). Resend's [Node.js integration](https://resend.com/nodejs) documents the SDK send response and API key setup; its [batch API](https://resend.com/blog/introducing-the-batch-emails-api) supports multiple individually addressed messages per request. This keeps recipient lists private and accommodates the existing bulk campaign and notification calls.

Treat administrator bulk email and educational-content announcements as campaigns. Append a recipient-specific visible unsubscribe link and add RFC 8058 `List-Unsubscribe` and `List-Unsubscribe-Post` headers to each individually addressed campaign message. Store campaign opt-out state on the user record. The public unsubscribe link targets production in both environments, and the production endpoint verifies a signed token before recording the choice. Keep discussion, account, reminder, and image-review messages transactional, without campaign unsubscribe controls. Staging's database is a production copy and staging sends to real recipients, so configure a shared backend-only signing secret and have staging check campaign eligibility against the canonical production preference endpoint; fail campaign preparation if that shared check cannot be completed. This makes production the source of truth without allowing a stale staging copy to override an unsubscribe.

Alternative considered: point Nodemailer at Resend's SMTP relay. The direct API matches the requested provider integration, removes SMTP-specific configuration and transport dependencies, and gives bulk sending a provider-native API.

### Make DNS and provider setup part of the cutover, not a code assumption

Before production cutover, verify `metroatlantasaves.com` in Resend and publish its provided outbound sending records at the authoritative DNS provider. Remove obsolete inbound MX records for the old domain as requested; do not create or enable an inbound mailbox. Update the public privacy contact so it no longer points to that retired address. Add any Resend-provided return-path record only at the host Resend specifies, and preserve or merge existing SPF records as required for outbound authentication. Configure `RESEND_API_KEY`, `MAIL_FROM`, and the same `EMAIL_UNSUBSCRIBE_SECRET` in both production and staging backend runtimes; configure staging's campaign preference source as the canonical production API endpoint. Staging can use the verified sender domain without changing its website DNS, TLS, or routing. Separately add the new production web hostnames and old-host redirects in Coolify, confirm Traefik has valid certificates for every HTTPS production hostname, and update the external Google OAuth configuration to the new canonical origin and callback.

Alternative considered: make these provider settings implicit in the source change. DNS ownership and OAuth/Coolify settings are outside this repository and need an explicit operator checklist to avoid an incomplete cutover.

## Risks / Trade-offs

- [DNS or TLS is incomplete when the new host is enabled] → Keep the old host serving until the new apex and aliases resolve and have valid certificates; verify frontend, `/api/health`, authentication, and redirects before announcing the change.
- [Old-domain DNS or certificates are removed too soon] → Keep both old hostnames routed and certified for as long as redirects are required.
- [Google sign-in rejects the new callback] → Update and verify the OAuth authorized origins and callback URI before the cutover; retain email/password as the recovery path.
- [Existing browser sessions do not transfer to the new domain] → Expect users to sign in again; user accounts and server-side data remain unchanged.
- [A Resend key, sender, or DNS record is wrong] → Verify the sender domain and make controlled test sends from both environments before relying on delivery; keep the key out of source control and frontend configuration.
- [Provider limits or partial batch failures affect bulk mail] → Chunk batches within the current provider API limits and treat any rejected message as a reported send failure; verify campaign behavior with representative recipients before production use.
- [The sender address assumption is wrong] → The current plan uses `no-reply@metroatlantasaves.com`; confirm the desired sender before creating the Resend production domain setup.

## Migration Plan

1. Add the Resend implementation and campaign unsubscribe flow, configure production and staging runtime secrets and shared opt-out checks, update production and staging public URL handling, and document the rollout while preserving staging's hostname, DNS, TLS, and edge routing.
2. Verify the new sender domain in Resend, publish the records required for outbound sending, remove obsolete inbound MX routing for `brpatl.com`, add Resend and unsubscribe settings in both production and staging backend runtimes, and update Google OAuth settings for production.
3. Point the new production domain and `www` DNS records at the existing droplet. Configure Coolify/Traefik routing and TLS for the new production hosts while retaining old hosts; do not alter staging's hostname, DNS, TLS, or edge routing. Deploy and check the production canonical site, API, auth flows, and public links, plus environment-specific email links and Resend delivery in both environments.
4. Enable Coolify/Traefik edge redirects from both `brpatl.com` hosts to the new apex, then check path/query preservation and all API routes. Leave `www.metroatlantasaves.com` available as an alias.
5. Roll back by restoring the previous Coolify hostname/auth environment values and DNS routing while the old deployment remains available. The Resend integration can be reverted in code without database changes; retain the new DNS records and verified domain if a rollback is needed.

## Open Questions

- Confirm that `no-reply@metroatlantasaves.com` is the sender identity to verify in Resend before implementation and DNS setup.
