## Context

See [proposal.md](proposal.md) for the motivation and scope. Today, `Requirement` has a name and an optional educational content relation. `UsersOnPrograms.requirementStatus` is a `String[]` of requirement IDs. Partner staff can set that array when managing enrollment, and learner progress, staff badges, cohort percentages, and Excel exports use it as the completion source. It has no completion timestamp.

The learner's My Progress view reads the enrolled user's program and requirements through the authenticated `GET users-on-programs/user/program/:id` route. That route already restricts the response to the signed-in learner's own enrollment. Requirement create/edit requests are handled separately by the partner-staff requirement API.

## Goals / Non-Goals

**Goals:**

- Let staff configure plain-text action instructions on a requirement.
- Let staff configure an optional due timestamp that applies to all learners in the program and show it on learner progress.
- Record a server timestamp when an enrolled learner marks an action complete.
- Include both new action completions and existing `requirementStatus` IDs in learner and staff progress.
- Keep existing completion data usable without assigning invented timestamps to old records.

**Non-Goals:**

- Verifying attendance or discussion activity through an external service.
- Staff approval, evidence uploads, repeating actions, or undoing a recorded completion.
- Replacing or migrating existing `requirementStatus` values.
- Rich-text formatting for action instructions.
- Per-learner due dates, deadline reminders, or blocking completion after a deadline.

## Decisions

### Use optional instructions to identify an action requirement

Add a nullable `actionInstructions` text field to `Requirement` and expose it through the existing create/update DTOs and staff form. A non-empty value marks the requirement as learner-completable; the same instructions are shown on My Progress. This avoids a second configuration flag that could disagree with whether instructions exist. Requirements without instructions keep their current display and educational-content link behavior. If both instructions and educational content are configured, the dashboard can show both the existing content link and the action control.

Alternative considered: add a requirement-type enum. An enum would distinguish action requirements even without instructions, but this request requires instructions for the action control and does not define additional completion types. The optional field is sufficient for this scope.

### Store due time on the requirement

Add an optional `dueAt` timestamp to `Requirement`, expose it through the existing create/update API, and make it editable in the partner-staff requirement form. A requirement belongs to one program, so this single value is shared by all learners enrolled in that program. The learner dashboard displays the configured timestamp in the learner's local date/time format with a timezone label; a missing value produces no due-date display. Completion remains available after the due time because deadline enforcement is outside this change.

Alternative considered: store a due time on each user-program enrollment. That would allow different deadlines per learner and duplicate the same value across participants, contrary to the requested program-level behavior.

### Store timestamped completions in a separate relation

Add a `RequirementCompletion` record related to a user-program enrollment and a requirement, with `completedAt` set by the backend. A unique key on user, program, and requirement makes completion one-time and makes repeated requests idempotent. The request derives the learner identity from the authenticated session, validates that the requirement belongs to the requested program, and only accepts requirements with non-empty action instructions.

Keep `UsersOnPrograms.requirementStatus` unchanged. It supports staff-managed and historical completion state but cannot retain timestamps. Do not backfill the new relation from those IDs because their actual completion times are unknown. On reads, combine IDs from the legacy array with IDs from timestamped records and deduplicate before counting or displaying completion. Expose the timestamped records to the learner progress view so it can show the completion time where appropriate.

Alternative considered: replace the string array with timestamp objects or JSON. This would change the Prisma field type and every existing consumer, and would make staff-managed legacy values harder to migrate. A normalized completion relation preserves the current contract and enforces one completion per learner and requirement.

### Place learner completion under the user-program API

Add a session-authenticated endpoint under the existing `users-on-programs` API. It takes the program and requirement identifiers but no learner identifier; the server uses the session user and verifies enrollment before writing. The completion upsert returns the requirement ID and original completion time. The learner store uses that response to update progress immediately or refresh its existing user-program payload.

The self-completion route must not use the staff-only authorization path for editing user-program records. Staff completion management continues to use the existing route and `requirementStatus` field.

### Aggregate both completion sources for staff views

Extend the participant data returned to staff with a deduplicated set of completed requirement IDs that unions `requirementStatus` with timestamped action completions. Use that set for the completed-requirements badge, cohort completion calculations, and Excel marks. Keep the persisted `requirementStatus` field intact for staff enrollment editing and compatibility.

### Cascade dependent completion rows

Deleting a requirement or removing a user's program enrollment should remove its action completion rows through their foreign-key relations. These rows only have meaning for the associated requirement and enrollment; there is no separate completion history after either is deleted.

## Risks / Trade-offs

- [Learners may report an action they did not perform] → Treat the click as a self-report, make the instruction clear, and leave verification workflows out of scope.
- [Two completion sources can diverge] → Keep the legacy field read-only to the aggregation path, union the identifiers at read time, and deduplicate before deriving status or percentages.
- [Repeated or concurrent clicks could create duplicate records] → Enforce the composite unique key in the database and use an idempotent upsert that preserves the first `completedAt` value.
- [Older action requirements may lack action instructions] → Do not infer action configuration from requirement names or educational content; existing rows retain their prior behavior until staff adds instructions.

## Migration Plan

1. Add nullable action-instructions and due-time columns plus the completion table with enrollment and requirement relations, uniqueness, and cascading deletion.
2. Deploy backend DTO, authorized completion endpoint, and combined completion reads while leaving the legacy array unchanged.
3. Deploy the staff form and learner progress control, display configured due timestamps, then update staff summaries and exports to use the combined completion set.
4. Roll back by reverting application code if needed. The additive database migration is safe to leave in place; no old completion data is rewritten.
