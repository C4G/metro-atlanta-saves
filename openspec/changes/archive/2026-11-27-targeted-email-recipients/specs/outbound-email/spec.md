## MODIFIED Requirements

### Requirement: Application emails are delivered through Resend

The production and staging applications SHALL submit existing system-generated and administrator-triggered emails through Resend, including password reset, checkpoint status, image review, educational content, requirement reminders, discussion notifications, and bulk campaigns. A successful send operation SHALL preserve the existing message subject, content, templates, and HTML formatting unless separately changed. Administrator campaigns SHALL resolve recipients from exactly one explicitly selected audience: one or more individually selected users, all members of one discussion board, or participants enrolled in one program. A campaign SHALL exclude campaign opt-outs and SHALL NOT accept a mixture of audience types.

#### Scenario: Administrator sends to individually selected users

- **WHEN** an administrator selects one or more individual users and submits a campaign
- **THEN** the campaign is sent to those selected users, excluding opted-out recipients

#### Scenario: Administrator sends to a discussion board

- **WHEN** an administrator selects one discussion board and submits a campaign
- **THEN** the campaign is sent only to eligible participant members of that board, excluding administrators, board admins, allies associated with the board's program, partner staff/program coordinators, and opted-out recipients
- **AND** the message body includes a link to the selected discussion board appended after the authored content

#### Scenario: Administrator changes the selected discussion board

- **WHEN** an administrator changes the audience from a discussion board to individual users, a program, or another discussion board
- **THEN** the prior automatically appended board link is removed and, when a new board is selected, its link is appended to the message body

#### Scenario: Administrator sends to a program

- **WHEN** an administrator selects one program and submits a campaign
- **THEN** the campaign is sent only to participants enrolled in that program, excluding administrators, allies associated with that program, partner staff/program coordinators, and opted-out recipients

#### Scenario: Campaign audience is absent or mixes audience types

- **WHEN** a campaign request has no audience, has more than one board or program, or combines individual users with a board or program
- **THEN** the backend rejects the request without sending email

#### Scenario: Resend rejects an email submission

- **WHEN** Resend rejects a message or is unavailable
- **THEN** the send operation reports failure to its caller and does not report the message as successfully sent

#### Scenario: Application sends an existing email

- **WHEN** an existing application action triggers an email and Resend accepts the message
- **THEN** the intended recipient or recipients receive a Resend submission with the existing message purpose and content
