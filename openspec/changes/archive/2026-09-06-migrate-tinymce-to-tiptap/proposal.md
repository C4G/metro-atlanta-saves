## Why

The frontend currently maintains two rich-text editor implementations: a custom Tiptap editor for discussion boards and TinyMCE instances throughout the admin area. Consolidating on Tiptap will reduce duplicated editor dependencies and configuration while giving the application a single, explicitly controlled HTML editing experience.

## What Changes

- Promote the existing Tiptap editor into a reusable Angular rich-text form control.
- Match the editor capabilities currently exposed by TinyMCE where they are needed: formatting, headings, lists, links, tables, alignment, indentation, undo/redo, source/code editing, and word count.
- Replace TinyMCE instances in blog, learning, description, program, user-guide, peer-evaluation-guide, and email-blast workflows.
- Preserve the existing HTML-based persistence and rendering contracts, including compatibility with existing saved content.
- Provide public image uploads for administrative content and board-authorized private image uploads for discussions.
- Add editor behavior and content-compatibility tests, then remove TinyMCE packages, static assets, configuration, and API-key usage.

## Capabilities

### New Capabilities

- `rich-text-editing`: Provides a reusable Tiptap-based Angular editor with form integration, supported formatting/content features, HTML compatibility, and image upload behavior across the application.

### Modified Capabilities

<!-- No existing capability requirements cover rich-text editing. -->

## Impact

- Frontend editor component and all current TinyMCE consumers under `libs/frontend/admin` and `libs/frontend/partner-staff`.
- Discussion-board editor integration under `apps/frontend/src/app`.
- Frontend dependencies, build assets, and TinyMCE script configuration in `package.json`, `pnpm-lock.yaml`, and `apps/frontend/project.json`.
- Image-upload API usage and any shared frontend upload service needed by the editor.
- Existing HTML stored for blogs, learnings, descriptions, programs, guides, email bodies, and discussion content; no database schema change is expected if HTML remains the persistence format.
