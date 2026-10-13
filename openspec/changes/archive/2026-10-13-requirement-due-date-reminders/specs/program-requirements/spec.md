## ADDED Requirements

### Requirement: Partner staff can configure one shared requirement reminder

The system MUST allow partner staff to configure an optional reminder for a program requirement with a due timestamp. The configured reminder MUST be either one or seven calendar days before the due date, and the same offset MUST apply to every learner in the program. No reminder MUST be sent when no offset is configured. A reminder offset MUST NOT be retained when the due timestamp is removed.

#### Scenario: Requirement has no reminder configured

- **WHEN** partner staff create or update a requirement without selecting a reminder offset
- **THEN** the requirement has no scheduled email reminder

#### Scenario: Partner staff select a reminder offset

- **WHEN** partner staff configure a reminder for a requirement with a due timestamp
- **THEN** they can select either one or seven calendar days before that shared due date

#### Scenario: Due timestamp is removed

- **WHEN** partner staff remove the due timestamp from a requirement
- **THEN** the system clears the reminder setting and cancels any pending reminder for that due timestamp

### Requirement: Incomplete learners receive the configured email reminder

The system MUST send an individual email to each learner enrolled in the requirement's program who has not completed the requirement. It MUST send the email at 9:00 a.m. Eastern time (`America/New_York`) on the calendar date one or seven days before the due date, according to the configured offset. The email MUST identify the requirement and its due date. The system MUST NOT send a reminder to a learner who completed the requirement before delivery.

#### Scenario: One-day reminder is due

- **WHEN** a requirement is configured for one day before and its due date is tomorrow in `America/New_York`
- **THEN** each enrolled learner who has not completed it receives an individual reminder email at 9:00 a.m. Eastern time today

#### Scenario: Seven-day reminder is due

- **WHEN** a requirement is configured for seven days before and its due date is seven calendar days away in `America/New_York`
- **THEN** each enrolled learner who has not completed it receives an individual reminder email at 9:00 a.m. Eastern time today

#### Scenario: Learner completes before reminder delivery

- **WHEN** a learner completes the requirement before its scheduled reminder is delivered
- **THEN** the system skips that learner's reminder

### Requirement: Requirement reminder deliveries survive scheduler interruptions

The system MUST persist reminder delivery state so pending reminders remain eligible after a backend restart. Temporary email delivery failures MUST be retried. Repeated scheduling runs MUST NOT create a second logical delivery for the same learner, requirement due timestamp, and reminder offset. When the due timestamp or reminder offset changes, the system MUST cancel obsolete pending deliveries and schedule the current reminder for enrolled learners who remain incomplete.

#### Scenario: Backend restarts with a pending reminder

- **WHEN** the backend restarts while a reminder is pending or due for delivery
- **THEN** the system retains the delivery and processes it when the scheduler resumes, provided the requirement has not passed its due timestamp

#### Scenario: Email delivery temporarily fails

- **WHEN** the email service temporarily fails to deliver a reminder
- **THEN** the system retains the delivery state and retries the email

#### Scenario: Requirement due timestamp changes

- **WHEN** partner staff change a requirement's due timestamp before its reminder is delivered
- **THEN** the pending delivery for the old due timestamp is canceled and a delivery is scheduled using the current due timestamp and reminder offset

#### Scenario: Reminder offset changes

- **WHEN** partner staff change the reminder offset before delivery
- **THEN** the pending delivery for the old offset is canceled and a delivery is scheduled using the selected offset
