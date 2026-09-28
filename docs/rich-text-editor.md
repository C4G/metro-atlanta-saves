# Rich-text editor

The application uses `RichTextEditorComponent` from
`@mas/frontend-shared-components` for discussion and administrative content.
It stores HTML strings, so existing content does not require a database
migration.

## Supported content

The editor supports paragraphs, headings 1–3, bold, italic, underline,
hyperlinks, bulleted and numbered (including nested) lists, images, tables,
left/center/right/justified alignment, indentation, undo/redo, inline text
color, HTML source mode, and word count.

Source mode accepts the supported HTML schema and normalizes it when applied.
Unsupported elements are rejected with an error and the last valid document is
retained. Arbitrary HTML is not preserved through the visual editor.

## Images

Logged-in users upload editor images through `POST /api/rich-text-images/upload`
using the `image` multipart field. The server validates the image type and the
5 MB size limit, stores the file under public rich-content assets, and returns
an `/assets/rich-text/...` URL. In local development, the Angular proxy forwards
that path to the API so the same URL works at `http://localhost:4200`.

When HTML is sent through an email campaign, the mail service converts these
public asset paths to absolute URLs using `PUBLIC_APP_URL` (for example,
`https://brpatl.com`). It also inlines email-safe styles for tables, headers, and
cells, and converts Tiptap indentation to inline `padding-left` styles because
email clients do not load the application stylesheet. External email providers
cannot retrieve localhost URLs.

Discussion editors use `POST /api/discussion-posts/upload-image?boardId=...`.
These files are stored privately under the board ID and return an
`/api/discussion-posts/images/:boardId/:filename` URL. Uploading and retrieving
new discussion images requires an authenticated user with access to the board.
The legacy `/api/discussion-posts/images/:filename` route remains available to
authenticated users for existing discussion HTML; new uploads do not use it.

## Rollback

Rich content remains HTML and no records are bulk-rewritten during deployment.
If the frontend needs to be rolled back, revert the application release; no
database rollback is required. Previously saved content may contain normalized
Tiptap markup, so restore the same HTML editor version when preserving exact
markup matters.
