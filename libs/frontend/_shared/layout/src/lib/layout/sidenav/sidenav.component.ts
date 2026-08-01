import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { Nav } from '@mas/models';
import { ProgramsStore, ThemeService } from '@mas/frontend-shared-data-access';
import { AuthStore } from '@mas/frontend-shared-auth';

@Component({
  selector: 'mas-sidenav',
  host: {
    class: 'flex flex-col h-full gap-4',
  },
  imports: [RouterLink, RouterLinkActive, MatIcon, MatIconButton, MatExpansionModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host ::ng-deep .mat-expansion-panel-header {
        background-color: #455a64 !important;
      }
      :host ::ng-deep .mat-expansion-panel-header:hover {
        background-color: #546e7a !important;
      }
      :host ::ng-deep .mat-panel-title {
        color: white !important;
      }
      :host ::ng-deep .mat-expansion-indicator::after {
        border-color: white !important;
      }
    `,
  ],
  template: `
    @if (authStore.user()?.role === 'Administrator') {
      <mat-accordion>
        <mat-expansion-panel [expanded]="true">
          <mat-expansion-panel-header>
            <mat-panel-title>Admin</mat-panel-title>
          </mat-expansion-panel-header>
          <div class="flex flex-col">
            @for (item of adminItems(); track item.name) {
              <a
                class="nav-item p-2 pl-6"
                routerLinkActive="active"
                [routerLink]="item.routerLink"
                [routerLinkActiveOptions]="{ exact: true }"
              >
                {{ item.name }}
              </a>
            }
          </div>
        </mat-expansion-panel>
      </mat-accordion>
    }
    @if (authStore.isStaff()) {
      <mat-accordion>
        <mat-expansion-panel [expanded]="authStore.user()?.role === 'Partner_Staff'">
          <mat-expansion-panel-header>
            <mat-panel-title>Partner Staff</mat-panel-title>
          </mat-expansion-panel-header>
          <div class="flex flex-col">
            @for (item of partnerStaffItems(); track item.name) {
              <a
                class="nav-item p-2 pl-6"
                routerLinkActive="active"
                [routerLink]="item.routerLink"
                [routerLinkActiveOptions]="{ exact: true }"
              >
                {{ item.name }}
              </a>
            }
          </div>
        </mat-expansion-panel>
      </mat-accordion>
    }
    @if (authStore.user()) {
      <div class="flex flex-col gap-1">
        @for (item of basicItems(); track item.name) {
          <a
            class="nav-item p-2"
            routerLinkActive="active"
            [routerLink]="item.routerLink"
            [routerLinkActiveOptions]="{ exact: true }"
          >
            {{ item.name }}
          </a>
        }
      </div>
      @if (programsStore.usersPrograms().length > 0) {
        <mat-accordion>
          <mat-expansion-panel [expanded]="!authStore.isStaff()">
            <mat-expansion-panel-header>
              <mat-panel-title>Programs</mat-panel-title>
            </mat-expansion-panel-header>
            <div class="flex flex-col">
              @for (program of nonTemplatePrograms(); track program.id) {
                <a class="nav-item p-2 pl-6" routerLinkActive="active" [routerLink]="['/program-profiles', program.id]">
                  {{ formatName(program.name) }}
                </a>
              }
            </div>
          </mat-expansion-panel>
        </mat-accordion>
      }
    }
    <div class="flex flex-col gap-1">
      @for (item of navItems(); track item.name) {
        <a
          class="p-2 border-b-2 border-solid border-transparent"
          [class.active]="'border-grey'"
          routerLinkActive="active"
          [routerLink]="item.routerLink"
          [routerLinkActiveOptions]="{ exact: true }"
        >
          {{ item.name }}
        </a>
      }
    </div>
    <button class="mt-auto" mat-icon-button aria-label="Toggle dark mode" (click)="themeService.toggleDarkMode()">
      <mat-icon>{{ themeService.darkMode() ? 'wb_sunny' : 'nights_stay' }}</mat-icon>
    </button>
  `,
})
export class SidenavComponent {
  themeService = inject(ThemeService);
  authStore = inject(AuthStore);
  programsStore = inject(ProgramsStore);

  basicItems = signal<Nav[]>([{ name: 'Dashboard', routerLink: '/dashboard' }]);

  navItems = signal<Nav[]>([
    { name: 'Home', routerLink: '/' },
    { name: 'About Us', routerLink: '/about-us' },
    { name: 'Blogs', routerLink: '/blogs' },
    { name: 'Educational Resources', routerLink: '/educational-resources' },
    { name: 'Savings Calculator', routerLink: '/savings-calculator' },
    { name: 'User Guide', routerLink: '/user-guide' },
    { name: 'Discussion Boards', routerLink: '/discussion-boards' },
    { name: 'Peer Evaluation Guide', routerLink: '/peer-evaluation-guide' },
  ]);

  adminItems = signal<Nav[]>([
    { name: 'Users', routerLink: '/admin/users' },
    { name: 'Partners', routerLink: '/admin/partners' },
    { name: 'Blogs', routerLink: '/admin/blogs' },
    { name: 'Education Management', routerLink: '/admin/education-management' },
    { name: 'Home Management', routerLink: '/admin/home-management' },
    { name: 'About Us Management', routerLink: '/admin/about-us-management' },
    { name: 'User Guide', routerLink: '/admin/user-guide' },
    { name: 'Checkpoint Names', routerLink: '/admin/checkpoint-names' },
    { name: 'Email Campaign', routerLink: '/admin/email-blast' },
    { name: 'Peer Evaluation Guide', routerLink: '/admin/peer-evaluation-guide' },
  ]);

  partnerStaffItems = signal<Nav[]>([{ name: 'Programs', routerLink: 'partner-staff/programs' }]);

  nonTemplatePrograms = computed(() => this.programsStore.usersPrograms().filter((p) => !p.isTemplate));

  formatName(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  }

  userProgramsEffect = effect(() => {
    const user = this.authStore.user();

    untracked(() => {
      if (user) {
        this.programsStore.getProgramsForUser();
      } else {
        this.programsStore.clearUserPrograms();
      }
    });
  });
}
