## Purpose

Provide one consistent rich-text editing experience for discussion and administrative content while preserving the application's existing HTML persistence and rendering contracts.

## ADDED Requirements

### Requirement: Shared editor behaves as an Angular form control

The rich-text editor MUST accept an initial HTML value, expose subsequent edits as the control value, respond to external value changes, and honor disabled and touched states when used in an Angular reactive form.

#### Scenario: Existing HTML is loaded

- **WHEN** a form supplies saved HTML to an editor
- **THEN** the editor displays that content in its visual editing surface without requiring a TinyMCE runtime

#### Scenario: User edits content

- **WHEN** a user changes the document
- **THEN** the bound form control receives the resulting HTML value

#### Scenario: Form value is changed externally

- **WHEN** the owning form resets or patches the editor's control value
- **THEN** the visual editor updates to the new HTML without emitting a duplicate user edit

#### Scenario: Editor is disabled

- **WHEN** the owning form disables the control
- **THEN** the editor prevents editing and disables its editing actions

### Requirement: Editor supports the application's rich-text content set

The editor MUST allow users to create and edit paragraphs, heading levels 1 through 3, bold, italic, underline, hyperlinks, bulleted lists, numbered lists, nested lists, images, tables, text alignment, indentation, and undo/redo history.

#### Scenario: User applies inline and block formatting

- **WHEN** a user selects text or places the caret in a block and chooses a formatting action
- **THEN** the editor applies the corresponding formatting and includes it in the emitted HTML

#### Scenario: User edits structured content

- **WHEN** a user creates or edits a list, table, image, heading, aligned block, or indented block
- **THEN** the editor preserves the structure while the user continues editing and when the content is saved

#### Scenario: User reverses an edit

- **WHEN** a user invokes undo or redo
- **THEN** the editor moves through its edit history and emits the resulting HTML value

### Requirement: Editor provides source and content feedback tools

The editor MUST provide a way to inspect and edit the current HTML source and MUST display a word count for the current document.

#### Scenario: User edits HTML source

- **WHEN** a user opens source mode, changes valid HTML, and returns to visual mode
- **THEN** the visual editor reflects the changed HTML and the form value contains the corresponding normalized HTML

#### Scenario: User enters invalid source

- **WHEN** a user enters HTML that cannot be represented by the supported document model
- **THEN** the editor does not crash or save an empty document, and gives the user a visible indication that the source could not be fully applied

#### Scenario: Word count updates

- **WHEN** the document text changes
- **THEN** the displayed word count reflects the current text content

### Requirement: Existing HTML remains compatible

The editor MUST load and save existing application HTML without silently dropping supported content. It MUST retain the semantics of existing headings, paragraphs, lists, links, emphasis, underlining, inline text colors, line breaks, and images; blank content MUST remain represented as an empty form value.

#### Scenario: Existing guide content is edited and saved

- **WHEN** a user opens an existing guide containing nested lists, colored inline text, links, and line breaks and saves it without intentionally removing content
- **THEN** those content elements remain present and semantically equivalent in the saved HTML

#### Scenario: Existing content contains a supported table

- **WHEN** a user opens and saves existing HTML containing a table
- **THEN** the table structure and cell content remain present in the saved HTML

#### Scenario: Empty content is saved

- **WHEN** a user removes all editor content
- **THEN** the bound value is an empty string rather than an editor-specific empty paragraph marker

### Requirement: Images are uploaded through an authorized shared workflow

The editor MUST allow an authorized user to select an image, upload it through the application's image service, insert the returned URL into the document, reject unsupported or oversized files, and report upload failures without corrupting the current document. Administrative content MAY use public asset URLs; discussion content MUST use board-scoped private URLs that require the viewer to be an authenticated member or administrator of the board.

#### Scenario: Image upload succeeds

- **WHEN** a user selects a valid image and the upload succeeds
- **THEN** the editor inserts the returned image URL at the current selection and emits updated HTML

#### Scenario: Image upload is rejected

- **WHEN** the selected file is unsupported or exceeds the configured size limit
- **THEN** the editor shows an error and does not insert a data URI or invalid image element

#### Scenario: Image upload fails

- **WHEN** the image service returns an error
- **THEN** the editor stops its loading state, reports the failure, and leaves the existing document unchanged

#### Scenario: Discussion image access is board-scoped

- **WHEN** a board member uploads an image while composing a discussion post or comment
- **THEN** the image is stored under that board's private storage, the editor inserts a board-scoped API URL, and another authenticated user without access to the board cannot retrieve the image

### Requirement: All rich-text workflows use the shared editor

The discussion editor and each current TinyMCE-backed workflow MUST expose equivalent form behavior and supported content behavior through the shared editor: blogs, learnings, home description, programs, user guide, peer-evaluation guide, and email campaigns.

#### Scenario: Administrator edits any migrated content type

- **WHEN** an administrator opens one of the migrated workflows
- **THEN** the workflow displays the shared editor, loads its existing value, preserves its existing validation, and submits the resulting HTML through its existing store/API path

#### Scenario: TinyMCE runtime is removed

- **WHEN** the production frontend is built and served
- **THEN** no migrated workflow requests TinyMCE scripts or assets
