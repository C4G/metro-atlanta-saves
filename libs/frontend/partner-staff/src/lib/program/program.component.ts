import { ChangeDetectionStrategy, Component, computed, effect, inject, input, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIcon } from '@angular/material/icon';
import { NavigationEnd, Router, RouterLink, RouterOutlet, RoutesRecognized } from '@angular/router';
import { ProgramsStore, ThemeService } from '@mas/frontend-shared-data-access';
import { Nav } from '@mas/models';
import { filter, map } from 'rxjs';

const PROGRAM_URL_REGEX = /\/partner-staff\/programs\/[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}\/?/;

@Component({
  selector: 'mas-program',
  imports: [RouterLink, RouterOutlet, MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="program-workspace min-h-dvh px-4 py-6 sm:px-6 lg:px-8">
      <section class="mx-auto max-w-7xl">
        <a
          routerLink="../"
          class="program-back-link inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <mat-icon class="!h-4 !w-4 !text-base !leading-4">arrow_back</mat-icon>
          All programs
        </a>
        <header class="program-detail-hero mt-4 overflow-hidden rounded-3xl px-6 py-8 text-white sm:px-10 sm:py-10">
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
          class="program-tabs mt-5 grid grid-cols-2 gap-1.5 rounded-2xl border border-gray-200 bg-white p-1.5 shadow-sm sm:grid-cols-3 xl:grid-cols-6"
          aria-label="Program management sections"
        >
          @for (link of links(); track link.routerLink) {
            <a
              [routerLink]="link.routerLink"
              class="program-tab flex min-h-11 items-center justify-center rounded-xl px-3 py-2.5 text-center text-xs font-bold transition-colors"
              [class.program-tab--active]="activeLink() === link.routerLink"
            >
              {{ link.name }}
            </a>
          }
        </nav>
        <section class="program-content mt-5 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <router-outlet />
        </section>
      </section>
    </main>
  `,
  styles: [
    `
      .program-workspace {
        background: #f8fafc;
      }
      .program-detail-hero {
        background: #0d1b2f;
      }
      .program-back-link {
        color: #0f766e;
      }
      .program-back-link:hover {
        background: #f0fdfa;
        color: #115e59;
      }
      .program-tab {
        color: #64748b;
      }
      .program-tab:hover {
        background: #f0fdfa;
        color: #115e59;
      }
      .program-tab--active {
        background: #ccfbf1;
        color: #134e4a;
      }
      :host ::ng-deep .program-content .mat-mdc-raised-button {
        border-radius: 0.75rem;
        background: #0f766e !important;
        color: #ecfeff !important;
        font-size: 0.8125rem;
        font-weight: 700;
      }
      :host ::ng-deep .program-content .mat-mdc-outlined-button {
        border-color: #99f6e4 !important;
        border-radius: 0.75rem;
        color: #115e59 !important;
        font-size: 0.8125rem;
        font-weight: 700;
      }
      :host ::ng-deep .program-content .mat-mdc-icon-button {
        border-radius: 0.75rem;
        color: #0f766e;
      }
      :host ::ng-deep .program-content .program-list-panel {
        padding: 1.5rem;
      }
      :host ::ng-deep .program-content .program-list-kicker {
        color: #0f766e;
        font-size: 0.6875rem;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }
      :host ::ng-deep .program-content .program-list-title {
        margin-top: 0.375rem;
        color: #0f172a;
        font-size: 1.25rem;
        font-weight: 700;
        letter-spacing: -0.025em;
      }
      :host ::ng-deep .program-content .program-list-description {
        margin-top: 0.375rem;
        color: #64748b;
        font-size: 0.8125rem;
        line-height: 1.25rem;
      }
      :host ::ng-deep .program-content .program-list-grid {
        margin-top: 1.5rem;
        overflow: hidden;
        border: 1px solid #e2e8f0;
        border-radius: 1rem;
      }
      :host ::ng-deep .program-content .program-list-secondary.mat-mdc-raised-button {
        background: #f0fdfa !important;
        color: #115e59 !important;
      }
      :host ::ng-deep .program-content .program-summary-select {
        --mdc-outlined-text-field-focus-outline-color: #0f766e;
        --mdc-outlined-text-field-hover-outline-color: #5eead4;
      }
      :host(.program-workspace--dark) .program-workspace {
        background: #0c1222;
      }
      :host(.program-workspace--dark) .program-detail-hero {
        background: #0d1b2f;
        box-shadow: inset 0 1px 0 rgba(148, 163, 184, 0.1);
      }
      :host(.program-workspace--dark) .program-back-link {
        color: #5eead4;
      }
      :host(.program-workspace--dark) .program-back-link:hover {
        background: rgba(45, 212, 191, 0.12);
        color: #99f6e4;
      }
      :host(.program-workspace--dark) .program-tabs,
      :host(.program-workspace--dark) .program-content {
        border-color: rgba(148, 163, 184, 0.16);
        background: #151b2e;
        box-shadow: 0 10px 24px rgba(0, 0, 0, 0.2);
      }
      :host(.program-workspace--dark) .program-tab {
        color: #94a3b8;
      }
      :host(.program-workspace--dark) .program-tab:hover {
        background: #1b2940;
        color: #99f6e4;
      }
      :host(.program-workspace--dark) .program-tab--active {
        background: rgba(45, 212, 191, 0.16);
        color: #99f6e4;
      }
      :host(.program-workspace--dark) ::ng-deep .program-content .mat-mdc-raised-button {
        background: #2dd4bf !important;
        color: #082f2e !important;
      }
      :host(.program-workspace--dark) ::ng-deep .program-content .mat-mdc-outlined-button {
        border-color: rgba(45, 212, 191, 0.3) !important;
        color: #99f6e4 !important;
      }
      :host(.program-workspace--dark) ::ng-deep .program-content .mat-mdc-icon-button {
        color: #5eead4;
      }
      :host(.program-workspace--dark) ::ng-deep .program-content .program-list-title {
        color: #f1f5f9;
      }
      :host(.program-workspace--dark) ::ng-deep .program-content .program-list-description {
        color: #94a3b8;
      }
      :host(.program-workspace--dark) ::ng-deep .program-content .program-list-grid {
        border-color: rgba(148, 163, 184, 0.16);
      }
      :host(.program-workspace--dark) ::ng-deep .program-content .program-list-secondary.mat-mdc-raised-button {
        background: rgba(45, 212, 191, 0.12) !important;
        color: #99f6e4 !important;
      }
      :host(.program-workspace--dark) ::ng-deep .program-content .program-summary-select {
        --mdc-outlined-text-field-outline-color: rgba(148, 163, 184, 0.3);
        --mdc-outlined-text-field-focus-outline-color: #2dd4bf;
        --mdc-outlined-text-field-label-text-color: #94a3b8;
        --mdc-outlined-text-field-input-text-color: #e2e8f0;
      }
    `,
  ],
  host: {
    class: 'block',
    '[class.program-workspace--dark]': 'themeService.darkMode()',
  },
})
export default class ProgramComponent {
  id = input.required<string>();
  private router = inject(Router);
  programsStore = inject(ProgramsStore);
  readonly themeService = inject(ThemeService);

  links = computed<Nav[]>(() => {
    const startDate = this.programsStore.program()?.startDate;

    const enrollments = (startDate ? new Date(startDate) > new Date() : true)
      ? { routerLink: './enrollments', name: 'Enrollments' }
      : undefined;

    const nav = [
      { routerLink: './', name: 'Requirements' },
      { routerLink: './users', name: 'Users' },
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
