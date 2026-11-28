## 1. Recipient Selection UI

- [x] 1.1 Add Users, Discussion Boards, and Programs tabs to the admin email campaign route and verify switching tabs clears the prior audience selection.
- [x] 1.2 Add searchable multi-select users with Participants, Partner staff, and Admins filters, modeled on the mimic-user modal; verify role filters and selection persistence within the Users mode.
- [x] 1.3 Add searchable single-select board and program lists with clear selected-audience state; verify each mode permits only one selection.
- [x] 1.4 Require a selected audience before enabling campaign submission and show the selected audience in the submit action; verify invalid form or empty audience cannot submit.

## 2. Audience Resolution and Delivery

- [x] 2.1 Extend the campaign request DTO with the discriminated audience shape and reject absent, malformed, or mixed audience values; verify invalid requests return an error without invoking email delivery.
- [x] 2.2 Resolve individual user IDs, board members, and program participants from current database relationships and reject unknown or empty audiences; verify each audience mode resolves only the intended recipients.
- [x] 2.3 Pass the resolved recipient set through the existing campaign unsubscribe and individually addressed delivery pipeline; verify opted-out recipients remain excluded and the existing content and delivery behavior are preserved.
- [x] 2.4 Update the frontend email campaign store to submit the selected audience and report success/failure consistently; verify the request payload matches the selected mode.

## 3. Integration

- [x] 3.1 Confirm administrator-only access and all-record directory APIs support selecting any registered user, board, and program; add narrowly scoped administrator read APIs if current APIs do not provide complete lists, and verify permissions and returned data.
- [x] 3.2 Verify the integrated campaign flow for individual users, one board, and one program, including role filtering, mutual exclusion, empty audience rejection, and opt-out exclusion.

## 4. Eligible Group Recipients

- [x] 4.1 Exclude administrators, board admins, allies associated with the selected program/board, and partner staff/program coordinators from board and program recipients; keep opted-out recipients excluded.

## 5. Discussion Board Link

- [x] 5.1 Remove the manually entered discussion board ID field and append a link for the selected board audience to the end of the message body.
- [x] 5.2 Remove the prior automatically appended board link when the recipient audience changes.
