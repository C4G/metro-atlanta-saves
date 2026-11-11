import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export type ActionCardTone = 'brand' | 'soft' | 'muted' | 'warn';

export const ACTION_CARD_TONES: Record<ActionCardTone, string> = {
  brand: 'border-brand/40 text-brand-strong',
  soft: 'border-transparent bg-brand-soft/80 text-brand-strong',
  muted: 'border-ink-muted/45 text-ink-muted',
  warn: 'border-warn-ink/30 bg-warn-soft text-warn-ink',
};

@Component({
  selector: 'mas-action-card',
  imports: [NgClass, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="relative flex h-full min-h-56 flex-col rounded-2xl border p-5 transition-colors focus-within:border-brand/60 hover:border-brand/60 hover:bg-brand-soft/20 [.dark-theme_&]:hover:bg-surface-raised/65"
      [ngClass]="inactive() ? 'border-dashed border-outline' : 'border-outline/90'"
    >
      <div class="flex items-start justify-between gap-3">
        <h3 class="text-lg font-bold leading-7" [ngClass]="inactive() ? 'text-ink-muted' : 'text-ink'">
          {{ title() }}
        </h3>
        <div class="relative z-10 flex shrink-0 items-center gap-1.5">
          @if (status()) {
            <span class="mt-0.5 rounded-full border px-2.5 py-0.5 text-xs font-bold" [ngClass]="statusClass()">
              {{ status() }}
            </span>
          }
          <ng-content select="[cardMenu]" />
        </div>
      </div>
      @if (meta()) {
        <p class="mt-0.5 text-xs font-medium text-ink-muted">{{ meta() }}</p>
      }
      @if (description()) {
        <div class="rich-content mt-2 line-clamp-3 text-sm leading-6 text-ink-muted" [innerHTML]="description()"></div>
      }
      <div class="mt-auto flex gap-2 pt-5">
        <a
          class="flex min-h-10 flex-1 items-center justify-center rounded-xl border px-4 text-xs font-bold transition-colors after:absolute after:inset-0 after:rounded-2xl after:content-[''] hover:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          [ngClass]="
            inactive() ? 'border-outline text-ink-muted hover:text-brand-strong' : 'border-brand/55 text-brand-strong'
          "
          [routerLink]="link()"
          [attr.aria-label]="actionLabel() + ': ' + title()"
        >
          {{ actionLabel() }}
        </a>
        <div class="relative z-10 flex shrink-0 gap-2 empty:hidden"><ng-content select="[cardActions]" /></div>
      </div>
    </article>
  `,
  host: { class: 'block' },
})
export class ActionCardComponent {
  readonly title = input.required<string>();
  readonly actionLabel = input.required<string>();
  readonly link = input.required<string | readonly unknown[]>();
  readonly status = input('');
  readonly inactive = input(false);
  readonly meta = input('');
  readonly description = input('');
  readonly tone = input<ActionCardTone>('brand');
  readonly statusClass = computed(() => (this.inactive() ? ACTION_CARD_TONES.warn : ACTION_CARD_TONES[this.tone()]));
}
