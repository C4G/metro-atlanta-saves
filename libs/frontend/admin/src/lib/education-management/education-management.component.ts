import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { RouterLink, RouterOutlet } from '@angular/router';
import { EducationalCategoryFormComponent } from './educational-categories/ui/educational-category-form/educational-category-form.component';
import { EducationalContentFormComponent } from './educational-content/ui/educational-content-form/educational-content-form.component';

@Component({
  selector: 'mas-education-management',
  imports: [MatIcon, RouterLink, RouterOutlet, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="admin-content-shell management-workspace">
      <header class="management-header">
        <div>
          <p class="eyebrow">Content & guidance</p>
          <h1>Educational resources</h1>
          <p>
            Organize the practical tools and updates members rely on. Choose a workspace below, then create or refine
            content.
          </p>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="openContentModal()">
            <mat-icon>add</mat-icon>
            New resource
          </button>
          <button mat-button class="secondary-action" (click)="openCategoryModal()">
            <mat-icon>add</mat-icon>
            New category
          </button>
        </div>
      </header>

      <section class="area-picker" aria-labelledby="area-picker-heading">
        <div class="area-picker__heading">
          <p class="eyebrow">Choose an area</p>
          <h2 id="area-picker-heading">What would you like to manage?</h2>
        </div>
        <div class="area-grid">
          @for (area of areas(); track area.routerLink) {
            <a class="area-card" [routerLink]="area.routerLink">
              <div class="area-card__icon">
                <mat-icon aria-hidden="true">{{ area.icon }}</mat-icon>
              </div>
              <div>
                <h3>{{ area.name }}</h3>
                <p>{{ area.description }}</p>
              </div>
              <mat-icon class="area-card__arrow" aria-hidden="true">arrow_forward</mat-icon>
            </a>
          }
        </div>
      </section>
      <section class="active-workspace"><router-outlet /></section>
    </main>
  `,
  styles: `
    :host {
      display: block;
    }
    .management-workspace {
      max-width: 76rem;
      margin: 0 auto;
      padding: clamp(1.25rem, 3vw, 2.5rem);
    }
    .management-header {
      display: flex;
      align-items: end;
      justify-content: space-between;
      gap: 1.5rem;
      padding-bottom: 2rem;
    }
    .eyebrow {
      margin: 0 0 0.5rem;
      color: var(--primary);
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.11em;
      text-transform: uppercase;
    }
    h1 {
      margin: 0;
      color: var(--text-primary, inherit);
      font-size: clamp(2rem, 4vw, 2.75rem);
      font-weight: 750;
      letter-spacing: -0.04em;
    }
    .management-header > div > p:last-child {
      max-width: 42rem;
      margin: 0.75rem 0 0;
      color: var(--text-secondary, inherit);
      line-height: 1.6;
    }
    .header-actions {
      display: flex;
      flex: 0 0 auto;
      gap: 0.6rem;
    }
    .header-actions button {
      min-height: 2.85rem;
      border-radius: 0.8rem;
    }
    .secondary-action {
      color: var(--primary);
    }
    .area-picker {
      padding-top: 0.25rem;
    }
    .area-picker__heading {
      margin-bottom: 1rem;
    }
    .area-picker__heading .eyebrow {
      margin-bottom: 0.3rem;
    }
    .area-picker h2 {
      margin: 0;
      color: var(--text-primary, inherit);
      font-size: 1.15rem;
      letter-spacing: -0.02em;
    }
    .area-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.85rem;
    }
    .area-card {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      gap: 0.8rem;
      align-items: start;
      min-height: 9.5rem;
      padding: 1.15rem;
      border: 1px solid color-mix(in srgb, var(--text-primary, currentColor) 12%, transparent);
      border-radius: 1rem;
      background: var(--surface-card, transparent);
      color: inherit;
      text-decoration: none;
      transition:
        transform 180ms ease,
        border-color 180ms ease,
        background-color 180ms ease;
    }
    .area-card:hover {
      transform: translateY(-3px);
      border-color: color-mix(in srgb, var(--primary) 48%, transparent);
      background: color-mix(in srgb, var(--primary) 6%, var(--surface-card, transparent));
    }
    .area-card__icon {
      display: grid;
      width: 2.2rem;
      height: 2.2rem;
      place-items: center;
      border-radius: 0.7rem;
      background: color-mix(in srgb, var(--primary) 14%, transparent);
      color: var(--primary);
    }
    .area-card__icon mat-icon {
      width: 1.2rem;
      height: 1.2rem;
      font-size: 1.2rem;
    }
    .area-card h3 {
      margin: 0.12rem 0 0;
      color: var(--text-primary, inherit);
      font-size: 1rem;
    }
    .area-card p {
      margin: 0.42rem 0 0;
      color: var(--text-secondary, inherit);
      font-size: 0.84rem;
      line-height: 1.45;
    }
    .area-card__arrow {
      margin-top: 0.2rem;
      color: var(--primary);
      font-size: 1.15rem;
      transition: transform 180ms ease;
    }
    .area-card:hover .area-card__arrow {
      transform: translateX(0.2rem);
    }
    .active-workspace {
      margin-top: 1.5rem;
    }
    @media (max-width: 52rem) {
      .management-header {
        align-items: stretch;
        flex-direction: column;
      }
      .header-actions {
        flex-wrap: wrap;
      }
      .header-actions button:first-child {
        flex: 1;
      }
      .area-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export default class EducationManagementComponent {
  private dialog = inject(MatDialog);

  areas = computed(() => [
    {
      routerLink: '/admin/education-management/educational-content',
      name: 'Resources',
      description: 'Create and update the articles, links, and tools in your library.',
      icon: 'auto_stories',
    },
    {
      routerLink: '/admin/education-management/educational-categories',
      name: 'Categories',
      description: 'Create clear groupings that make resources easier to find.',
      icon: 'category',
    },
    {
      routerLink: '/admin/education-management/content-notifications',
      name: 'Notifications',
      description: 'Choose how to keep members informed about new content.',
      icon: 'notifications',
    },
  ]);

  openContentModal() {
    this.dialog.open(EducationalContentFormComponent, { panelClass: 'w-full' });
  }

  openCategoryModal() {
    this.dialog.open(EducationalCategoryFormComponent, { panelClass: 'w-full' });
  }
}
