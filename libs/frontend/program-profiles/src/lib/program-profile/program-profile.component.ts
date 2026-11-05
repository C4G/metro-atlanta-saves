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
import { AuthStore } from '@mas/frontend-shared-auth';
import { PageTitleComponent, ProgramTabsComponent } from '@mas/frontend-shared-components';
import { MainNavStore, ProgramsStore, UsersOnProgramsStore } from '@mas/frontend-shared-data-access';

@Component({
  selector: 'mas-program-profile',
  imports: [PageTitleComponent, ProgramTabsComponent, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-4 py-6 text-ink sm:px-6 sm:py-8 lg:px-8">
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
export default class ProgramProfileComponent {
  readonly id = input.required<string>();
  readonly authStore = inject(AuthStore);
  readonly programsStore = inject(ProgramsStore);
  readonly usersOnProgramsStore = inject(UsersOnProgramsStore);
  readonly mainNavStore = inject(MainNavStore);
  readonly programName = computed(() => {
    const program = this.programsStore.program();
    return program?.id === this.id() ? program.name : 'Program';
  });

  readonly getProgramEffect = effect(() => {
    const id = this.id();
    untracked(() => this.programsStore.getProgram(id));
  });

  readonly programContextEffect = effect(() => {
    const id = this.id();
    const name = this.programName();
    untracked(() => this.mainNavStore.enterProgram({ id, name }));
  });

  readonly userOnProgramsEffect = effect(() => {
    const id = this.id();
    const isStaff = this.authStore.isStaff();
    untracked(() => {
      this.usersOnProgramsStore.setProgramId(id);
      this.usersOnProgramsStore.getUsers();
      if (!isStaff) this.usersOnProgramsStore.getUserOnProgram();
    });
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.mainNavStore.leaveProgram());
  }
}
