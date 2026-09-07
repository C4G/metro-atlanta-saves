import { ChangeDetectionStrategy, Component, effect, inject, input, untracked } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { ConfirmDialogComponent } from '@mas/frontend-shared-components';
import { type Requirement } from '@mas/prisma-client/browser';
import { RequirementsStore } from './requirements.store';
import { AddRequirementComponent } from './ui/add-requirement/add-requirement.component';

@Component({
  selector: 'mas-requirements',
  imports: [MatButtonModule, MatIcon, MatDialogModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="program-list-panel">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="program-list-kicker">Program setup</p>
          <h2 class="program-list-title">Requirements</h2>
          <p class="program-list-description">
            A simple checklist of the steps participants complete during the program.
          </p>
        </div>
        <button mat-raised-button aria-label="Add requirement" (click)="openModal()">
          <mat-icon>add</mat-icon>
          Add requirement
        </button>
      </div>
      <div class="program-record-list" aria-label="Program requirements">
        @for (requirement of requirementsStore.requirements(); track requirement.id; let index = $index) {
          <article class="program-record program-requirement-record">
            <span class="program-record-index">{{ index + 1 }}</span>
            <div class="min-w-0 flex-1">
              <h3 class="program-record-title">{{ requirement.name }}</h3>
              @if (requirement.EducationalContent; as content) {
                <a class="program-record-link" [href]="content.link" target="_blank" rel="noopener noreferrer">
                  <mat-icon>menu_book</mat-icon>
                  {{ content.title }}
                </a>
              } @else {
                <p class="program-record-meta">No educational resource connected yet</p>
              }
            </div>
            <div class="program-record-actions">
              <button mat-button (click)="openEdit(requirement)">Edit</button>
              <button mat-icon-button aria-label="Delete requirement" (click)="confirmDelete(requirement)">
                <mat-icon>delete_outline</mat-icon>
              </button>
            </div>
          </article>
        } @empty {
          <div class="program-record-empty">
            <mat-icon>checklist</mat-icon>
            <p>No requirements yet. Add the first step participants need to complete.</p>
          </div>
        }
      </div>
    </section>
  `,
  host: { class: 'block' },
})
export default class RequirementsComponent {
  id = input.required<string>();
  private dialog = inject(MatDialog);
  requirementsStore = inject(RequirementsStore);
  requirementsEffect = effect(() => {
    const id = this.id();
    untracked(() => {
      this.requirementsStore.setProgramId(id);
      this.requirementsStore.getRequirements();
    });
  });
  openModal() {
    this.dialog.open(AddRequirementComponent, { panelClass: 'w-full' });
  }
  openEdit(requirement: Requirement) {
    this.dialog.open(AddRequirementComponent, { data: requirement, panelClass: 'w-full' });
  }
  confirmDelete(requirement: Requirement) {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete requirement',
        content: `Are you sure you want to delete ${requirement.name}?`,
        color: 'warn',
        onYesClick: () => this.requirementsStore.deleteRequirement(requirement.id),
      },
    });
  }
}
