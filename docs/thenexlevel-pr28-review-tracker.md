# theNEXlevel PR 28 review tracker

Review: https://github.com/C4G/metro-atlanta-saves/pull/28

This supplement records all eight October 22 review comments. The historical Word tracker was read and audited; this version-controlled supplement maintains the PR 28 resolutions.

- [4355266256](https://github.com/C4G/metro-atlanta-saves/pull/28#discussion_r4355266256): Unexpected database errors return a generic message; intended HTTP errors survive; retries remain bounded. Regression tests pass.
- [4355273130](https://github.com/C4G/metro-atlanta-saves/pull/28#discussion_r4355273130): Completion reads, staff writes, participant toggles, exports, and reminders use RequirementCompletion. A migration backfills distinct valid same-program completions, preserves existing table timestamps, and clears the old array. The empty column remains temporarily for client compatibility; the API derives its compatibility property from the join table. Physical column removal remains a subsequent schema cleanup.
- [4355276457](https://github.com/C4G/metro-atlanta-saves/pull/28#discussion_r4355276457): Monthly progress and saving requirement IDs use typed initial-state constants.
- [4355282885](https://github.com/C4G/metro-atlanta-saves/pull/28#discussion_r4355282885): No global timeout existed. Added the shared five-second snackbar default and removed the redundant task-error timeout.
- [4355289544](https://github.com/C4G/metro-atlanta-saves/pull/28#discussion_r4355289544): Credit-score helper is a private arrow-function constant; regression tests exercise the public store computed.
- [4355296665](https://github.com/C4G/metro-atlanta-saves/pull/28#discussion_r4355296665): Task projection lives in the store computed; the component consumes the signal directly.
- [4355297393](https://github.com/C4G/metro-atlanta-saves/pull/28#discussion_r4355297393): Store date labels use Angular formatDate with injected LOCALE_ID.
- [4355300416](https://github.com/C4G/metro-atlanta-saves/pull/28#discussion_r4355300416): Direct innerHTML binding retains Angular sanitization. A regression test verifies supported markup survives while scripts, event handlers, and executable URLs are blocked.

## Validation

59 tests passed across completion services (16), requirements and reminders (21), monthly progress (12), participant pages (5), and participant store (5). Angular and backend compilation passed; existing optional-chain warnings remain in savings templates. Lint found no errors; existing backend any-type warnings remain.

The migration ran against temporary PostgreSQL fixture tables inside a rolled-back transaction, verifying deduplication, rejection of cross-program requirements, and clearing legacy arrays. No live application data was changed.

Historical tracker requirements checked: semantic theme tokens, standalone Material imports, Tailwind presentation, store computed projections, generated model types, and safe HTML binding. The original Word file remains the historical record; this supplement is the maintained PR 28 update.
