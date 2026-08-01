import { ChangeDetectionStrategy, Component, computed, effect, inject, input, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTabLink, MatTabNav, MatTabNavPanel } from '@angular/material/tabs';
import { NavigationEnd, Router, RouterLink, RouterOutlet, RoutesRecognized } from '@angular/router';
import { ProgramsStore } from '@mas/frontend-shared-data-access';
import { Nav } from '@mas/models';
import { filter, map } from 'rxjs';

const PROGRAM_URL_REGEX = /\/partner-staff\/programs\/[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}\/?/;

@Component({
  selector: 'mas-program',
  imports: [MatTabNav, MatTabLink, RouterLink, RouterOutlet, MatTabNavPanel, MatIcon, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6">
      <a mat-button aria-label="Back" title="Back" routerLink="../">
        <mat-icon>arrow_back_ios</mat-icon>
        Back
      </a>
      <p class="text-3xl font-bold mt-4">{{ programsStore.program()?.name }} Program</p>
      <p class="text-sm opacity-60">Created On {{ programsStore.computedProgramCreatedAt() }}</p>
      @if (programsStore.computedProgramDates()) {
        <p class="text-sm opacity-60 mb-2">Program Dates {{ programsStore.computedProgramDates() }}</p>
      }
      <nav mat-tab-nav-bar [tabPanel]="tabPanel">
        @for (link of links(); track link.routerLink) {
          <a mat-tab-link [routerLink]="link.routerLink" [active]="activeLink() === link.routerLink">
            {{ link.name }}
          </a>
        }
      </nav>
      <mat-tab-nav-panel #tabPanel />
      <router-outlet />
    </div>
  `,
  host: {
    class: 'block',
  },
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
