## Context

The discussion board already mounts a hand-built Tiptap editor in `apps/frontend/src/app/rich-text-editor.component.ts`. It emits HTML, supports a subset of the required formatting, and uploads images through the discussion-specific endpoint. The admin and partner-staff forms still import TinyMCE directly; all seven instances share the same toolbar and plugin configuration, and they rely on TinyMCE's Angular reactive-forms integration.

The application persists rich content as HTML strings and renders that HTML in multiple frontend libraries. Existing seeded content includes inline color and underline styles, nested lists, `div` blocks, and line breaks. Uploaded rich-content images must be publicly readable because the resulting HTML is rendered on public pages, while uploads themselves must remain authenticated.

## Goals / Non-Goals

**Goals:**

- Establish one reusable editor component that works with Angular reactive forms and the existing HTML value contract.
- Reach feature parity with the current TinyMCE configuration plus the formatting already used by the discussion editor.
- Preserve existing saved content when it is opened and saved through the new editor, including inline colors found in the user guide.
- Provide authenticated image upload with public URLs appropriate for rendered content.
- Remove TinyMCE runtime assets and dependencies after all consumers are migrated.

**Non-Goals:**

- Converting persisted content from HTML to Tiptap JSON.
- Bulk rewriting existing database records during deployment.
- Replacing the existing read-only HTML rendering components or redesigning their presentation styles.
- Adding collaborative editing, comments/annotations, media embeds, or arbitrary custom HTML beyond the supported content set.

## Decisions

### Put the editor in the shared frontend components library

Move the component from the application-only `apps/frontend/src/app` area into `libs/frontend/_shared/components`, export it from the library barrel, and import it from both the frontend application and feature libraries. This keeps application-specific UI out of the reusable library and avoids duplicating the editor for admin and discussion flows.

The component will implement Angular's `ControlValueAccessor` contract and expose only presentation/configuration inputs such as placeholder, minimum height, border styling, and upload context. The form control remains responsible for required validation and submission.

Alternative considered: keep the component in the frontend application and import it into libraries. This conflicts with the workspace's library boundaries and prevents the admin libraries from owning their editor dependency cleanly.

### Use an explicit, curated Tiptap document schema

Extend the existing Tiptap setup with the nodes and marks required by the behavior specification: tables, alignment, indentation, inline text styling/color, and source-mode handling, while retaining headings, lists, links, images, and history. Keep the toolbar custom and consistent across consumers rather than adopting a full prebuilt editor UI.

HTML remains the external value format. Tiptap parses incoming HTML into the supported document schema and serializes edited content back to HTML. A test fixture corpus will define the accepted normalization and verify that supported legacy content is not lost.

Alternative considered: store Tiptap JSON and convert only at render time. This would require a data migration and changes to every backend DTO, renderer, email path, and seed, without a current product need.

### Provide source mode as a controlled HTML editing view

Implement source mode as an explicit editor state. On entry, it shows the current serialized HTML; on exit, valid source is parsed through the same supported schema and normalized back to visual mode. Invalid or unsupported source must surface a recoverable error and retain the last valid document rather than silently clearing it.

This preserves the practical value of TinyMCE's `code` plugin without treating arbitrary HTML as trusted or promising to preserve elements outside the supported schema.

### Split public administrative images from private discussion images

Administrative rich content uses the authenticated `/api/rich-text-images/upload` endpoint backed by public asset storage and the `/assets` serving path. These images need public URLs because blogs, guides, and other administrative content can be rendered publicly.

Discussion editors use `/api/discussion-posts/upload-image?boardId=...`. New files are stored under a board-scoped private directory, and `/api/discussion-posts/images/:boardId/:filename` requires an authenticated user with access to that board. The editor keeps the HTML value contract, but discussion image URLs remain API URLs so the browser sends the user's session when loading them.

The original `/api/discussion-posts/images/:filename` route remains available for existing HTML and root-level files. New uploads never use that legacy path, and no existing files or database content are relocated.

Alternative considered: use the public rich-content endpoint for every editor. That would expose discussion attachments to anyone who obtains their URL and would not enforce board membership.

### Preserve application form and workflow behavior

Replace each TinyMCE `<editor formControlName="...">` with the shared editor while leaving the surrounding forms, stores, API DTOs, required validators, and submission paths unchanged. The email campaign's programmatic body updates will continue to patch the same HTML form control.

### Validate before removing TinyMCE

Use unit-level editor tests for form-control synchronization, commands, source mode, uploads, and disabled state; HTML fixture tests for legacy content; and frontend build/lint checks. Add a migration smoke pass covering every affected workflow, including create/edit dialogs and existing content. Remove TinyMCE only after no source imports, asset copies, runtime URLs, API keys, or lockfile entries remain.

## Risks / Trade-offs

- [Legacy HTML normalization] → Tiptap may normalize markup or discard unsupported attributes. Maintain fixtures from real seeded and persisted content, add extensions for required inline styles, and do not bulk-save records as part of deployment.
- [Source-mode expectations] → Source editing cannot safely promise arbitrary HTML preservation. Limit the supported schema, report parse failures, and document the supported content set in the editor UI/tests.
- [Image access and storage] → Administrative rich-content URLs are public by design; discussion image URLs are private. Authenticate uploads and private retrieval, validate files server-side, use generated filenames, and keep discussion files under board-scoped private directories.
- [Forms integration] → The current discussion component is callback-based and is not a reactive-form control. Test `writeValue`, change/touched callbacks, disabled state, reset, and external patches before migrating forms.
- [Editor bundle size] → Adding table/source/style functionality may increase the frontend bundle. Keep extensions explicit, inspect the production build budget, and avoid loading unused Tiptap packages.
- [Rollback after edits] → A rollback to TinyMCE may display normalized Tiptap HTML differently. Keep the HTML contract and old URL paths stable, and use staged rollout with the ability to revert frontend code without data migration.

## Migration Plan

1. Build and test the shared form-control editor and the authenticated public rich-content upload path.
2. Migrate the discussion editor to the shared component while preserving its current visual behavior and existing image URLs.
3. Migrate admin and partner-staff workflows one group at a time, verifying create/edit dialogs, existing seeded content, validators, stores, and email preview/send behavior.
4. Run the full frontend production build, lint/tests, content compatibility fixtures, and a source scan for TinyMCE references.
5. Remove TinyMCE packages, static asset copying, providers, imports, API keys, and lockfile entries.
6. Deploy the frontend/backend changes together. If verification fails, revert the application changes; no database rollback is required because the persisted representation remains HTML.

## Open Questions

None. The supported feature set, persistence format, upload visibility, and migration/rollback boundaries are defined above.
