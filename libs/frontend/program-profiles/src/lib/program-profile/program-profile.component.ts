import { ChangeDetectionStrategy, Component, computed, effect, inject, input, untracked } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthStore } from '@mas/frontend-shared-auth';
import { ProgramsStore, UsersOnProgramsStore } from '@mas/frontend-shared-data-access';

interface ProgramNavItem {
  icon: string;
  name: string;
  routerLink: string;
}

@Component({
  selector: 'mas-program-profile',
  imports: [MatIcon, RouterLink, RouterLinkActive, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="min-h-full bg-canvas px-4 py-6 text-ink sm:px-6 sm:py-8 lg:px-8">
      <div class="mx-auto max-w-7xl">
        <a
          routerLink="/dashboard"
          class="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold text-brand-strong transition-colors hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand"
        >
          <mat-icon aria-hidden="true">arrow_back</mat-icon>
          Back to dashboard
        </a>

        <header class="mt-4 overflow-hidden rounded-3xl border border-outline bg-surface-raised">
          <div class="px-6 py-7 sm:px-8 sm:py-9">
            <p class="text-xs font-bold uppercase tracking-[0.18em] text-brand-strong">Your program</p>
            <h1 class="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              {{ programsStore.program()?.name || 'Program' }}
            </h1>
            <p class="mt-3 max-w-2xl text-sm leading-6 text-ink-muted sm:text-base">
              Find your next task, review your progress, and keep your program records together.
            </p>
          </div>

          @if (!authStore.isStaff()) {
            <div class="grid border-t border-outline sm:grid-cols-2">
              <section class="p-5 sm:border-r sm:border-outline sm:p-6" aria-label="Program progress">
                @let percentageCompleted = usersOnProgramsStore.percentageCompleted();
                <div class="flex items-end justify-between gap-4">
                  <div>
                    <p class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-subtle">
                      <mat-icon class="shrink-0 text-brand-strong" aria-hidden="true">trending_up</mat-icon>
                      Progress
                    </p>
                    <p class="mt-1 text-2xl font-black">{{ percentageCompleted }}%</p>
                  </div>
                </div>
                <div class="mt-4 h-2 overflow-hidden rounded-full bg-surface-subtle" aria-hidden="true">
                  <div class="h-full rounded-full bg-brand" [style.width.%]="percentageCompleted"></div>
                </div>
              </section>
              <section class="border-t border-outline p-5 sm:border-t-0 sm:p-6" aria-label="Total savings">
                <div class="flex items-end justify-between gap-4">
                  <div>
                    <p class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-subtle">
                      <mat-icon class="shrink-0 text-brand-strong" aria-hidden="true">savings</mat-icon>
                      Total saved
                    </p>
                    <p class="mt-1 text-2xl font-black">{{ usersOnProgramsStore.userProgramSavings() }}</p>
                  </div>
                </div>
              </section>
            </div>
          }
        </header>

        <nav
          class="mt-6 overflow-x-auto rounded-2xl border border-outline bg-surface p-2"
          aria-label="Program sections"
        >
          <div class="flex min-w-max justify-center gap-1 md:min-w-full">
            @for (link of links(); track link.routerLink) {
              <a
                [routerLink]="link.routerLink"
                routerLinkActive="bg-brand-soft/70 text-brand-strong"
                [routerLinkActiveOptions]="{ exact: link.routerLink === './' }"
                class="inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-ink-muted transition-colors hover:bg-brand-soft/70 hover:text-brand-strong focus:outline-none focus:ring-2 focus:ring-brand"
              >
                <mat-icon aria-hidden="true">{{ link.icon }}</mat-icon>
                {{ link.name }}
              </a>
            }
          </div>
        </nav>
        <router-outlet />
      </div>
    </main>
  `,
  host: { class: 'block min-h-full' },
})
export default class ProgramProfileComponent {
  id = input.required<string>();
  authStore = inject(AuthStore);
  programsStore = inject(ProgramsStore);
  usersOnProgramsStore = inject(UsersOnProgramsStore);

  links = computed<ProgramNavItem[]>(() => {
    const sharedLinks: ProgramNavItem[] = [
      { routerLink: './', name: 'Overview', icon: 'dashboard' },
      { routerLink: './particpants', name: 'Participants', icon: 'groups' },
    ];
    return this.authStore.isStaff()
      ? sharedLinks
      : [
          ...sharedLinks,
          { routerLink: './course-progress', name: 'My tasks', icon: 'task_alt' },
          { routerLink: './savings', name: 'My progress', icon: 'monitoring' },
          { routerLink: './receipts', name: 'Receipts', icon: 'receipt_long' },
        ];
  });

  getProgramEffect = effect(() => {
    const id = this.id();
    untracked(() => this.programsStore.getProgram(id));
  });

  userOnProgramsEffect = effect(() => {
    const id = this.id();
    const isStaff = this.authStore.isStaff();
    untracked(() => {
      this.usersOnProgramsStore.setProgramId(id);
      this.usersOnProgramsStore.getUsers();
      if (!isStaff) this.usersOnProgramsStore.getUserOnProgram();
    });
  });
}
