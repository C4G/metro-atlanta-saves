## 1. Requirement configuration and persistence

- [x] 1.1 Add nullable action instructions and an optional program-level due timestamp to `Requirement`, plus the timestamped learner completion relation with unique learner/program/requirement identity; verify the Prisma migration applies and generated models expose the new fields and relations.
- [x] 1.2 Extend requirement create/update DTOs and the partner-staff add/edit form to save optional action instructions and due timestamps; verify both values persist through create and edit and are returned by the requirement API.

## 2. Learner action completion

- [x] 2.1 Extend learner program reads and add an authenticated self-completion endpoint that validates enrollment, requirement/program association, and action eligibility; verify unauthorized and non-action requests create no record and repeated valid requests preserve the first timestamp.
- [x] 2.2 Extend shared learner program state and the My Progress cards to show action instructions, any configured due timestamp, and a manual completion control; verify the same program-level due timestamp appears for enrolled learners and action completion remains after reloading progress.

## 3. Progress compatibility and reporting

- [x] 3.1 Combine timestamped action completion IDs with existing `requirementStatus` IDs, deduplicating by requirement; verify legacy completions remain recognized and overlaps count once.
- [x] 3.2 Update staff participant completion badges, cohort progress calculations, and Excel exports to use combined completion IDs; verify an action completion appears as complete in each staff reporting surface.
- [x] 3.3 Add focused backend and frontend coverage for action configuration, shared due timestamps, authorization, idempotent completion timestamps, learner progress, and legacy compatibility; verify the focused test suites pass.
- [x] 3.4 Verify the affected application builds pass.
