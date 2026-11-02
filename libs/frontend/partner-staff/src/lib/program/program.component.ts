import { ChangeDetectionStrategy, Component, effect, inject, input, untracked } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ProgramsStore, TaskReviewStore } from '@mas/frontend-shared-data-access';

@Component({
  selector: 'mas-program',
  imports: [MatIcon, RouterLink, RouterLinkActive, RouterOutlet],
  providers: [TaskReviewStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-w-0 px-4 py-6 text-ink sm:px-6 sm:py-8 lg:px-8">
      <div class="mx-auto max-w-7xl">
        <header
          class="relative overflow-clip rounded-3xl border border-outline bg-surface-subtle px-6 py-8 sm:px-10 sm:py-10"
        >
          <span
            aria-hidden="true"
            class="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border-[22px] border-brand/10"
          ></span>
          <span
            aria-hidden="true"
            class="pointer-events-none absolute -bottom-24 right-20 h-44 w-44 rounded-full border border-brand/15"
          ></span>
          <span
            aria-hidden="true"
            class="pointer-events-none absolute right-14 top-16 h-3 w-3 rounded-full bg-brand/35 sm:right-28"
          ></span>
          <div class="relative flex flex-wrap items-start gap-4 sm:flex-nowrap">
            <span
              aria-hidden="true"
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand-strong"
            >
              <mat-icon>school</mat-icon>
            </span>
            <div class="min-w-0 flex-1 basis-48">
              <h1 class="break-words font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                {{ programsStore.program()?.name || 'Program' }}
              </h1>
              @if (programsStore.program()?.description; as description) {
                <div
                  class="rich-content mt-3 max-w-3xl break-words text-sm leading-6 text-ink-muted"
                  [innerHTML]="description"
                ></div>
              }
            </div>
            <nav
              aria-label="Program pages"
              class="relative flex w-full shrink-0 gap-1 rounded-2xl border border-outline bg-surface p-1 sm:ml-auto sm:mt-6 sm:w-auto"
            >
              @for (link of links; track link.path) {
                <a
                  [routerLink]="link.path"
                  routerLinkActive="!bg-brand-strong !text-brand-on"
                  ariaCurrentWhenActive="page"
                  class="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-sm font-bold text-ink-muted transition-colors hover:bg-brand-soft hover:text-brand-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 focus-visible:ring-offset-surface sm:flex-none sm:px-4"
                >
                  <mat-icon
                    aria-hidden="true"
                    class="!hidden !h-5 !w-5 shrink-0 !text-xl !leading-none sm:!inline-block"
                  >
                    {{ link.icon }}
                  </mat-icon>
                  {{ link.name }}
                </a>
              }
            </nav>
          </div>
        </header>
        <div class="min-w-0 py-6 sm:py-8"><router-outlet /></div>
      </div>
    </div>
  `,
  host: { class: 'block' },
})
export default class ProgramComponent {
  readonly id = input.required<string>();
  readonly programsStore = inject(ProgramsStore);
  readonly links = [
    { path: './progress', name: 'Tasks Review', icon: 'calendar_view_month' },
    { path: './insights', name: 'Insights', icon: 'insights' },
    { path: './manage', name: 'Manage Program', icon: 'tune' },
  ];
  // Every page shares one copy of the monthly review data, so switching pages does not reload it.
  private readonly review = inject(TaskReviewStore);
  readonly programEffect = effect(() => {
    const id = this.id();
    untracked(() => {
      this.programsStore.getProgram(id);
      this.review.load(id);
    });
  });
}
