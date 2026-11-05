import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthStore } from '@mas/frontend-shared-auth';
import { ActionCardComponent, PageTitleComponent, SectionPanelComponent } from '@mas/frontend-shared-components';
import { ProgramsStore } from '@mas/frontend-shared-data-access';

import { RequirementsCalendarComponent } from './requirements-calendar.component';

@Component({
  selector: 'mas-dashboard',
  imports: [ActionCardComponent, PageTitleComponent, RequirementsCalendarComponent, SectionPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-4 py-6 text-ink sm:px-6 sm:py-8 lg:px-8">
      <div class="mx-auto max-w-7xl space-y-8">
        <mas-page-title title="Dashboard" />

        <mas-requirements-calendar />

        <mas-section-panel heading="My programs" headingId="my-programs-heading">
          @if (programsStore.myProgramCards().length) {
            <div class="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
              @for (card of programsStore.myProgramCards(); track card.program.id) {
                <mas-action-card
                  [title]="card.program.name"
                  [status]="card.label"
                  [inactive]="card.isInactive"
                  [meta]="card.meta"
                  [description]="card.program.description || 'Open your program to view progress and next steps.'"
                  [actionLabel]="card.isInactive ? 'View program' : 'Open program'"
                  [link]="
                    authStore.isStaff()
                      ? ['/partner-staff/programs', card.program.id, 'progress']
                      : ['/program-profiles', card.program.id]
                  "
                />
              }
            </div>
          } @else {
            <div class="flex flex-col items-center justify-center px-6 py-12 text-center">
              <h3 class="text-sm font-bold text-ink">No active programs yet</h3>
              <p class="mt-1 max-w-md text-sm leading-6 text-ink-muted">
                Explore available programs and submit an enrollment request when you are ready.
              </p>
            </div>
          }
        </mas-section-panel>

        <mas-section-panel heading="Explore programs" headingId="explore-programs-heading">
          @if (programsStore.explorePrograms().length) {
            <div class="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
              @for (card of programsStore.explorePrograms(); track card.program.id) {
                <mas-action-card
                  [title]="card.program.name"
                  [status]="card.label"
                  [inactive]="card.isInactive"
                  [meta]="card.meta"
                  [description]="card.program.description || ''"
                  [actionLabel]="card.isInactive ? 'View details' : 'View and enroll'"
                  [link]="['/enroll', card.program.id]"
                />
              }
            </div>
          } @else {
            <div class="flex flex-col items-center justify-center px-6 py-12 text-center text-sm text-ink-muted">
              <p>There are no upcoming programs right now.</p>
            </div>
          }
        </mas-section-panel>

        <mas-section-panel heading="Tools and resources" headingId="resources-heading">
          <div class="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
            @for (resource of resources; track resource.path) {
              <mas-action-card
                [title]="resource.title"
                [description]="resource.description"
                [actionLabel]="resource.action"
                [link]="resource.path"
              />
            }
          </div>
        </mas-section-panel>
      </div>
    </div>
  `,
  host: { class: 'block' },
})
export class DashboardComponent {
  readonly authStore = inject(AuthStore);
  readonly programsStore = inject(ProgramsStore);
  readonly resources = [
    {
      path: '/savings-calculator',
      title: 'Savings calculator',
      description: 'Plan a savings goal and see how regular contributions can add up.',
      action: 'Open calculator',
    },
    {
      path: '/educational-resources',
      title: 'Educational resources',
      description: 'Browse practical guidance to support your financial wellbeing.',
      action: 'Browse resources',
    },
    {
      path: '/blogs',
      title: 'Blogs',
      description: 'Read stories, tips, and updates from the BRP community.',
      action: 'Read blogs',
    },
    {
      path: '/user-guide',
      title: 'User guide',
      description: 'Find a quick answer when you need help using the platform.',
      action: 'Open guide',
    },
  ] as const;

  constructor() {
    this.programsStore.getProgramsForUser();
    this.programsStore.getUpcoming();
  }
}
