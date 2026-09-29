# Google Identity Specification

## Purpose

Allow users to authenticate or register with their Google identity through the application's managed authentication flow, including Google's One Tap prompt where supported.

## Requirements

### Requirement: Google sign-in and registration
The system SHALL allow users to sign in or register with Google from the login and registration experiences. A successful Google authentication SHALL create a managed application session and return the user to the application.

#### Scenario: Existing user signs in with Google
- **WHEN** a user completes Google authentication with a verified email address matching an existing application account
- **THEN** the system signs in that existing account and preserves its application user identifier, role, partner association, and profile data

#### Scenario: New user registers with Google
- **WHEN** a user completes Google authentication with a verified email address that is not associated with an application account
- **THEN** the system creates an application account under the same registration eligibility rules as email registration and starts a managed session for that account

#### Scenario: Google does not verify the email address
- **WHEN** Google authentication returns an email address that is missing or not verified
- **THEN** the system rejects authentication and does not create or link an application account or session

#### Scenario: Google authentication is cancelled or fails
- **WHEN** a user cancels Google authentication or the provider returns an error
- **THEN** the system returns the user to an authentication page with a recoverable error and leaves existing email and password authentication available

### Requirement: Google One Tap authentication
The system SHALL offer Google One Tap on the login and registration experiences where the browser and Google account support it. One Tap authentication SHALL use the same identity validation, account matching, registration eligibility, and managed-session behavior as Google sign-in.

#### Scenario: User completes One Tap authentication
- **WHEN** a user selects a Google account and completes the One Tap prompt
- **THEN** the system authenticates or registers the matching application user and starts a managed session

#### Scenario: One Tap is unavailable or dismissed
- **WHEN** the browser cannot display One Tap or the user dismisses the prompt
- **THEN** the user can continue with the Google sign-in button or email and password form

#### Scenario: One Tap credential is invalid
- **WHEN** the One Tap credential is expired, invalid, or issued for an unauthorized application origin
- **THEN** the system rejects the credential and does not create a session

### Requirement: Google authentication preserves application authorization
The system SHALL treat the existing application user record as the source of truth for application roles, partner associations, and profile data after Google authentication. Google profile data SHALL NOT grant application privileges.

#### Scenario: Google sign-in returns for a user with an application role
- **WHEN** a Google identity is linked to an existing application user with an assigned role or partner association
- **THEN** the authenticated session uses that existing user's application authorization data

#### Scenario: Google profile contains an elevated role claim
- **WHEN** Google profile data contains fields unrelated to the application's authorization source
- **THEN** the system does not use those fields to assign an application role or partner association
