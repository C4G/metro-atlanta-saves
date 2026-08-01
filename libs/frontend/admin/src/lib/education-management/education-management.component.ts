import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatTabLink, MatTabNav, MatTabNavPanel } from '@angular/material/tabs';
import { NavigationEnd, Router, RouterLink, RouterOutlet, RoutesRecognized } from '@angular/router';
import { Nav } from '@mas/models';
import { filter, map } from 'rxjs';
import { EducationalCategoryFormComponent } from './educational-categories/ui/educational-category-form/educational-category-form.component';
import { EducationalContentFormComponent } from './educational-content/ui/educational-content-form/educational-content-form.component';

@Component({
  selector: 'mas-education-management',
  imports: [MatTabNav, MatTabLink, MatIcon, RouterLink, RouterOutlet, MatTabNavPanel, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6">
      <div class="flex justify-between align-middle">
        <p class="text-3xl font-bold mb-4">Education Management</p>
        <div>
          <button
            matPrefix
            mat-raised-button
            aria-label="add"
            color="primary"
            (click)="openContentModal()"
            class="mb-6 !mr-6"
          >
            <mat-icon>add</mat-icon>
            New Content
          </button>
          <button
            matPrefix
            mat-raised-button
            aria-label="add"
            color="secondary"
            (click)="openCategoryModal()"
            class="mb-6"
          >
            <mat-icon>add</mat-icon>
            New Category
          </button>
        </div>
      </div>
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
})
export default class EducationManagementComponent {
  private router = inject(Router);
  private dialog = inject(MatDialog);

  links = computed<Nav[]>(() => [
    { routerLink: '/admin/education-management', name: 'Education Content' },
    { routerLink: '/admin/education-management/educational-categories', name: 'Education Categories' },
    { routerLink: '/admin/education-management/content-notifications', name: 'Content Notifications' },
  ]);

  activeLink = toSignal(
    this.router.events.pipe(
      filter((event): event is RoutesRecognized => event instanceof NavigationEnd),
      map((event) => event.url),
    ),
  );

  openContentModal() {
    this.dialog.open(EducationalContentFormComponent, { panelClass: 'w-full' });
  }

  openCategoryModal() {
    this.dialog.open(EducationalCategoryFormComponent, { panelClass: 'w-full' });
  }
}
