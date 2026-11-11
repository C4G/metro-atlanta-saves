import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MainNavStore } from '@mas/frontend-shared-data-access';

const TAB_CLASS =
  'flex min-h-8 shrink-0 items-center gap-1.5 rounded-lg border border-transparent px-3 text-xs font-bold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand aria-[current=page]:border-brand/70 aria-[current=page]:bg-surface-raised aria-[current=page]:text-brand-strong';

@Component({
  selector: 'mas-program-tabs',
  imports: [MatIcon, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (current(); as page) {
      <nav
        class="flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-brand/25 bg-surface-raised/70 p-1 [scrollbar-width:none]"
        aria-label="Program pages"
      >
        @if (expanded()) {
          @for (other of others(); track other.key) {
            <a [class]="tabClass" [routerLink]="other.link" routerLinkActive ariaCurrentWhenActive="page">
              <mat-icon class="mas-icon-sm" aria-hidden="true">{{ other.icon }}</mat-icon>
              {{ other.label }}
            </a>
          }
        }
        <a [class]="tabClass" [routerLink]="page.link" routerLinkActive ariaCurrentWhenActive="page">
          <mat-icon class="mas-icon-sm" aria-hidden="true">{{ page.icon }}</mat-icon>
          {{ page.label }}
        </a>
        @if (others().length) {
          <button
            type="button"
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-transparent text-ink-muted transition-colors hover:border-brand/40 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand aria-expanded:border-brand/70 aria-expanded:bg-surface-raised aria-expanded:text-brand-strong"
            [attr.aria-expanded]="expanded()"
            [attr.aria-label]="expanded() ? 'Hide other program pages' : 'Show other program pages'"
            (click)="expanded.set(!expanded())"
          >
            <mat-icon class="mas-icon-sm" aria-hidden="true">
              {{ expanded() ? 'chevron_right' : 'chevron_left' }}
            </mat-icon>
          </button>
        }
      </nav>
    }
  `,
  host: { class: 'hidden max-w-full md:block' },
})
export class ProgramTabsComponent {
  readonly mainNavStore = inject(MainNavStore);
  readonly tabClass = TAB_CLASS;
  readonly expanded = signal(false);
  readonly current = computed(
    () => this.mainNavStore.currentProgramPage() ?? this.mainNavStore.programPages()[0] ?? null,
  );
  readonly others = computed(() => this.mainNavStore.programPages().filter(({ key }) => key !== this.current()?.key));

  readonly collapseOnPageChange = effect(() => {
    this.current();
    untracked(() => this.expanded.set(false));
  });
}
