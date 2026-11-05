import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PageTitleComponent, ProgramTabsComponent } from '@mas/frontend-shared-components';
import { MainNavStore, ProgramsStore, TaskReviewStore } from '@mas/frontend-shared-data-access';

@Component({
  selector: 'mas-program',
  imports: [PageTitleComponent, ProgramTabsComponent, RouterOutlet],
  providers: [TaskReviewStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-w-0 px-4 py-6 text-ink sm:px-6 sm:py-8 lg:px-8">
      <div class="mx-auto max-w-7xl space-y-6 sm:space-y-8">
        <mas-page-title [title]="programName()">
          <mas-program-tabs />
        </mas-page-title>
        <router-outlet />
      </div>
    </div>
  `,
  host: { class: 'block min-h-full' },
})
export default class ProgramComponent {
  readonly id = input.required<string>();
  readonly programsStore = inject(ProgramsStore);
  private readonly mainNavStore = inject(MainNavStore);
  private readonly review = inject(TaskReviewStore);
  readonly programName = computed(() => {
    const program = this.programsStore.program();
    return program?.id === this.id() ? program.name : 'Program';
  });

  readonly programEffect = effect(() => {
    const id = this.id();
    untracked(() => {
      this.programsStore.getProgram(id);
      this.review.load(id);
    });
  });

  readonly programContextEffect = effect(() => {
    const id = this.id();
    const name = this.programName();
    untracked(() => this.mainNavStore.enterProgram({ id, name, workspace: true }));
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.mainNavStore.leaveProgram());
  }
}
