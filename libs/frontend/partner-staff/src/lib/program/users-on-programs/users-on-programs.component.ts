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
    <section class="p-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-300">
            Participant management
          </p>
          <h2 class="mt-1.5 text-xl font-bold tracking-[-0.025em] text-slate-900 dark:text-slate-100">Participants</h2>
          <p class="mt-1.5 text-[0.8125rem] leading-5 text-slate-500 dark:text-slate-400">
            See each person’s progress at a glance, then open their details when you need them.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            mat-raised-button
            class="!rounded-xl !bg-teal-50 !text-[0.8125rem] !font-bold !text-teal-800 dark:!bg-teal-400/10 dark:!text-teal-200"
            (click)="usersOnProgramsStore.downloadExcel()"
          >
            <mat-icon>download</mat-icon>
            Export
          </button>
          <button
            mat-raised-button
            class="!rounded-xl !bg-teal-700 !text-[0.8125rem] !font-bold !text-cyan-50 dark:!bg-teal-400 dark:!text-teal-950"
            (click)="openModal()"
          >
            <mat-icon>person_add</mat-icon>
            Add participant
          </button>
        </div>
      </div>
      <div class="mt-6 grid gap-2.5 program-people-list" aria-label="Program participants">
        @for (participant of usersOnProgramsStore.users(); track participant.userId) {
          <article
            class="flex min-h-[5.5rem] items-center gap-3.5 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 dark:border-slate-400/15 dark:bg-[#111a2c] program-participant-record"
          >
            <span
              class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-[0.8125rem] font-extrabold text-teal-800 dark:bg-teal-400/15 dark:text-teal-200"
            >
              {{ initials(participant.firstName, participant.lastName) }}
            </span>
            <div class="min-w-0 flex-1">
              <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100">
                {{ participant.firstName }} {{ participant.lastName }}
              </h3>
              <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ participant.email }}</p>
              <div
                class="mt-2 flex flex-wrap gap-1.5 [&_span]:rounded-full [&_span]:bg-teal-50 [&_span]:px-2 [&_span]:py-[0.2rem] [&_span]:text-[0.6875rem] [&_span]:font-bold [&_span]:text-teal-800 dark:[&_span]:bg-teal-400/10 dark:[&_span]:text-teal-200"
              >
                <span>{{ completedRequirements(participant) }} requirements complete</span>
                <span>{{ savings(participant.totalAmountSaved) }} saved</span>
              </div>
            </div>
            <button
              mat-icon-button
              class="!rounded-xl !text-teal-700 dark:!text-teal-300"
              aria-label="Participant actions"
              [matMenuTriggerFor]="participantActions"
            >
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
          <div
            class="flex flex-col items-center gap-2.5 rounded-2xl border border-dashed border-slate-300 px-6 py-11 text-center text-[0.8125rem] text-slate-500 [&_.mat-icon]:text-teal-700 dark:border-slate-400/25 dark:text-slate-400 dark:[&_.mat-icon]:text-teal-300"
          >
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
