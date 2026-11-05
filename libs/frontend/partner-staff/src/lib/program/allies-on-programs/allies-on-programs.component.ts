import { formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, untracked } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { AgGridComponent, ConfirmDialogComponent, SpinnerComponent } from '@mas/frontend-shared-components';
import { AlliesOnProgramsStore } from '@mas/frontend-shared-data-access';
import { type ColDef } from 'ag-grid-community';
import { AddAlliesOnProgramsComponent } from './ui/add-allies-on-programs/add-allies-on-programs.component';
import { AlliesOnProgramsActionsComponent } from './ui/allies-on-programs-actions/allies-on-programs-actions.component';

@Component({
  selector: 'mas-allies-on-programs',
  imports: [SpinnerComponent, AgGridComponent, MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="min-w-0 p-5 sm:p-6" aria-label="Program allies">
      <div class="mb-5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div class="contents">
          <h3 class="text-lg font-semibold">
            Allies
            <span
              class="ml-2 inline-flex min-w-7 items-center justify-center rounded-lg bg-surface-subtle px-2 py-1 align-middle text-xs font-medium text-ink-muted"
            >
              {{ alliesStore.allies().length }}
            </span>
          </h3>
          <p class="order-last basis-full text-sm leading-6 text-ink-muted">People supporting your participants.</p>
        </div>
        @if (showAssignAction()) {
          <button
            type="button"
            (click)="openModal()"
            class="min-h-11 rounded-xl border border-outline px-3 text-sm font-semibold text-brand-strong hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand"
          >
            Assign ally
          </button>
        }
      </div>
      @if (alliesStore.loading()) {
        <p class="mb-4 text-sm text-ink-muted flex items-center gap-2" role="status">
          <mas-spinner class="text-brand" />
          <span class="sr-only">Loading allies</span>
        </p>
      }
      @if (alliesStore.loadFailed()) {
        <div class="mb-4 text-sm text-danger" role="alert">
          Allies could not be loaded.
          <button
            type="button"
            (click)="alliesStore.getAllies()"
            class="min-h-11 rounded-lg px-3 font-bold underline focus:outline-none focus:ring-2 focus:ring-brand"
          >
            Try again
          </button>
        </div>
      }
      <div class="overflow-hidden rounded-xl border border-outline">
        @for (ally of filteredAllies(); track ally.userId) {
          <article
            class="grid min-w-0 gap-4 border-b border-outline px-4 py-4 last:border-b-0 hover:bg-brand-soft/20 sm:px-5 lg:grid-cols-[minmax(13rem,1fr)_minmax(12rem,1.2fr)_auto] lg:items-center"
          >
            <div class="flex min-w-0 items-center gap-3">
              <span
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-strong"
              >
                <span aria-hidden="true" class="text-sm font-semibold">
                  {{ ally.firstName.charAt(0) }}{{ ally.lastName.charAt(0) }}
                </span>
              </span>
              <div class="min-w-0">
                <h4 class="truncate font-semibold">{{ ally.firstName }} {{ ally.lastName }}</h4>
                <p class="mt-1 truncate text-xs text-ink-muted">{{ ally.email }}</p>
              </div>
            </div>
            <p class="line-clamp-2 text-sm leading-6 text-ink-muted">
              {{ ally.bio || 'Supporting participants throughout this program.' }}
            </p>
            <div class="flex items-center justify-between gap-2 lg:justify-end">
              <span class="text-xs text-ink-muted lg:hidden">Assigned ally</span>
              <button
                type="button"
                (click)="removeAlly(ally.userId, ally.firstName, ally.lastName)"
                [attr.aria-label]="'Remove ' + ally.firstName + ' as ally'"
                class="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-ink-subtle hover:bg-danger/10 hover:text-danger focus:outline-none focus:ring-2 focus:ring-brand"
              >
                <mat-icon aria-hidden="true">person_remove</mat-icon>
              </button>
            </div>
          </article>
        } @empty {
          @if (!alliesStore.loading() && !alliesStore.loadFailed()) {
            <p class="p-6 text-sm text-ink-muted">
              {{
                query().trim()
                  ? 'No allies match your search.'
                  : 'No allies assigned yet. Assign an ally to support this program.'
              }}
            </p>
          }
        }
      </div>
      <details class="mt-4 border-t border-outline">
        <summary
          class="cursor-pointer py-4 text-xs font-semibold text-ink-muted hover:text-brand-strong focus:outline-none focus:ring-2 focus:ring-brand"
        >
          Detailed records and filters
        </summary>
        <div class="min-w-0 border-t border-outline p-2">
          <mas-ag-grid class="h-[24rem] min-w-0" [rowData]="alliesStore.allies()" [columnDefs]="colDefs" />
        </div>
      </details>
    </section>
  `,
  host: {
    class: 'block',
  },
})
export default class AlliesOnProgramsComponent {
  id = input.required<string>();
  readonly query = input('');
  readonly showAssignAction = input(true);
  private dialog = inject(MatDialog);
  protected alliesStore = inject(AlliesOnProgramsStore);
  readonly filteredAllies = computed(() => {
    const query = this.query().trim().toLowerCase();
    return this.alliesStore
      .allies()
      .filter((ally) => `${ally.firstName} ${ally.lastName} ${ally.email}`.toLowerCase().includes(query));
  });

  colDefs: ColDef[] = [
    { field: 'email', filter: true },
    { field: 'firstName', filter: true },
    { field: 'lastName', filter: true },
    {
      field: 'lastLogin',
      filter: true,
      valueFormatter: (params) => (params.value ? formatDate(params.value, 'medium', 'en-US') : ''),
    },
    {
      field: 'createdAt',
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
      cellRenderer: AlliesOnProgramsActionsComponent,
    },
  ];

  userOnProgramsEffect = effect(() => {
    const id = this.id();

    untracked(() => {
      this.alliesStore.setProgramId(id);
      this.alliesStore.getAllies();
    });
  });

  openModal() {
    this.dialog.open(AddAlliesOnProgramsComponent, {
      maxWidth: 'calc(100vw - 2rem)',
      width: '32rem',
      ariaLabelledBy: 'assign-ally-heading',
    });
  }

  removeAlly(userId: string, firstName: string, lastName: string): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Remove ally',
        content: `Remove ${firstName} ${lastName} from this program?`,
        color: 'warn',
        onYesClick: () => this.alliesStore.deleteAlly(userId),
      },
    });
  }
}
