## 1. Persist reminder configuration and delivery state

- [x] 1.1 Add nullable `reminderDaysBefore` to `Requirement` and a migration constraint limiting it to `1` or `7` and requiring a due timestamp; verify Prisma schema validation and migration SQL.
- [x] 1.2 Add the PostgreSQL reminder delivery status and per-learner delivery model with due-date snapshot, scheduled instant, attempt/retry state, unique delivery identity, indexes, and cascading enrollment/requirement relations; verify generated Prisma types and database constraints.

## 2. Configure reminders with requirements

- [x] 2.1 Extend requirement create/update DTOs and service validation to accept only `null`, `1`, or `7`, validate partial updates against the effective due timestamp, and clear the offset when `dueAt` is removed; verify API create/update behavior and invalid combinations.
- [x] 2.2 Add a partner-staff selector for no reminder, one day, or one week before and include the offset in create/edit payloads; verify each selection round-trips through the requirement API.

## 3. Schedule and dispatch durable reminders

- [x] 3.1 Add timezone-aware scheduled-instant calculation using the due timestamp's Eastern calendar date and 9:00 a.m. `America/New_York`; verify one-day and seven-day dates across both daylight-saving transitions.
- [x] 3.2 Add reminder reconciliation for requirement create/update and program enrollment changes, plus startup/periodic repair; verify due-date or offset edits cancel stale pending deliveries and create the current learner deliveries idempotently.
- [x] 3.3 Add a NestJS scheduled worker that atomically claims due PostgreSQL rows, recovers expired processing leases, rechecks enrollment and both completion sources, and skips completed or stale reminders; verify concurrent worker runs do not claim the same logical delivery.
- [x] 3.4 Add retry/backoff state updates for temporary mail errors and preserve delivery status across worker restarts; verify a due pending delivery resumes after restart and exhausted retries retain a failure reason.

## 4. Send the requirement reminder email

- [x] 4.1 Add a `MailService` method and template with the requirement name, due timestamp labeled Eastern, and learner progress link; verify the message is sent individually to each eligible learner.
- [x] 4.2 Add focused backend and frontend coverage for configuration, due-time calculation, stale schedules, completion suppression, retry/idempotency, and the staff selector; verify the affected test targets pass.

## 5. Integration verification

- [x] 5.1 Verify the backend and affected frontend projects build with the new scheduler, migration, and email template, and confirm existing requirement completion and reporting behavior remains intact.
