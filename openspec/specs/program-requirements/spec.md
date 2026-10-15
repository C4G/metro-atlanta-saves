# Program Requirements Specification

## Purpose

Program requirements describe what learners need to complete and show their progress. This capability lets a program include learner-reported actions with clear instructions and a recorded completion time.

## Requirements

### Requirement: Action requirements provide learner-facing instructions

The system MUST allow a requirement to include optional action instructions. When a requirement has action instructions, the learner's program progress dashboard MUST show the instructions with the requirement name and provide a control for the learner to mark the action complete. Requirements without action instructions MUST retain their existing completion behavior, including educational content links.

#### Scenario: Learner views an action requirement

- **WHEN** an enrolled learner opens program progress for a requirement with action instructions
- **THEN** the dashboard shows the requirement name, instructions, and a control to mark the action complete

#### Scenario: Requirement has no action instructions

- **WHEN** an enrolled learner opens program progress for a requirement without action instructions
- **THEN** the dashboard retains the requirement's existing presentation and educational content link behavior

### Requirement: Program requirements have optional shared due timestamps

The system MUST allow partner staff to set an optional due timestamp on a program requirement. The timestamp MUST be associated with the requirement and apply equally to all learners enrolled in that program; it MUST NOT vary by learner. When a due timestamp is set, the learner's program progress dashboard MUST display it with the requirement. When no due timestamp is set, the dashboard MUST NOT show a due timestamp for that requirement.

#### Scenario: Learner sees the program requirement due timestamp

- **WHEN** a learner opens program progress for a requirement with a configured due timestamp
- **THEN** the dashboard displays that timestamp for the requirement, using the same configured value for every learner in the program

#### Scenario: Requirement has no due timestamp

- **WHEN** a learner opens program progress for a requirement without a configured due timestamp
- **THEN** the dashboard does not display a due timestamp for that requirement

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

### Requirement: Learner can record completion of an action requirement

The system MUST allow an enrolled learner to mark an action requirement complete from their program progress dashboard. The system MUST record the completion time and show the requirement as complete on subsequent reads. Action completion is a learner-reported action and does not require staff approval.

#### Scenario: Learner completes an action

- **WHEN** an enrolled learner marks an eligible action requirement complete
- **THEN** the system records the completion time for that learner and requirement and reports the requirement as complete

#### Scenario: Learner views a completed action

- **WHEN** an enrolled learner opens program progress after completing an action requirement
- **THEN** the requirement is shown as complete and its completion control is no longer available

#### Scenario: Learner cannot complete another user's requirement

- **WHEN** a learner attempts to complete a requirement for a different user, a program they are not enrolled in, or a requirement without action instructions
- **THEN** the system rejects the request and does not create a completion record

### Requirement: Action completion records keep the first completion time

The system MUST associate an action completion timestamp with the specific learner, program, and requirement. Repeated completion requests for an already completed requirement MUST leave the original timestamp unchanged and MUST NOT create duplicate completions.

#### Scenario: Completion request is repeated

- **WHEN** the same learner submits another completion request for an already completed action requirement
- **THEN** the system keeps the original completion timestamp and returns the requirement as complete

### Requirement: Action completions count toward program progress

The system MUST include action completions in learner progress totals and staff completion reporting. Existing completions stored as requirement IDs in `requirementStatus` MUST remain recognized, and a requirement completed through both existing status data and an action completion record MUST count only once.

#### Scenario: Action completion updates progress

- **WHEN** a learner completes an action requirement
- **THEN** the learner's completed requirement count and program progress percentage include that requirement

#### Scenario: Staff views or exports program completion

- **WHEN** partner staff views participant completion status or exports program completion data
- **THEN** action-completed requirements are shown as completed alongside existing `requirementStatus` completions

#### Scenario: Existing completion records are read

- **WHEN** a learner or staff member views progress for a requirement already listed in `requirementStatus`
- **THEN** that requirement remains shown and counted as completed without requiring a completion timestamp backfill
