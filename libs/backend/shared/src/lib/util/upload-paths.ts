import { mkdirSync } from 'fs';
import { join, relative, sep } from 'path';

/**
 * Root of every user-uploaded file. In production this is a Docker volume; in
 * development it defaults to a gitignored directory at the workspace root.
 *
 * The tree is split along a public/private line, and in production those two
 * halves are separate volumes — only `assets/` is mounted into the frontend
 * container:
 *
 *   <UPLOAD_DIR>/images/              private, served only via GET /api/images/:id
 *   <UPLOAD_DIR>/discussion-images/   served via GET /api/discussion-posts/images/:filename
 *   <UPLOAD_DIR>/assets/<name>/       public, served at /assets/<name>/ by the SSR server
 */
export const UPLOAD_DIR = process.env['UPLOAD_DIR'] ?? join(process.cwd(), '.uploads');

export const IMAGES_DIR = join(UPLOAD_DIR, 'images');

export const DISCUSSION_IMAGES_DIR = join(UPLOAD_DIR, 'discussion-images');

export const PUBLIC_ASSETS_DIR = join(UPLOAD_DIR, 'assets');

/** Absolute path to a public asset category, created on first use. */
export const assetDir = (name: string) => {
  const dir = join(PUBLIC_ASSETS_DIR, name);
  mkdirSync(dir, { recursive: true });
  return dir;
};

/** Absolute path to a private upload directory, created on first use. */
export const privateDir = (dir: string) => {
  mkdirSync(dir, { recursive: true });
  return dir;
};

/**
 * Public URL for a file written under `PUBLIC_ASSETS_DIR`, e.g.
 * `<UPLOAD_DIR>/assets/stories/foo.webp` -> `/assets/stories/foo.webp`.
 */
export const assetUrl = (filePath: string) => `/assets/${toPosix(relative(PUBLIC_ASSETS_DIR, filePath))}`;

/**
 * Path stored in `Image.path`, kept relative to `UPLOAD_DIR` so that rows
 * written before uploads moved onto a volume still resolve.
 */
export const imageRelPath = (filePath: string) => toPosix(relative(UPLOAD_DIR, filePath));

/** Absolute path for a `Image.path` value produced by `imageRelPath`. */
export const imageAbsPath = (storedPath: string) => join(UPLOAD_DIR, storedPath);

const toPosix = (path: string) => path.split(sep).join('/');
