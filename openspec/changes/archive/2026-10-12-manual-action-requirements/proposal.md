## Why

Program requirements currently track completion as a list of requirement IDs, so learners cannot record when they complete actions that happen outside the application. Requirements such as attending an in-person meetup or posting in a discussion board need clear instructions in the learner dashboard and a way for the learner to mark the action complete.

## What Changes

- Add optional action instructions to program requirements so staff can describe what a learner needs to do.
- Add an optional due timestamp to each program requirement, shared by all learners enrolled in that program.
- Show those instructions and a completion control on the learner's program progress dashboard.
- Show a configured requirement due timestamp on the learner's program progress dashboard.
- Let an enrolled learner record completion for an action requirement and persist the completion timestamp.
- Include action completions in learner progress and staff completion reporting while preserving existing completion records.

## Capabilities

### New Capabilities

- `program-requirements`: Defines how action requirements are configured, displayed, completed by learners, and included in program progress.

### Modified Capabilities

None.

## Impact

- Prisma `Requirement` and user-program completion persistence, migrations, and generated client models.
- Requirement create/edit forms and API DTOs in the partner-staff application, including the shared due timestamp.
- The learner program progress dashboard and shared program-progress data access.
- Backend requirement and user-program APIs, including authorization for learner self-completion.
- Staff completion views, progress percentages, and exported completion reports that currently use `requirementStatus`.
