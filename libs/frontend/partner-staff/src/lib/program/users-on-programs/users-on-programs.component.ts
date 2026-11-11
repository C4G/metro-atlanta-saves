import { CurrencyPipe, formatCurrency, formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, untracked } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { AgGridComponent, ConfirmDialogComponent, SpinnerComponent } from '@mas/frontend-shared-components';
import { RouterLink } from '@angular/router';
import { UsersOnProgramsWithName } from '@mas/models';
import { UsersOnProgramsStore } from '@mas/frontend-shared-data-access';
import { dateStringToNoTimezone, showOnlyDate } from '@mas/frontend-shared-util';
import { type ColDef } from 'ag-grid-community';
import { AddUsersOnProgramsComponent } from './ui/add-users-on-programs/add-users-on-programs.component';
import { RequirementBadgeComponent } from './ui/requirement-badge/requirement-badge.component';
import { UsersOnProgramsActionsComponent } from './ui/users-on-programs-actions/users-on-programs-actions.component';

@Component({
  selector: 'mas-users-on-programs',
  imports: [SpinnerComponent, AgGridComponent, CurrencyPipe, MatIcon, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="min-w-0 p-5 sm:p-6" aria-label="Program participants">
      <div class="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 class="text-lg font-semibold tracking-tight">
            Participants
            <span
              class="ml-2 inline-flex min-w-7 items-center justify-center rounded-lg bg-surface-subtle px-2 py-1 align-middle text-xs font-medium text-ink-muted"
            >
              {{ usersOnProgramsStore.users().length }}
            </span>
          </h3>
          <p class="mt-1 max-w-sm text-sm leading-6 text-ink-muted">
            Review progress, update program records, or add someone new.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            (click)="usersOnProgramsStore.downloadExcel()"
            class="min-h-11 rounded-xl border border-outline px-4 text-sm font-bold text-brand-strong hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand"
          >
            Export records
          </button>
          <button
            type="button"
            (click)="openModal()"
            class="min-h-11 rounded-xl bg-brand-strong px-4 text-sm font-bold text-brand-on hover:bg-brand focus:outline-none focus:ring-2 focus:ring-brand"
          >
            Add participant
          </button>
        </div>
      </div>
      @if (usersOnProgramsStore.usersLoading()) {
        <p class="mb-4 text-sm text-ink-muted flex items-center gap-2" role="status">
          <mas-spinner class="text-brand" />
          <span class="sr-only">Loading participants</span>
        </p>
      }
      @if (usersOnProgramsStore.usersLoadFailed()) {
        <div class="mb-4 text-sm text-danger" role="alert">
          Participants could not be loaded.
          <button
            type="button"
            (click)="usersOnProgramsStore.getUsers()"
            class="min-h-11 rounded-lg px-3 font-bold underline focus:outline-none focus:ring-2 focus:ring-brand"
          >
            Try again
          </button>
        </div>
      }
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        @for (user of filteredUsers(); track user.userId) {
          <article
            class="min-w-0 overflow-hidden rounded-2xl border border-outline bg-surface transition-colors hover:border-brand/50"
          >
            <div class="flex min-w-0 items-center gap-3 px-5 py-5">
              <span
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-strong"
              >
                <span aria-hidden="true" class="text-sm font-semibold">
                  {{ user.firstName.charAt(0) }}{{ user.lastName.charAt(0) }}
                </span>
              </span>
              <div class="min-w-0 flex-1">
                <div class="flex min-w-0 items-center justify-between gap-3">
                  <h4 class="truncate font-semibold tracking-tight">{{ user.firstName }} {{ user.lastName }}</h4>
                  <span class="shrink-0 rounded-md bg-brand-soft px-2 py-1 text-xs font-medium text-brand-strong">
                    Participant
                  </span>
                </div>
                <p class="mt-1 break-all text-xs leading-5 text-ink-muted">{{ user.email }}</p>
              </div>
            </div>
            <dl class="grid grid-cols-2 divide-x divide-outline border-y border-outline">
              <div class="px-5 py-4">
                <dt class="flex items-center gap-1.5 text-xs text-ink-subtle">
                  <mat-icon aria-hidden="true" class="text-[16px] leading-4">savings</mat-icon>
                  Total saved
                </dt>
                <dd class="mt-1.5 text-lg font-semibold tracking-tight">{{ user.totalAmountSaved ?? 0 | currency }}</dd>
              </div>
              <div class="px-5 py-4">
                <dt class="flex items-center gap-1.5 text-xs text-ink-subtle">
                  <mat-icon aria-hidden="true" class="text-[16px] leading-4">task_alt</mat-icon>
                  Completed
                </dt>
                <dd class="mt-1.5 text-lg font-semibold tracking-tight">
                  {{ user.completedRequirementIds?.length ?? user.requirementStatus.length }} tasks
                </dd>
              </div>
            </dl>
            <div class="flex flex-wrap items-center justify-between gap-2 px-3 py-3">
              <a
                [routerLink]="['/partner-staff/programs', id(), 'users', user.userId]"
                class="inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold text-brand-strong hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand"
              >
                View progress
              </a>
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  (click)="editParticipant(user)"
                  [attr.aria-label]="'Edit ' + user.firstName + ' ' + user.lastName"
                  title="Edit participant"
                  class="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-ink-muted hover:bg-brand-soft hover:text-brand-strong focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  <mat-icon aria-hidden="true">edit</mat-icon>
                </button>
                <button
                  type="button"
                  (click)="removeParticipant(user)"
                  [attr.aria-label]="'Remove ' + user.firstName + ' from program'"
                  class="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-ink-subtle hover:bg-danger/10 hover:text-danger focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  <mat-icon aria-hidden="true">person_remove</mat-icon>
                </button>
              </div>
            </div>
          </article>
        } @empty {
          @if (!usersOnProgramsStore.usersLoading() && !usersOnProgramsStore.usersLoadFailed()) {
            <p class="p-6 text-sm text-ink-muted">
              {{
                query().trim()
                  ? 'No participants match your search.'
                  : 'No participants yet. Add someone to get started.'
              }}
            </p>
          }
        }
      </div>
      <details class="mt-5 border-t border-outline">
        <summary
          class="cursor-pointer py-4 text-xs font-semibold text-ink-muted hover:text-brand-strong focus:outline-none focus:ring-2 focus:ring-brand"
        >
          Detailed records and filters
        </summary>
        <div class="min-w-0 border-t border-outline p-2">
          <mas-ag-grid class="h-[32rem] min-w-0" [rowData]="usersOnProgramsStore.users()" [columnDefs]="colDefs" />
        </div>
      </details>
    </section>
  `,
  host: {
    class: 'block',
  },
})
export default class UsersOnProgramsComponent {
  id = input.required<string>();
  readonly query = input('');
  private dialog = inject(MatDialog);
  usersOnProgramsStore = inject(UsersOnProgramsStore);
  readonly filteredUsers = computed(() => {
    const query = this.query().trim().toLowerCase();
    return this.usersOnProgramsStore
      .users()
      .filter((user) => `${user.firstName} ${user.lastName} ${user.email}`.toLowerCase().includes(query));
  });

  colDefs: ColDef[] = [
    {
      field: 'email',
      filter: true,
    },
    {
      field: 'firstName',
      filter: true,
    },
    {
      field: 'lastName',
      filter: true,
    },
    {
      field: 'lastLogin',
      filter: true,
      valueFormatter: (params) => (params.value ? formatDate(params.value, 'medium', 'en-US') : ''),
    },
    {
      field: 'totalAmountSaved',
      filter: true,
      valueFormatter: (params) => formatCurrency(params.value ?? 0, 'en-us', '$', '1.2'),
    },
    {
      field: 'completedRequirementIds',
      width: 390,
      filter: true,
      cellRenderer: RequirementBadgeComponent,
      filterValueGetter: (params) => params.data.checkpoints?.join(' ') ?? '',
    },
    {
      field: 'married',
      filter: true,
    },
    {
      field: 'educationStatus',
      filter: true,
    },
    {
      field: 'militaryStatus',
      filter: true,
    },
    {
      field: 'placeOfEmployment',
      filter: true,
    },
    {
      field: 'jobTitle',
      filter: true,
    },
    {
      field: 'annualIncome',
      filter: true,
      valueFormatter: (params) => formatCurrency(params.value, 'en-us', '$', '1.2'),
    },
    {
      field: 'address',
      filter: true,
    },
    {
      field: 'start',
      filter: true,
      valueFormatter: (params) => (params.value ? showOnlyDate(dateStringToNoTimezone(params.value)) : ''),
    },
    {
      field: 'end',
      filter: true,
      valueFormatter: (params) => (params.value ? showOnlyDate(dateStringToNoTimezone(params.value)) : ''),
    },
    {
      field: 'birthdate',
      filter: true,
      valueFormatter: (params) => (params.value ? showOnlyDate(dateStringToNoTimezone(params.value)) : ''),
    },
    {
      field: 'phone',
      filter: true,
    },
    {
      field: 'gender',
      filter: true,
    },
    {
      field: 'race',
      filter: true,
    },
    {
      field: 'creditScoreIncentive',
      filter: true,
    },
    {
      field: 'totalAmountPaidOut',
      filter: true,
      valueFormatter: (params) => formatCurrency(params.value, 'en-us', '$', '1.2'),
    },
    {
      field: 'paidDate',
      filter: true,
      valueFormatter: (params) => (params.value ? showOnlyDate(dateStringToNoTimezone(params.value)) : ''),
    },
    {
      field: 'graduated',
      filter: true,
    },
    {
      field: 'inactive',
      filter: true,
    },
    {
      field: 'createdAt',
      filter: true,
      valueFormatter: (params) => (params.value ? formatDate(params.value, 'medium', 'en-US') : ''),
    },
    {
      field: 'updatedAt',
      filter: true,
      valueFormatter: (params) => (params.value ? formatDate(params.value, 'medium', 'en-US') : ''),
    },
    {
      field: 'actions',
      resizable: false,
      filter: false,
      sortable: false,
      pinned: 'right',
      width: 100,
      cellRenderer: UsersOnProgramsActionsComponent,
    },
  ];

  userOnProgramsEffect = effect(() => {
    const id = this.id();

    untracked(() => {
      this.usersOnProgramsStore.setProgramId(id);
      this.usersOnProgramsStore.getUsers();
    });
  });

  openModal() {
    this.dialog.open(AddUsersOnProgramsComponent, { maxWidth: 'calc(100vw - 2rem)', width: '48rem' });
  }

  editParticipant(user: UsersOnProgramsWithName): void {
    this.dialog.open(AddUsersOnProgramsComponent, { data: user, maxWidth: 'calc(100vw - 2rem)', width: '48rem' });
  }

  removeParticipant(user: UsersOnProgramsWithName): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Remove participant',
        content: `Remove ${user.firstName} ${user.lastName} from this program?`,
        color: 'warn',
        onYesClick: () => this.usersOnProgramsStore.deleteUser(user.userId),
      },
    });
  }
}
