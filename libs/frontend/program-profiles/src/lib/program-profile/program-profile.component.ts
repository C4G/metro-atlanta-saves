import { ChangeDetectionStrategy, Component, computed, effect, inject, input, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatTabLink, MatTabNav, MatTabNavPanel } from '@angular/material/tabs';
import { NavigationEnd, Router, RouterLink, RouterOutlet, RoutesRecognized } from '@angular/router';
import { AuthStore } from '@mas/frontend-shared-auth';
import { ProgramsStore, UsersOnProgramsStore } from '@mas/frontend-shared-data-access';
import { Nav } from '@mas/models';
import { filter, map } from 'rxjs';

const PROGRAM_URL_REGEX = /\/program-profiles\/[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}\/?/;

@Component({
  selector: 'mas-program-profile',
  imports: [MatTabNav, MatTabLink, RouterLink, RouterOutlet, MatTabNavPanel, MatButtonModule, MatProgressBar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6">
      <p class="text-3xl font-bold mb-4">{{ programsStore.program()?.name }} Program</p>
      @if (!this.authStore.isStaff()) {
        <div class="grid gap-4 grid-cols-1 md:grid-cols-2 justify-center items-center">
          <div class="relative">
            @let percentageCompleted = usersOnProgramsStore.percentageCompleted();
            <mat-progress-bar color="accent" mode="determinate" [value]="percentageCompleted" />
            <span class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              Progress: {{ percentageCompleted }}%
            </span>
          </div>

          <div class="text-center">
            Total Saved:
            <strong>{{ usersOnProgramsStore.userProgramSavings() }}</strong>
          </div>
        </div>
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
  styles: `
    :host {
      --mat-progress-bar-track-height: 2rem;
      --mat-progress-bar-active-indicator-height: 2rem;
    }
  `,
})
export default class ProgramProfileComponent {
  id = input.required<string>();
  authStore = inject(AuthStore);
  programsStore = inject(ProgramsStore);
  usersOnProgramsStore = inject(UsersOnProgramsStore);
  private router = inject(Router);

  links = computed<Nav[]>(() =>
    this.authStore.isStaff()
      ? [
          { routerLink: './', name: 'Description' },
          { routerLink: './particpants', name: 'Participants' },
        ]
      : [
          { routerLink: './', name: 'Description' },
          { routerLink: './particpants', name: 'Participants' },
          { routerLink: './course-progress', name: 'My Progress' },
          { routerLink: './savings', name: 'My History' },
          { routerLink: './receipts', name: 'Upload Receipts' },
        ],
  );
  activeLink = toSignal(
    this.router.events.pipe(
      filter((event): event is RoutesRecognized => event instanceof NavigationEnd),
      map((event) => event.url.replace(PROGRAM_URL_REGEX, './')),
    ),
  );

  getProgramEffect = effect(() => {
    const id = this.id();

    untracked(() => {
      this.programsStore.getProgram(id);
    });
  });

  userOnProgramsEffect = effect(() => {
    const id = this.id();
    const isStaff = this.authStore.isStaff();

    untracked(() => {
      this.usersOnProgramsStore.setProgramId(id);
      this.usersOnProgramsStore.getUsers();
      if (!isStaff) {
        this.usersOnProgramsStore.getUserOnProgram();
      }
    });
  });
}
