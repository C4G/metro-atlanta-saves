import { formatCurrency } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input, untracked } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink } from '@angular/router';
import { ConfirmDialogComponent } from '@mas/frontend-shared-components';
import { UsersOnProgramsStore } from '@mas/frontend-shared-data-access';
import { UsersOnProgramsWithName } from '@mas/models';
import { AddUsersOnProgramsComponent } from './ui/add-users-on-programs/add-users-on-programs.component';

@Component({
  selector: 'mas-users-on-programs',
  imports: [MatButtonModule, MatIcon, MatDialogModule, MatMenuModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="program-list-panel">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="program-list-kicker">Participant management</p>
          <h2 class="program-list-title">Participants</h2>
          <p class="program-list-description">
            See each person’s progress at a glance, then open their details when you need them.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button mat-raised-button class="program-list-secondary" (click)="usersOnProgramsStore.downloadExcel()">
            <mat-icon>download</mat-icon>
            Export
          </button>
          <button mat-raised-button (click)="openModal()">
            <mat-icon>person_add</mat-icon>
            Add participant
          </button>
        </div>
      </div>
      <div class="program-record-list program-people-list" aria-label="Program participants">
        @for (participant of usersOnProgramsStore.users(); track participant.userId) {
          <article class="program-record program-participant-record">
            <span class="program-person-avatar">{{ initials(participant.firstName, participant.lastName) }}</span>
            <div class="min-w-0 flex-1">
              <h3 class="program-record-title">{{ participant.firstName }} {{ participant.lastName }}</h3>
              <p class="program-record-meta">{{ participant.email }}</p>
              <div class="program-record-tags">
                <span>{{ completedRequirements(participant) }} requirements complete</span>
                <span>{{ savings(participant.totalAmountSaved) }} saved</span>
              </div>
            </div>
            <button mat-icon-button aria-label="Participant actions" [matMenuTriggerFor]="participantActions">
              <mat-icon>more_horiz</mat-icon>
            </button>
            <mat-menu #participantActions="matMenu" class="brand-account-menu">
              <a mat-menu-item class="account-menu__item" [routerLink]="['./', participant.userId]">
                <mat-icon>checklist</mat-icon>
                <span>View progress</span>
              </a>
              <button mat-menu-item class="account-menu__item" (click)="openEdit(participant)">
                <mat-icon>edit</mat-icon>
                <span>Edit participant</span>
              </button>
              <button
                mat-menu-item
                class="account-menu__item account-menu__logout"
                (click)="confirmDelete(participant)"
              >
                <mat-icon>delete_outline</mat-icon>
                <span>Remove participant</span>
              </button>
            </mat-menu>
          </article>
        } @empty {
          <div class="program-record-empty">
            <mat-icon>group</mat-icon>
            <p>No participants yet. Add someone to begin tracking their program progress.</p>
          </div>
        }
      </div>
    </section>
  `,
  host: { class: 'block' },
})
export default class UsersOnProgramsComponent {
  id = input.required<string>();
  private dialog = inject(MatDialog);
  usersOnProgramsStore = inject(UsersOnProgramsStore);
  userOnProgramsEffect = effect(() => {
    const id = this.id();
    untracked(() => {
      this.usersOnProgramsStore.setProgramId(id);
      this.usersOnProgramsStore.getUsers();
    });
  });
  initials(firstName: string, lastName: string) {
    return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
  }
  completedRequirements(participant: UsersOnProgramsWithName) {
    return participant.requirementStatus?.length ?? 0;
  }
  savings(value?: number) {
    return formatCurrency(value ?? 0, 'en-US', '$', '1.0-0');
  }
  openModal() {
    this.dialog.open(AddUsersOnProgramsComponent, { panelClass: 'w-full' });
  }
  openEdit(participant: UsersOnProgramsWithName) {
    this.dialog.open(AddUsersOnProgramsComponent, { data: participant, panelClass: 'w-full' });
  }
  confirmDelete(participant: UsersOnProgramsWithName) {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Remove participant',
        content: `Remove ${participant.firstName} ${participant.lastName} from this program?`,
        color: 'warn',
        onYesClick: () => this.usersOnProgramsStore.deleteUser(participant.userId),
      },
    });
  }
}
