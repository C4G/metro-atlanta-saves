## 1. Establish the shared editor foundation

- [x] 1.1 Inventory the current TinyMCE toolbar behavior, the discussion editor behavior, and representative persisted HTML fixtures (including the seeded user guide); verify the inventory covers every current consumer and legacy element listed in the rich-text-editing specification
- [x] 1.2 Move the discussion Tiptap editor into `libs/frontend/_shared/components`, export it through the shared-components barrel, and update the discussion application import; verify the frontend and shared-components TypeScript project references resolve without circular imports
- [x] 1.3 Add the Tiptap extensions needed for tables, alignment, indentation, inline text color/style, source-mode parsing, and word counting; verify dependency installation and the production bundle remain within the configured budgets
- [x] 1.4 Refactor the shared editor to implement Angular `ControlValueAccessor` behavior, including `writeValue`, change/touched callbacks, disabled state, form reset, and external value patching; verify unit tests cover initialization, user edits, reset, disabled mode, and duplicate-update suppression

## 2. Implement the complete editor experience

- [x] 2.1 Expand the editor schema and toolbar for headings, inline marks, links, nested lists, images, tables, alignment, indentation, and undo/redo; verify command-level tests assert the resulting HTML for each supported content type
- [x] 2.2 Add controlled HTML source mode with valid-source normalization, invalid-source recovery, and a visible error state; verify tests show valid HTML updates visual mode and invalid HTML preserves the last valid document
- [x] 2.3 Add live word-count feedback and keyboard/accessibility behavior for toolbar controls, source mode, and status/error messaging; verify component tests and a keyboard smoke test cover the behavior
- [x] 2.4 Preserve legacy HTML semantics for paragraphs, headings, nested lists, links, emphasis, underline, inline colors, line breaks, images, and tables; verify fixture tests compare normalized DOM semantics before and after load/save
- [x] 2.5 Preserve the discussion editor's existing UX options (placeholder, minimum height, border mode, selection/link popover, and empty-string handling); verify the discussion create/edit flows still submit the expected HTML and empty content value

## 3. Centralize rich-content image uploads

- [x] 3.1 Add authenticated administrative rich-content uploads using public assets and add board-scoped private discussion image uploads with generated filenames, MIME validation, and the existing upload-size policy; verify backend tests cover authorization and URL visibility for both workflows
- [x] 3.2 Serve administrative rich-content assets through the existing `/assets` path, protect new board-scoped discussion image retrieval with board membership checks, and preserve existing legacy discussion-image serving behavior
- [x] 3.3 Connect the shared editor to the new upload route and expose upload progress/error state without changing the document on failure; verify component tests cover success, rejection, failure, loading-state cleanup, and prevention of base64 image insertion
- [x] 3.4 Configure discussion editors to upload through the board-scoped private route; verify generated discussion image URLs include the board scope and are retrievable only by authorized board users

## 4. Migrate all TinyMCE consumers

- [x] 4.1 Replace TinyMCE in blog and learning add/edit dialogs with the shared editor; verify required validation, create/edit initialization, submission payloads, and dialog behavior with focused component tests
- [x] 4.2 Replace TinyMCE in home description and partner-staff program forms with the shared editor; verify required validation, existing form/store/API submission paths, and legacy content editing
- [x] 4.3 Replace TinyMCE in user-guide and peer-evaluation-guide forms with the shared editor; verify seeded content with colored inline text, nested lists, links, and line breaks survives an edit/save cycle
- [x] 4.4 Replace TinyMCE in the email-blast form with the shared editor; verify programmatic discussion-link updates still modify the same HTML form control and email preview/send behavior remains intact
- [x] 4.5 Remove the old application-local editor implementation after all consumers use the shared export; verify `rg` finds no duplicate rich-text editor implementation or app-only import

## 5. Remove TinyMCE and validate the migration

- [x] 5.1 Remove TinyMCE imports, providers, API keys, initialization objects, and `/tinymce` asset copying from all frontend code and build configuration; verify `rg -n -i "tinymce" apps libs package.json apps/frontend/project.json` returns no runtime or source references
- [x] 5.2 Remove TinyMCE packages from `package.json` and regenerate the lockfile; verify `pnpm install --frozen-lockfile` succeeds with no TinyMCE packages
- [x] 5.3 Run shared-components, frontend, and affected backend unit/integration tests; verify the complete test suite passes, including upload and HTML compatibility coverage
- [x] 5.4 Run frontend lint and production build plus a migrated-workflow smoke pass covering discussion posts/comments, blog, learning, description, program, both guides, and email campaigns; verify no TinyMCE asset request occurs and every workflow loads, edits, validates, previews, and submits HTML successfully
- [x] 5.5 Document the supported HTML schema, source-mode limitations, upload behavior, and rollback procedure for maintainers; verify the documentation links to the shared editor and matches the implemented toolbar and compatibility tests
