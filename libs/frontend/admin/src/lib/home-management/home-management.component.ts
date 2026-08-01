import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTabLink, MatTabNav, MatTabNavPanel } from '@angular/material/tabs';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Nav } from '@mas/models';

@Component({
  selector: 'mas-home-management',
  imports: [MatTabNav, MatTabLink, RouterLink, RouterLinkActive, RouterOutlet, MatTabNavPanel, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6">
      <p class="text-3xl font-bold mb-4">Home Management</p>
      <nav mat-tab-nav-bar [tabPanel]="tabPanel">
        @for (link of links(); track link.routerLink) {
          <a
            mat-tab-link
            [routerLink]="link.routerLink"
            routerLinkActive
            #rla="routerLinkActive"
            [routerLinkActiveOptions]="{ exact: true }"
            [active]="rla.isActive"
          >
            <span [style.font-weight]="rla.isActive ? '700' : '400'">{{ link.name }}</span>
          </a>
        }
      </nav>
      <mat-tab-nav-panel #tabPanel />
      <router-outlet />
    </div>
  `,
})
export default class EducationManagementComponent {
  links = computed<Nav[]>(() => [
    { routerLink: '/admin/home-management/stories', name: 'Stories' },
    { routerLink: '/admin/home-management/learnings', name: 'Learning' },
    { routerLink: '/admin/home-management/description', name: 'Description' },
    { routerLink: '/admin/home-management/introduction', name: 'Introduction' },
    { routerLink: '/admin/home-management/what-we-are', name: 'Who We Are / What We Do' },
  ]);
}
