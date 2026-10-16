# PR 27 review audit

This supplements the TheNexLevel Review Comment Tracker with all eight inline comments on PR 27. PR 24 is merged into main, and PR 27 already includes that merge. The participant program redesign and authentication redesign remain separate local work.

| ID | Review request | Resolution and evidence |
| --- | --- | --- |
| C27-01 | Restrict participant completion permissions. | Restored the existing action-requirement rule. A due date alone never authorizes self-completion. Enrollment and requirement program ownership remain enforced server-side. Regression test rejects dated non-action requirements. [Source](https://github.com/C4G/metro-atlanta-saves/pull/27#discussion_r4290997575) |
| C27-02 | Include screenshots in the PR body. | Light, dark, and mobile calendar screenshots are included in `pr27/` using illustrative participant data. Publication remains pending. [Source](https://github.com/C4G/metro-atlanta-saves/pull/27#discussion_r4291009551) |
| C27-03 | Use a signal store for API resources. | ParticipantRequirementsStore owns retrieval, completion, pending writes, loading, errors, and retry. It is scoped to the calendar so data does not leak across sessions. The component derives presentation through computed signals. [Source](https://github.com/C4G/metro-atlanta-saves/pull/27#discussion_r4291012637) |
| C27-04 | Call a signal setter directly in the template. | Day buttons call selectedDate.set(day.iso); the setter wrapper is removed. [Source](https://github.com/C4G/metro-atlanta-saves/pull/27#discussion_r4291014304) |
| C27-05 | Use Angular formatDate. | Calendar dates, month headings, day labels, and due times use formatDate, with LOCALE_ID for displayed dates. Local calendar keys use an explicit stable locale. [Source](https://github.com/C4G/metro-atlanta-saves/pull/27#discussion_r4291017554) |
| C27-06 | Do not allow participant undo pending partner confirmation. | Removed the DELETE completion route and service method. Completed cards show a disabled completion control. No replacement administrator reset API is introduced in this PR. Partner policy remains a follow-up. [Source](https://github.com/C4G/metro-atlanta-saves/pull/27#discussion_r4291021304) |
| C27-07 | Call changeMonth with an offset directly. | Previous and next month buttons call changeMonth(-1) and changeMonth(1). Both wrappers are removed. [Source](https://github.com/C4G/metro-atlanta-saves/pull/27#discussion_r4291023580) |
| C27-08 | Justify requirement element IDs and avoid duplicate IDs. | IDs are intentional deep-link targets: calendar cards link to the requirement UUID in the single routed course-progress view. The loop tracks the same unique UUID, and the app enables router anchor scrolling. Unnecessary calendar-heading ID is removed; the calendar has an accessible section label instead. [Source](https://github.com/C4G/metro-atlanta-saves/pull/27#discussion_r4291029247) |

## Global tracker audit

- G01: CI and Nx Agents configuration are unchanged; the affected lint/build/test/e2e-ci workflow remains authoritative.
- G02: The pnpm pre-commit hook is unchanged.
- G03: No production E2E startup changes.
- G04–G06: Public content routes and guards are unchanged.
- G07, G10, L01, L03, L07, L08: New presentation uses Tailwind utilities, with no component styles.
- G08, G11, G13: Calendar and program cards use existing global semantic tokens and the cookie-backed theme. No new palette or dark class pairs.
- G09: No calendar effects. Store requests own lifecycle through rxMethod; the new component does not track store method calls inside effects.
- G12: No route-coupled Playwright waitForResponse calls.
- G14: Calendar grouping, labels, counts, and selections use computed signals. Template methods only handle user actions.
- G15: Removed all important overrides from the calendar icon. No global Material overrides added.
- L02, L04: Calendar imports standalone MatIcon and RouterLink; no Material modules.
- L05: No new raster content images; screenshots are review evidence.
- L06: Program descriptions use the existing rich-content class and Angular HTML sanitization.
- L09–L11: No duplicate Prisma model interfaces. ParticipantRequirement is an aggregate API response shared through the models library.
- L12: No changes to global navigation sizing.
- L13: Loading and errors are explicit; a failed request does not present a misleading no-tasks state.
- D01: Existing shared DiscussionBoardsStore remains in use. New calendar HTTP operations now follow the signal-store resource pattern.
- P23-01–P23-02: No confirmation dialog or program-search changes.

## Verification status

Focused dashboard, data-access, and backend requirement checks pass, including the new store regression tests. The production frontend build passes. Light, dark, and 390px mobile screenshots have been visually inspected. The full affected lint/test run across 47 projects passes. Backend integration tests require permission to bind local HTTP ports; after rerunning outside the sandbox, all 43 backend tests pass. Fresh GitHub CI, including Nx Agents E2E, remains the final publication check.

The Word tracker has the same eight new review entries appended locally, but its required visual verification is blocked because the packaged renderer cannot locate LibreOffice. The Word copy remains a local draft; this Markdown supplement is the reviewable published tracker update. Historical global items remain preserved in the original saved Word tracker.
