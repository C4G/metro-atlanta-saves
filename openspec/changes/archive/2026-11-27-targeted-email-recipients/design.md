## Context

The admin email campaign currently posts only `subject` and `body` to `/api/users/send-email`; the backend resolves the full campaign audience. The admin route can load all users through `UsersStore`, all discussion boards through the admin boards endpoint, and programs through the programs directory API. The mimic-user modal offers a relevant precedent for searchable people lists and role filters. See proposal.md and specs/outbound-email/spec.md for motivation and behavior.

## Goals / Non-Goals

**Goals:**

- Keep the recipient mode and final recipient resolution explicit from the UI through the administrator-only backend endpoint.
- Reuse system user roles, board membership, program enrollment, and ally associations to resolve the selected participant group.
- Exclude administrators, board administrators, allies, and partner staff/program coordinators from board and program audiences.
- Preserve the existing campaign mail pipeline, including unsubscribe handling and per-recipient addressing.

**Non-Goals:**

- Changing campaign content authoring or campaign opt-out behavior beyond automatically adding the selected board's link.
- Adding support for arbitrary email addresses, multiple boards, multiple programs, or mixed audience types.
- Allowing a manually entered discussion board ID or an independent discussion-link control.

## Decisions

- Model the request audience as a discriminated choice: `{ type: 'users', userIds: string[] }`, `{ type: 'board', boardId: string }`, or `{ type: 'program', programId: string }`. Require exactly one valid shape in backend validation. This makes mutually exclusive modes explicit and is safer than inferring audience type from optional overlapping IDs.
- Resolve recipient IDs on the server from current records. Individual mode accepts registered user IDs; board mode resolves non-admin participant members and excludes board admins and allies associated with the board's program; program mode resolves participant enrollments while excluding allies. Users with a non-null system role (administrators and partner staff/program coordinators) are excluded from both group modes. Validate selected IDs and reject invalid or empty selections before any email is sent. The existing campaign pipeline then applies opt-outs and individual delivery.
- Build the route UI as three top-level tabs (Users, Discussion Boards, Programs), following the mimic modal's searchable list and role-filter treatment. Users can multi-select people and filter among Participants, Partner staff, and Admins. Board and program tabs allow one selection. Switching tabs changes the audience mode and clears the prior mode's selection so modes cannot be combined.
- Use the admin-capable list APIs for recipients, boards, and programs. Do not treat the currently user-scoped board/program lists as complete campaign audiences. If a necessary all-records API is missing or does not return participant membership, add a narrowly scoped administrator API for the needed audience data rather than relying on client-side guessed membership.
- Update the frontend request and backend DTO together. Since the endpoint is only available to administrators and its caller is the same application, an audience is required for every new request; backend validation prevents legacy or malformed no-audience calls from retaining implicit all-user behavior.
- For board audiences, append a link to the selected board at the end of the message body. Remove the previously appended board link when the audience changes so only the currently selected board can contribute this automatic link. The board ID comes from the selected audience, not a separate text field.

## Risks / Trade-offs

- [A board or program can have no eligible participants or members] → Show counts where available and reject submission with a clear message when the resolved recipient list is empty.
- [Membership can change between list display and submission] → Resolve membership at send time on the backend; the submitted identifier selects a group, not a cached recipient list.
- [Large programs or boards may create large campaigns] → Preserve the existing mail provider batching path and avoid returning full recipient records to the browser when a selector only needs a count and label.

## Migration Plan

Deploy the frontend and backend changes together. No database migration is required. Rollback restores the prior all-users endpoint and UI together; do not deploy a frontend that sends the new audience shape against the old backend or vice versa.
