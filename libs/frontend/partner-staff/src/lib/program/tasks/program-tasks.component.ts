import { ChangeDetectionStrategy, Component, DestroyRef, inject, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { TaskReviewStore } from '@mas/frontend-shared-data-access';
import RequirementsComponent from '../requirements/requirements.component';

@Component({
  selector: 'mas-program-tasks',
  imports: [MatIcon, RouterLink, RequirementsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a
      routerLink="../manage"
      class="mb-4 inline-flex min-h-11 items-center gap-1.5 rounded-lg text-sm font-bold text-brand-strong hover:underline focus:outline-none focus:ring-2 focus:ring-brand"
    >
      <mat-icon aria-hidden="true" class="!h-5 !w-5 !text-xl !leading-none">arrow_back</mat-icon>
      Manage program
    </a>
    <div class="rounded-2xl border border-outline bg-surface-raised p-5 sm:p-6">
      <mas-requirements [id]="id()" />
    </div>
  `,
  host: { class: 'block' },
})
export default class ProgramTasksComponent {
  readonly id = input.required<string>();

  constructor() {
    const review = inject(TaskReviewStore);
    inject(DestroyRef).onDestroy(() => review.load(review.programId()));
  }
}
