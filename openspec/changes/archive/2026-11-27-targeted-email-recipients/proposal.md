## Why

The admin email campaign currently reaches every user, so administrators cannot target a relevant audience without sending unrelated users the same message. Add explicit audience selection so a campaign can reach chosen people, one discussion board's members, or one program's participants.

## What Changes

- Replace the implicit all-users audience with explicit recipient selection on the admin email campaign page.
- Provide tabs for users, discussion boards, and programs, with role filters for users (participants, partner staff, and admins).
- Allow multiple individual users, or exactly one board, or exactly one program; prevent mixing audience types.
- Send the selected audience to the backend and resolve the final recipient set server-side, retaining existing campaign opt-out and individual-message delivery behavior.
- Automatically append a link to the selected discussion board at the end of the message body when a board is the chosen audience.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outbound-email`: Administrator campaigns can target an explicit user, board-member, or program-participant audience while preserving campaign delivery and opt-out requirements.

## Impact

- Frontend: `libs/frontend/admin/src/lib/email-blast/` and shared stores for users, boards, and programs.
- Backend: administrator campaign endpoint and user, discussion-board, and program membership lookup services.
- API payload changes for `/api/users/send-email`; current frontend and backend must be updated together.
