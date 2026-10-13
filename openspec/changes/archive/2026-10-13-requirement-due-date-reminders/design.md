## Context

See [proposal.md](proposal.md) for the motivation and scope. The existing `Requirement.dueAt` is a shared timestamp. Learners belong to programs through `UsersOnPrograms`; completion is represented by both timestamped `RequirementCompletion` records and legacy requirement IDs in `requirementStatus`. Requirements are created and edited through the requirements library and partner-staff form. `MailModule` already provides the application mail service. The app currently has no scheduled-job package or queue dependency.

## Goals / Non-Goals

**Goals:**

- Keep reminder configuration with the shared program requirement.
- Preserve pending work across backend restarts and make repeated or multi-instance scheduler runs safe.
- Use Eastern local calendar dates and adjust automatically for daylight saving time.
- Avoid adding Redis or a separate queue service for this workload.

**Non-Goals:**

- Per-learner reminder preferences or time zones.
- SMS, push, digest, or post-deadline reminders.
- Guaranteeing exactly-once email delivery across an ambiguous SMTP failure.

## Decisions

### Store an optional offset on the requirement

Add nullable `reminderDaysBefore` to `Requirement`; `null` disables reminders and `1` or `7` selects the single reminder offset. Validate the allowed values in create/update DTOs and validate the combined persisted state on partial updates. A database constraint should reject other offsets and require `dueAt` whenever an offset is configured. The existing staff form exposes “No reminder”, “1 day before”, and “1 week before”. Existing rows migrate with no reminder configured.

An enum or per-user preference would add concepts the request does not need. An integer makes the selected calendar-day offset explicit and keeps the due date and reminder policy together.

### Persist per-learner delivery rows in PostgreSQL

Add a `RequirementReminderDelivery` model with the enrolled learner, program, requirement, a due-timestamp snapshot, offset, scheduled instant, delivery status, attempt count, retry time, sent time, and last error. Use a unique identity on learner, program, requirement, due-timestamp snapshot, and offset. Relate the row to the enrollment and requirement with cascading deletes.

Store `scheduledAt` as an absolute instant (PostgreSQL `timestamptz`). Compute it by converting the requirement due timestamp to its Eastern calendar date, subtracting the selected calendar-day offset, and resolving 9:00 a.m. in `America/New_York`. PostgreSQL's IANA timezone rules handle daylight-saving transitions; do not use a fixed UTC offset or the server's local timezone.

Reconcile delivery rows when a requirement is created or updated and when an enrollment is added. Also reconcile at startup and periodically as a repair path. Reconciliation cancels stale pending rows and upserts current rows for enrolled learners who appear incomplete. The dispatcher rechecks the current due timestamp, offset, enrollment, and both completion sources immediately before sending so a completion or edit racing with the schedule is respected. A due delivery discovered after its scheduled instant is eligible for immediate catch-up only while the requirement's due timestamp is still in the future.

### Use NestJS scheduling to dispatch due rows

Add `@nestjs/schedule` and a reminder module/provider. A recurring cron poller claims due rows from PostgreSQL and sends them through a `MailService` method that addresses one learner per email. Claim rows atomically with PostgreSQL row locking (for example, `FOR UPDATE SKIP LOCKED`) and a recoverable processing lease so multiple backend instances can share the work. `sentAt`, status, retry time, and attempt count make delivery durable and observable. Retry temporary mail errors with backoff; log and retain the final error when a delivery cannot be sent.

A process-local timeout would be lost on restart and duplicated across app replicas. BullMQ would persist jobs but requires Redis, which the project does not currently operate; the PostgreSQL delivery table already provides the durable scheduling state needed here. NestJS's scheduler remains a wake-up mechanism, while PostgreSQL owns pending work.

### Reuse the existing requirement and mail flows

Expose the nullable offset in requirement create/update DTOs and responses, add the selector to the partner-staff requirement form, and clear the offset when staff remove `dueAt`. Add a focused mail template containing the requirement name, due timestamp with an Eastern timezone label, and a link to the learner's program progress. Send separate messages rather than putting multiple learner addresses in one email.

Completion suppression must union timestamped action completions with legacy `requirementStatus` IDs, matching existing progress behavior. A scheduled row for a learner who becomes complete is marked skipped at dispatch.

## Risks / Trade-offs

- [A database write can succeed while SMTP succeeds but the process fails before marking the row sent, so a retry can produce a duplicate email] → Use a stable delivery identity, claim and retry state, and document delivery as at-least-once across this failure window.
- [A reminder setting or enrollment change could race with delivery reconciliation] → Reconcile after mutations, run a periodic repair pass, and revalidate all current state at send time.
- [Timezone conversion can shift around daylight-saving boundaries] → Calculate with the `America/New_York` IANA zone and cover both DST transitions in focused verification.
- [Legacy completions are stored separately from timestamped action completions] → Check both sources before delivery and deduplicate completion IDs.

## Migration Plan

1. Add nullable `reminderDaysBefore` and a PostgreSQL constraint to `requirements`; existing rows remain disabled.
2. Add the delivery status and delivery table with its uniqueness, indexes, and cascading relations.
3. Deploy the backend scheduler, reconciliation, retries, and mail template. Pending records are generated from current requirements and enrollments; no historical reminder is backfilled for an already-past due date.
4. Deploy the partner-staff selector. Keep it disabled by default until staff select an offset.
5. Roll back by disabling the scheduler and reverting application code. The additive fields and delivery rows can remain in PostgreSQL; no existing completion data is rewritten.
