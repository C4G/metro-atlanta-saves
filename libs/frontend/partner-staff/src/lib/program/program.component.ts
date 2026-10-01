import { ChangeDetectionStrategy, Component, computed, effect, inject, input, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIcon } from '@angular/material/icon';
import { NavigationEnd, Router, RouterLink, RouterOutlet, RoutesRecognized } from '@angular/router';
import { ProgramsStore } from '@mas/frontend-shared-data-access';
import { Nav } from '@mas/models';
import { filter, map } from 'rxjs';

const PROGRAM_URL_REGEX = /\/partner-staff\/programs\/[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}\/?/;

@Component({
  selector: 'mas-program',
  imports: [RouterLink, RouterOutlet, MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="min-h-dvh bg-[#f8fafc] dark:bg-[#0c1222] px-4 py-6 sm:px-6 lg:px-8">
      <section class="mx-auto max-w-7xl">
        <a
          routerLink="../"
          class="inline-flex text-teal-700 hover:bg-teal-50 hover:text-teal-800 dark:text-teal-300 dark:hover:bg-teal-400/10 dark:hover:text-teal-200 items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <mat-icon class="!h-4 !w-4 !text-base !leading-4">arrow_back</mat-icon>
          All programs
        </a>
        <header
          class="mt-4 bg-[#0d1b2f] dark:shadow-[inset_0_1px_0_rgba(148,163,184,0.1)] overflow-hidden rounded-3xl px-6 py-8 text-white sm:px-10 sm:py-10"
        >
          <div class="max-w-3xl">
            <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-teal-200">Program workspace</p>
            <h1 class="mt-3 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              {{ programsStore.program()?.name }}
            </h1>
            <div class="mt-5 flex flex-wrap gap-2 text-xs">
              <span class="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-slate-300">
                Created {{ programsStore.computedProgramCreatedAt() }}
              </span>
              @if (programsStore.computedProgramDates()) {
                <span class="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-slate-300">
                  {{ programsStore.computedProgramDates() }}
                </span>
              }
            </div>
          </div>
        </header>
        <nav
          class="mt-5 dark:border-slate-400/15 dark:bg-[#151b2e] dark:shadow-[0_10px_24px_rgba(0,0,0,0.2)] grid grid-cols-2 gap-1.5 rounded-2xl border border-gray-200 bg-white p-1.5 shadow-sm sm:grid-cols-3 xl:grid-cols-6"
          aria-label="Program management sections"
        >
          @for (link of links(); track link.routerLink) {
            <a
              [routerLink]="link.routerLink"
              class="flex text-slate-500 hover:bg-teal-50 hover:text-teal-800 [&.program-tab--active]:bg-teal-100 [&.program-tab--active]:text-teal-900 dark:text-slate-400 dark:hover:bg-[#1b2940] dark:hover:text-teal-200 dark:[&.program-tab--active]:bg-teal-400/15 dark:[&.program-tab--active]:text-teal-200 min-h-11 items-center justify-center rounded-xl px-3 py-2.5 text-center text-xs font-bold transition-colors"
              [class.program-tab--active]="activeLink() === link.routerLink"
            >
              {{ link.name }}
            </a>
          }
        </nav>
        <section
          class="mt-5 dark:border-slate-400/15 dark:bg-[#151b2e] dark:shadow-[0_10px_24px_rgba(0,0,0,0.2)] [&_.mat-mdc-raised-button]:!rounded-xl [&_.mat-mdc-raised-button]:!bg-teal-700 [&_.mat-mdc-raised-button]:!text-[0.8125rem] [&_.mat-mdc-raised-button]:!font-bold [&_.mat-mdc-raised-button]:!text-cyan-50 dark:[&_.mat-mdc-raised-button]:!bg-teal-400 dark:[&_.mat-mdc-raised-button]:!text-teal-950 [&_.mat-mdc-outlined-button]:!rounded-xl [&_.mat-mdc-outlined-button]:!border-teal-200 [&_.mat-mdc-outlined-button]:!text-[0.8125rem] [&_.mat-mdc-outlined-button]:!font-bold [&_.mat-mdc-outlined-button]:!text-teal-800 dark:[&_.mat-mdc-outlined-button]:!border-teal-400/30 dark:[&_.mat-mdc-outlined-button]:!text-teal-200 [&_.mat-mdc-icon-button]:!rounded-xl [&_.mat-mdc-icon-button]:!text-teal-700 dark:[&_.mat-mdc-icon-button]:!text-teal-300 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
        >
          <router-outlet />
        </section>
      </section>
    </main>
  `,
  host: { class: 'block' },
})
export default class ProgramComponent {
  id = input.required<string>();
  private router = inject(Router);
  programsStore = inject(ProgramsStore);

  links = computed<Nav[]>(() => {
    const startDate = this.programsStore.program()?.startDate;

    const enrollments = (startDate ? new Date(startDate) > new Date() : true)
      ? { routerLink: './enrollments', name: 'Enrollments' }
      : undefined;

    const nav = [
      { routerLink: './', name: 'Requirements' },
      { routerLink: './users', name: 'Participants' },
      { routerLink: './allies', name: 'Allies' },
      ...(enrollments ? [enrollments] : []),
      { routerLink: './document-management', name: 'Document Management' },
      { routerLink: './cohort-percentage-completion', name: 'Cohort Summary Page' },
    ];
    return nav;
  });
  activeLink = toSignal(
    this.router.events.pipe(
      filter((event): event is RoutesRecognized => event instanceof NavigationEnd),
      map((event) => event.url.replace(PROGRAM_URL_REGEX, './')),
    ),
  );

  programEffect = effect(() => {
    const id = this.id();

    untracked(() => {
      this.programsStore.getProgram(id);
    });
  });
}
