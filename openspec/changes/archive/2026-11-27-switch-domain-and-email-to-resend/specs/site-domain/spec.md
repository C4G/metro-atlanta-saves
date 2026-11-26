## Purpose

Defines the public production hostname and the behavior expected while the application moves from its current domain to the new canonical domain.

## ADDED Requirements

### Requirement: Production uses the new canonical origin

The production application SHALL use `https://metroatlantasaves.com` as its canonical origin. Application-generated production links, authentication redirects, and public asset URLs SHALL use that origin, and the frontend and API SHALL remain available on the same origin.

#### Scenario: Application generates a production link

- **WHEN** the application generates a link to a production page, API callback, or public asset
- **THEN** the link uses `https://metroatlantasaves.com` and the corresponding path

#### Scenario: User signs in on the canonical origin

- **WHEN** a user opens the production site at `https://metroatlantasaves.com` and signs in with an enabled authentication method
- **THEN** authentication completes on that origin and the user can use the site's API with the resulting session

### Requirement: Legacy hostnames redirect to the canonical origin

The production deployment SHALL redirect HTTP and HTTPS requests for `brpatl.com` and `www.brpatl.com` to the matching path and query on `https://metroatlantasaves.com`. It SHALL serve valid HTTPS for both legacy hostnames so HTTPS requests can reach the redirect. The new `www.metroatlantasaves.com` hostname MAY serve the application as an alias without redirecting.

#### Scenario: Visitor opens the old apex domain

- **WHEN** a visitor requests a path and query on `http://brpatl.com` or `https://brpatl.com`
- **THEN** the response redirects to the same path and query on `https://metroatlantasaves.com`

#### Scenario: Visitor opens the old www hostname

- **WHEN** a visitor requests a path and query on HTTP or HTTPS at `www.brpatl.com`
- **THEN** the response redirects to the same path and query on `https://metroatlantasaves.com`

#### Scenario: Visitor opens the new www hostname

- **WHEN** a visitor requests a page at `www.metroatlantasaves.com`
- **THEN** the production site may serve it without redirecting to the apex

#### Scenario: Visitor opens the new apex over HTTP

- **WHEN** a visitor requests a path and query on `http://metroatlantasaves.com`
- **THEN** the response redirects to the same path and query on `https://metroatlantasaves.com`

### Requirement: The canonical production domain is routed securely

The production deployment SHALL route the canonical domain to the existing application services and provide a valid TLS certificate before the domain is announced as live.

#### Scenario: Visitor opens the canonical site after cutover

- **WHEN** a visitor opens `https://metroatlantasaves.com`
- **THEN** the frontend and its `/api` routes are served by the production deployment over valid HTTPS

### Requirement: The staging hostname and edge configuration remain unchanged

This change SHALL leave the staging site at `metro-atlanta-saves.c4g.dev` and SHALL NOT change its hostname, DNS records, TLS configuration, or edge routing.

#### Scenario: Production domain cutover is prepared

- **WHEN** production DNS, Coolify routing, or TLS is updated for the new canonical domain and its redirects
- **THEN** the staging hostname and its existing DNS, TLS, and routing configuration remain unchanged
