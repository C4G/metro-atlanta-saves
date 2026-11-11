const FOCUS =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface';

export const AUTH_LABEL = 'text-xs font-bold text-ink-muted';

export const AUTH_INPUT =
  'min-h-11 w-full rounded-xl border bg-surface-raised/70 px-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle hover:border-brand/70 focus:border-brand/70 focus:bg-surface-raised focus:ring-2 focus:ring-brand/35';

export const AUTH_INPUT_OK = 'border-brand/25';

export const AUTH_INPUT_BAD = 'border-danger';

export const AUTH_ERROR = 'flex items-center gap-1.5 text-xs font-bold text-danger';

export const AUTH_HINT = 'text-xs text-ink-muted';

export const AUTH_SOLID = `inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-brand-strong bg-brand-strong px-4 text-sm font-bold text-brand-on transition-colors hover:border-brand hover:bg-brand disabled:cursor-wait disabled:opacity-70 ${FOCUS}`;

export const AUTH_CONTROL = `inline-flex min-h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-brand/25 bg-surface-raised/70 px-4 text-sm font-bold text-ink transition-colors hover:border-brand/70 hover:bg-surface-raised ${FOCUS}`;

export const AUTH_LINK = `rounded-md font-bold text-brand-strong underline-offset-4 hover:underline ${FOCUS}`;

export const AUTH_REVEAL =
  'absolute right-1.5 top-1/2 flex min-h-8 -translate-y-1/2 items-center gap-1 rounded-lg border border-transparent px-2 text-xs font-bold text-brand-strong transition-colors hover:border-brand/40 hover:bg-surface-raised/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand';

export const AUTH_ALERT =
  'flex items-start gap-2.5 rounded-xl border border-danger/35 bg-danger/10 px-3 py-2.5 text-sm leading-5 text-danger';

export const authInputClass = (invalid: boolean) => `${AUTH_INPUT} ${invalid ? AUTH_INPUT_BAD : AUTH_INPUT_OK}`;

export const focusFirstInvalid = (host: HTMLElement) =>
  host.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
