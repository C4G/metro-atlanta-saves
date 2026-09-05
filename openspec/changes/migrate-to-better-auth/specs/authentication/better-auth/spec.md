## Purpose

Provide secure, server-managed authentication and impersonation while preserving existing user accounts, application roles, relationships, and passwords during the migration.

## ADDED Requirements

### Requirement: Existing user credentials remain usable

The system SHALL allow every migrated user to sign in with the password that was valid before the authentication cutover. Invalid passwords SHALL remain rejected, and newly created or changed passwords SHALL continue to be stored and verified using the configured password-hashing policy.

#### Scenario: Migrated user signs in with the existing password

- **WHEN** a migrated user submits the email address and password that were valid before the cutover
- **THEN** the system creates an authenticated session for that same user

#### Scenario: Migrated user submits an invalid password

- **WHEN** a migrated user submits an incorrect password
- **THEN** the system rejects the sign-in and does not create a session

### Requirement: Authenticated requests use managed sessions

The system SHALL authenticate protected API requests using a valid managed session. Existing JWT access tokens and their cookies SHALL NOT authenticate requests after the cutover.

#### Scenario: Request has a valid managed session

- **WHEN** an authenticated user requests a protected API resource with a valid session
- **THEN** the request proceeds with the current application user attached

#### Scenario: Request has only a legacy JWT

- **WHEN** a user requests a protected API resource using only an access token issued by the previous authentication system
- **THEN** the request is rejected as unauthenticated

#### Scenario: User signs out

- **WHEN** an authenticated user signs out
- **THEN** the current managed session is invalidated and subsequent protected requests using it are rejected

### Requirement: Existing application identity is preserved

The system SHALL preserve each migrated user's existing identifier, email address, first and last names, application role, partner association, profile data, and existing program-related relationships. Protected application behavior SHALL evaluate the current stored user data rather than stale identity claims.

#### Scenario: Migrated user accesses application data

- **WHEN** a migrated user signs in and requests application data
- **THEN** the request is associated with the same user identifier and application relationships that existed before migration

#### Scenario: User role or partner association changes

- **WHEN** an administrator changes a user's role or partner association
- **THEN** subsequent authenticated requests use the updated authorization data

### Requirement: Impersonation is restricted by requester role and target scope

The system SHALL allow `Administrator` users to impersonate any user. The system SHALL allow `Partner_Staff` users to impersonate either another `Partner_Staff` user associated with the same partner or a regular user who is a member of at least one program owned by the requesting staff member's partner. The system SHALL reject impersonation requests from all other users.

#### Scenario: Administrator impersonates a user

- **WHEN** an authenticated `Administrator` requests impersonation of an existing user
- **THEN** the system creates an impersonation session for the selected target

#### Scenario: Partner Staff impersonates an in-scope regular user

- **WHEN** an authenticated `Partner_Staff` with a partner association requests impersonation of a target with no elevated application role
- **AND** the target has a program membership whose program belongs to the requesting staff member's partner
- **THEN** the system creates an impersonation session for the target

#### Scenario: Partner Staff impersonates same-partner staff

- **WHEN** an authenticated `Partner_Staff` with a partner association requests impersonation of another `Partner_Staff` user
- **AND** the target has the same partner association as the requesting staff member
- **THEN** the system creates an impersonation session for the target

#### Scenario: Partner Staff targets a user outside their partner

- **WHEN** an authenticated `Partner_Staff` requests impersonation of a regular user
- **AND** the target has no membership in a program owned by the requesting staff member's partner
- **THEN** the system rejects the request and does not create an impersonation session

#### Scenario: Partner Staff targets an elevated or out-of-partner staff user

- **WHEN** an authenticated `Partner_Staff` requests impersonation of an `Administrator` or a `Partner_Staff` user associated with another partner
- **THEN** the system rejects the request

#### Scenario: User without impersonation permission makes a request

- **WHEN** an authenticated user without an allowed impersonation role requests impersonation
- **THEN** the system rejects the request and does not create an impersonation session

#### Scenario: Partner Staff has no partner association

- **WHEN** a `Partner_Staff` user without a partner association requests impersonation
- **THEN** the system rejects the request and does not create an impersonation session

### Requirement: Impersonation preserves an auditable return path

The system SHALL record the originating user for an impersonation session and SHALL allow the originating user to stop impersonating and return to their own session. While impersonating, application authorization SHALL evaluate the target user's identity and role.

#### Scenario: User starts impersonation

- **WHEN** an allowed administrator or partner staff member starts impersonation
- **THEN** the resulting session identifies the target user and records the originating user

#### Scenario: Originating user stops impersonation

- **WHEN** the originating user stops impersonating
- **THEN** the target session ends and the originating user's session is restored

#### Scenario: Impersonation session expires

- **WHEN** an impersonation session reaches its configured expiration
- **THEN** it can no longer authenticate protected requests

### Requirement: Candidate discovery reflects impersonation permissions

The system SHALL present administrators with all users and SHALL present partner staff with same-partner staff and regular users in their partner's programs. Server-side authorization SHALL remain authoritative even when a target is not shown in the user interface.

#### Scenario: Partner Staff loads impersonation candidates

- **WHEN** a `Partner_Staff` user opens the impersonation flow
- **THEN** administrators and partner staff from other partners are excluded, along with regular users outside the partner's programs

#### Scenario: Client bypasses candidate filtering

- **WHEN** a `Partner_Staff` submits a target identifier that is not an allowed candidate
- **THEN** the server rejects the request
