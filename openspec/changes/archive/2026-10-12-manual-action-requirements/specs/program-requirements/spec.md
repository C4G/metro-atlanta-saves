## Purpose

Program requirements describe what learners need to complete and show their progress. This capability lets a program include learner-reported actions with clear instructions and a recorded completion time.

## ADDED Requirements

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
