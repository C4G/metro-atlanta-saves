import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { ConfirmDialogComponent } from '@mas/frontend-shared-components';
import { CohortsStore } from '@mas/frontend-shared-data-access';
import type { Cohort } from '@mas/prisma-client/browser';
import { AddCohortComponent } from './ui/add-cohort/add-cohort.component';

@Component({
  selector: 'mas-about-us-management',
  imports: [DatePipe, MatButton, MatIcon, MatIconButton, MatTooltip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="admin-content-shell about-workspace">
      <header class="workspace-header">
        <div>
          <p class="eyebrow">Content & guidance</p>
          <h1>About us</h1>
          <p>Introduce the people and cohorts behind BRP with clear, welcoming stories that build trust.</p>
        </div>
        <button mat-raised-button color="primary" class="create-button" (click)="openModal()">
          <mat-icon>add</mat-icon>
          Add cohort
        </button>
      </header>

      @if (cohortsStore.cohorts().length) {
        <section class="cohort-grid" aria-label="About us cohorts">
          @for (cohort of cohortsStore.cohorts(); track cohort.id) {
            <article class="cohort-card">
              <div class="cohort-card__image"><img [src]="cohort.imageUrl" [alt]="cohort.name" /></div>
              <div class="cohort-card__content">
                <div class="cohort-card__heading">
                  <h2>{{ cohort.name }}</h2>
                  <span>About us</span>
                </div>
                <p>{{ cohort.description }}</p>
                <footer>
                  <time [attr.datetime]="cohort.updatedAt | date: 'yyyy-MM-dd'">
                    Updated {{ cohort.updatedAt | date: 'MMM d, y' }}
                  </time>
                  <div class="actions">
                    <button
                      mat-icon-button
                      matTooltip="Edit cohort"
                      aria-label="Edit cohort"
                      (click)="openEdit(cohort)"
                    >
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button
                      mat-icon-button
                      matTooltip="Delete cohort"
                      aria-label="Delete cohort"
                      class="delete-action"
                      (click)="openConfirm(cohort)"
                    >
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                </footer>
              </div>
            </article>
          }
        </section>
      } @else {
        <section class="empty-state">
          <mat-icon aria-hidden="true">groups</mat-icon>
          <h2>Start telling your story.</h2>
          <p>Add a cohort to introduce the people and purpose behind BRP.</p>
          <button mat-raised-button color="primary" (click)="openModal()">Add your first cohort</button>
        </section>
      }
    </main>
  `,
  styles: `
    :host {
      display: block;
    }
    .about-workspace {
      max-width: 76rem;
      margin: 0 auto;
      padding: clamp(1.25rem, 3vw, 2.5rem);
    }
    .workspace-header {
      display: flex;
      align-items: end;
      justify-content: space-between;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .eyebrow {
      margin: 0 0 0.5rem;
      color: var(--primary);
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.11em;
      text-transform: uppercase;
    }
    h1,
    h2 {
      color: var(--text-primary, inherit);
      letter-spacing: -0.035em;
    }
    h1 {
      margin: 0;
      font-size: clamp(2rem, 4vw, 2.75rem);
      font-weight: 750;
    }
    .workspace-header > div > p:last-child {
      max-width: 40rem;
      margin: 0.75rem 0 0;
      color: var(--text-secondary, inherit);
      line-height: 1.6;
    }
    .create-button {
      min-height: 2.85rem;
      border-radius: 0.8rem;
      white-space: nowrap;
    }
    .cohort-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1rem;
    }
    .cohort-card {
      overflow: hidden;
      border: 1px solid color-mix(in srgb, var(--text-primary, currentColor) 12%, transparent);
      border-radius: 1.1rem;
      background: var(--surface-card, transparent);
      transition:
        transform 180ms ease,
        border-color 180ms ease;
    }
    .cohort-card:hover {
      transform: translateY(-3px);
      border-color: color-mix(in srgb, var(--primary) 45%, transparent);
    }
    .cohort-card__image {
      aspect-ratio: 16 / 7;
      overflow: hidden;
      background: color-mix(in srgb, var(--primary) 12%, transparent);
    }
    .cohort-card__image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .cohort-card__content {
      padding: 1.2rem;
    }
    .cohort-card__heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }
    .cohort-card h2 {
      margin: 0;
      font-size: 1.2rem;
    }
    .cohort-card__heading span {
      padding: 0.22rem 0.48rem;
      border-radius: 999px;
      background: color-mix(in srgb, var(--primary) 14%, transparent);
      color: var(--primary);
      font-size: 0.68rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .cohort-card__content > p {
      display: -webkit-box;
      margin: 0.65rem 0 1.15rem;
      overflow: hidden;
      color: var(--text-secondary, inherit);
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
      line-height: 1.55;
    }
    .cohort-card footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }
    .cohort-card time {
      color: var(--text-secondary, inherit);
      font-size: 0.78rem;
    }
    .actions {
      display: flex;
      gap: 0.1rem;
    }
    .actions button {
      color: var(--text-secondary, inherit);
    }
    .actions .delete-action:hover {
      color: var(--mat-sys-error, #ba1a1a);
      background: color-mix(in srgb, var(--mat-sys-error, #ba1a1a) 10%, transparent);
    }
    .empty-state {
      display: grid;
      min-height: 20rem;
      place-content: center;
      padding: 2rem;
      border: 1px dashed color-mix(in srgb, var(--primary) 38%, transparent);
      border-radius: 1rem;
      text-align: center;
    }
    .empty-state mat-icon {
      width: 2.25rem;
      height: 2.25rem;
      margin: 0 auto 0.85rem;
      color: var(--primary);
      font-size: 2.25rem;
    }
    .empty-state h2 {
      margin: 0;
      font-size: 1.2rem;
    }
    .empty-state p {
      max-width: 25rem;
      margin: 0.5rem auto 1rem;
      color: var(--text-secondary, inherit);
    }
    @media (max-width: 40rem) {
      .workspace-header {
        align-items: stretch;
        flex-direction: column;
      }
      .create-button {
        width: 100%;
      }
      .cohort-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export default class AboutUsManagementComponent {
  private dialog = inject(MatDialog);
  cohortsStore = inject(CohortsStore);
  constructor() {
    this.cohortsStore.getCohorts();
  }
  openModal() {
    this.dialog.open(AddCohortComponent, { panelClass: 'w-full' });
  }
  openEdit(cohort: Cohort) {
    this.dialog.open(AddCohortComponent, { data: cohort, panelClass: 'w-full' });
  }
  openConfirm(cohort: Cohort) {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete cohort',
        content: `Are you sure you want to delete ${cohort.name}?`,
        color: 'warn',
        onYesClick: () => this.cohortsStore.deleteCohort(cohort.id),
      },
    });
  }
}
