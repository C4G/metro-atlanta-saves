const FOCUS = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand';

const CONTROL_BASE = `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border font-bold transition-colors ${FOCUS} disabled:cursor-default disabled:opacity-45`;

export const CONTROL = `${CONTROL_BASE} min-h-10 border-brand/25 bg-surface-raised/70 px-3 text-xs text-ink hover:border-brand/70 hover:bg-surface-raised disabled:hover:border-brand/25 disabled:hover:bg-surface-raised/70`;

export const CONTROL_SM = `${CONTROL_BASE} min-h-8 border-brand/25 bg-surface-raised/70 px-2.5 text-xs text-ink hover:border-brand/70 hover:bg-surface-raised disabled:hover:border-brand/25 disabled:hover:bg-surface-raised/70`;

export const CONTROL_PRIMARY = `${CONTROL_BASE} min-h-10 border-brand/70 bg-surface-raised px-3 text-xs text-brand-strong hover:border-brand`;

export const CONTROL_SOLID = `${CONTROL_BASE} min-h-10 border-brand-strong bg-brand-strong px-4 text-xs text-brand-on hover:border-brand hover:bg-brand`;

export const CONTROL_SOLID_SM = `${CONTROL_BASE} min-h-8 border-brand-strong bg-brand-strong px-2.5 text-xs text-brand-on hover:border-brand hover:bg-brand`;

export const CONTROL_DANGER = `${CONTROL_BASE} min-h-10 border-danger bg-danger px-4 text-xs text-brand-on hover:opacity-90`;

export const ICON_CONTROL = `flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand/25 bg-surface-raised/70 text-ink-muted transition-colors hover:border-brand/70 hover:bg-surface-raised hover:text-ink ${FOCUS} disabled:cursor-default disabled:opacity-40 disabled:hover:border-brand/25 disabled:hover:bg-surface-raised/70 aria-expanded:border-brand/70 aria-expanded:bg-surface-raised aria-expanded:text-brand-strong`;

export const SEGMENT = 'inline-flex max-w-full gap-1 rounded-xl border border-brand/25 bg-surface-raised/70 p-1';

export const SEGMENT_BUTTON = `flex min-h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-transparent px-2.5 text-xs font-bold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink ${FOCUS} aria-pressed:border-brand/70 aria-pressed:bg-surface-raised aria-pressed:text-brand-strong`;

export const FIELD = `min-h-10 w-full rounded-xl border border-brand/25 bg-surface-raised/70 px-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle hover:border-brand/70 focus:border-brand/70 focus:bg-surface-raised focus-visible:ring-2 focus-visible:ring-brand`;

export const LABEL = 'text-xs font-bold text-ink-muted';

export const ROW = 'rounded-xl border border-brand/25 bg-surface-raised/70';

export const AVATAR =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft/80 text-sm font-bold text-brand-strong';

export const AVATAR_SM =
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft/80 text-xs font-bold text-brand-strong';

export const ICON_TILE =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft/70 text-brand-strong';

const PILL = 'inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-bold';

export const PILLS = {
  brand: `${PILL} border-brand/40 text-brand-strong`,
  soft: `${PILL} border-transparent bg-brand-soft/80 text-brand-strong`,
  warn: `${PILL} border-warn-ink/45 bg-warn-soft text-warn-ink`,
  muted: `${PILL} border-ink-muted/45 text-ink-muted`,
  solid: `${PILL} border-brand-strong bg-brand-strong text-brand-on`,
};

export const MENU =
  'flex min-w-56 flex-col rounded-2xl border border-outline/65 bg-surface/95 p-1.5 text-ink shadow-xl backdrop-blur-lg backdrop-saturate-150';

export const MENU_ITEM = `flex min-h-10 w-full items-center gap-2.5 rounded-xl border border-transparent px-2.5 text-left text-sm font-bold transition-colors hover:border-brand/40 hover:bg-surface-raised/80 ${FOCUS}`;
