## Why

Learners can see a shared program requirement due date, but the system does not remind them before it arrives. Email reminders give enrolled learners a timely prompt to complete requirements while keeping the reminder schedule consistent for everyone in the program.

## What Changes

- Let partner staff optionally configure one reminder per requirement, either one calendar day or seven calendar days before its due date.
- Send the reminder by email to each enrolled learner who has not completed the requirement, at 9:00 a.m. Eastern time (`America/New_York`).
- Persist scheduled delivery and send state in PostgreSQL and process it through NestJS so restarts, retries, and repeated scheduler runs do not routinely lose or duplicate reminders.
- Use the existing mail service for delivery and update pending reminders when the requirement due date or reminder setting changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `program-requirements`: Add optional per-requirement reminder configuration and email delivery behavior for enrolled learners who remain incomplete.

## Impact

- Requirement Prisma model and migration, create/update DTOs, requirements service, and partner-staff requirement form.
- NestJS scheduled reminder processing backed by PostgreSQL delivery records.
- Existing mail service and a new requirement reminder email template.
- Learner completion data from both `RequirementCompletion` and legacy `UsersOnPrograms.requirementStatus` must be considered before sending.
