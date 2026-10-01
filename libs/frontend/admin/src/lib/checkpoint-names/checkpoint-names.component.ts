import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { ConfirmDialogComponent } from '@mas/frontend-shared-components';
import { CheckpointNamesStore } from '@mas/frontend-shared-data-access';
import { CheckpointName, CheckpointType } from '@mas/prisma-client/browser';
import { AddCheckpointNameComponent } from './ui/add-checkpoint-name/add-checkpoint-name.component';

type CheckpointFilter = 'All' | CheckpointType;

@Component({
  selector: 'mas-checkpoint-names',
  imports: [MatButtonModule, MatIcon, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="admin-directory min-h-dvh bg-[#f8fafc] px-4 py-6 sm:px-6 lg:px-8 dark:bg-[#0c1222]">
      <section class="mx-auto max-w-6xl">
        <nav
          class="mb-5 flex items-center gap-2 text-xs font-medium text-gray-400 dark:text-[#7f92a8]"
          aria-label="Breadcrumb"
        >
          <a
            class="rounded text-gray-500 transition-colors hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:text-[#a8b7c8]"
            routerLink="/admin"
          >
            Admin Settings
          </a>
          <span aria-hidden="true">/</span>
          <span class="text-gray-600 dark:text-[#a8b7c8]">Checkpoint names</span>
        </nav>

        <header class="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-teal-200">
              Program progress
            </p>
            <h1 class="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl dark:text-slate-100">
              Checkpoint names
            </h1>
            <p class="mt-2 max-w-xl text-sm leading-6 text-gray-500 dark:text-[#a8b7c8]">
              Create the milestones participants see as they move through a program.
            </p>
          </div>
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 dark:bg-teal-400 dark:text-teal-950 dark:hover:bg-teal-300 dark:hover:text-teal-950"
            (click)="openModal()"
          >
            <mat-icon class="!h-[18px] !w-[18px] !text-[18px] !leading-[18px]">add</mat-icon>
            New checkpoint
          </button>
        </header>

        <section class="mb-7 grid gap-3 sm:grid-cols-3" aria-label="Checkpoint overview">
          <div
            class="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm dark:border-slate-400/15 dark:bg-[#151b2e]"
          >
            <p class="text-xs font-medium text-gray-500 dark:text-[#a8b7c8]">Total checkpoints</p>
            <p class="mt-3 text-2xl font-bold tracking-tight text-gray-950 dark:text-slate-100">
              {{ checkpointNamesStore.checkpointNames().length }}
            </p>
          </div>
          <div
            class="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm dark:border-slate-400/15 dark:bg-[#151b2e]"
          >
            <p class="text-xs font-medium text-gray-500 dark:text-[#a8b7c8]">Savings milestones</p>
            <p class="mt-3 text-2xl font-bold tracking-tight text-gray-950 dark:text-slate-100">
              {{ typeCount('Savings') }}
            </p>
          </div>
          <div
            class="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm dark:border-slate-400/15 dark:bg-[#151b2e]"
          >
            <p class="text-xs font-medium text-gray-500 dark:text-[#a8b7c8]">Credit milestones</p>
            <p class="mt-3 text-2xl font-bold tracking-tight text-gray-950 dark:text-slate-100">
              {{ typeCount('Credit_Score') }}
            </p>
          </div>
        </section>

        <section
          class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-400/15 dark:bg-[#151b2e]"
        >
          <div class="flex flex-col gap-4 border-b border-gray-100 px-5 py-4 dark:border-slate-400/15">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 class="text-sm font-bold text-gray-900 dark:text-slate-100">Milestone directory</h2>
                <p class="mt-0.5 text-xs text-gray-500 dark:text-[#a8b7c8]">
                  {{ filteredCheckpoints().length }} checkpoints shown in completion order
                </p>
              </div>
              <label class="relative block w-full sm:w-72">
                <mat-icon
                  class="pointer-events-none absolute left-3 top-1/2 !h-4 !w-4 -translate-y-1/2 !text-base !leading-4 text-gray-400 dark:text-[#7f92a8]"
                >
                  search
                </mat-icon>
                <input
                  type="search"
                  class="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-50 dark:border-slate-400/15 dark:bg-[#111a2c] dark:text-slate-100 dark:focus:bg-[#151b2e] dark:focus:ring-teal-400/15"
                  placeholder="Search checkpoints..."
                  [value]="searchQuery()"
                  (input)="setSearchQuery($event)"
                />
              </label>
            </div>
            <div class="flex gap-2 overflow-x-auto pb-0.5" aria-label="Filter checkpoint type">
              @for (filter of filters; track filter.id) {
                <button
                  type="button"
                  class="min-w-max rounded-full border px-3 py-1.5 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  [class.border-gray-950]="typeFilter() === filter.id"
                  [class.bg-gray-950]="typeFilter() === filter.id"
                  [class.text-white]="typeFilter() === filter.id"
                  [class.border-gray-200]="typeFilter() !== filter.id"
                  [class.bg-white]="typeFilter() !== filter.id"
                  [class.text-gray-600]="typeFilter() !== filter.id"
                  (click)="typeFilter.set(filter.id)"
                >
                  {{ filter.label }}
                </button>
              }
            </div>
          </div>

          @if (filteredCheckpoints().length === 0) {
            <div class="flex flex-col items-center px-6 py-16 text-center">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-[#1b2940] dark:text-[#7f92a8]"
              >
                <mat-icon>flag</mat-icon>
              </div>
              <h3 class="mt-4 text-sm font-bold text-gray-900 dark:text-slate-100">No checkpoints found</h3>
              <p class="mt-1 max-w-sm text-sm leading-6 text-gray-500 dark:text-[#a8b7c8]">
                Add a checkpoint or try a different search or filter.
              </p>
            </div>
          } @else {
            <div class="divide-y divide-gray-100 dark:divide-slate-400/15">
              @for (checkpoint of filteredCheckpoints(); track checkpoint.name) {
                <article
                  class="checkpoint-row group relative z-0 flex items-center gap-3 px-5 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-sm dark:hover:z-[1] dark:hover:bg-[#16243a] dark:hover:shadow-[0_0_0_1px_rgba(45,212,191,0.4),0_6px_16px_rgba(0,0,0,0.18)] dark:hover:bg-[#1b2940]"
                >
                  <span
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-sm font-bold text-emerald-700 dark:bg-teal-400/10 dark:text-teal-200"
                  >
                    {{ checkpoint.sequence }}
                  </span>
                  <div class="min-w-0 flex-1">
                    <h3 class="truncate text-sm font-bold text-gray-950 dark:text-slate-100">{{ checkpoint.name }}</h3>
                    <p class="mt-0.5 text-xs text-gray-500 dark:text-[#a8b7c8]">{{ typeLabel(checkpoint.type) }}</p>
                  </div>
                  <span
                    class="hidden rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-600 sm:inline dark:bg-[#1b2940] dark:text-[#a8b7c8]"
                  >
                    {{ typeLabel(checkpoint.type) }}
                  </span>
                  <div
                    class="flex shrink-0 items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                  >
                    <button
                      type="button"
                      class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:text-[#7f92a8] dark:hover:bg-[#1b2940] dark:hover:text-slate-100"
                      [attr.aria-label]="'Edit ' + checkpoint.name"
                      (click)="editCheckpoint(checkpoint)"
                    >
                      <mat-icon class="!h-4 !w-4 !text-base !leading-4">edit</mat-icon>
                    </button>
                    <button
                      type="button"
                      class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-300 dark:text-[#7f92a8] dark:hover:bg-red-400/15 dark:hover:text-red-300"
                      [attr.aria-label]="'Delete ' + checkpoint.name"
                      (click)="confirmDelete(checkpoint)"
                    >
                      <mat-icon class="!h-4 !w-4 !text-base !leading-4">delete_outline</mat-icon>
                    </button>
                  </div>
                </article>
              }
            </div>
          }
        </section>
      </section>
    </main>
  `,
  host: { class: 'block' },
})
export default class CheckpointNamesComponent {
  private dialog = inject(MatDialog);
  checkpointNamesStore = inject(CheckpointNamesStore);
  readonly searchQuery = signal('');
  readonly typeFilter = signal<CheckpointFilter>('All');
  readonly filters: readonly { id: CheckpointFilter; label: string }[] = [
    { id: 'All', label: 'All types' },
    { id: 'Savings', label: 'Savings' },
    { id: 'Receipt', label: 'Receipts' },
    { id: 'Credit_Score', label: 'Credit score' },
    { id: 'Other', label: 'Other' },
  ];
  readonly filteredCheckpoints = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    return [...this.checkpointNamesStore.checkpointNames()]
      .filter(
        (checkpoint) =>
          (this.typeFilter() === 'All' || checkpoint.type === this.typeFilter()) &&
          (!query || checkpoint.name.toLowerCase().includes(query)),
      )
      .sort((a, b) => a.sequence - b.sequence || a.name.localeCompare(b.name));
  });
  constructor() {
    this.checkpointNamesStore.getCheckpointNames();
  }
  setSearchQuery(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }
  typeCount(type: CheckpointType) {
    return this.checkpointNamesStore.checkpointNames().filter((checkpoint) => checkpoint.type === type).length;
  }
  typeLabel(type: CheckpointType) {
    return type === 'Credit_Score' ? 'Credit score' : type;
  }
  openModal() {
    this.dialog.open(AddCheckpointNameComponent, { panelClass: 'w-full' });
  }
  editCheckpoint(checkpoint: CheckpointName) {
    this.dialog.open(AddCheckpointNameComponent, { data: checkpoint, panelClass: 'w-full' });
  }
  confirmDelete(checkpoint: CheckpointName) {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete checkpoint',
        content: `Are you sure you want to delete ${checkpoint.name}?`,
        color: 'warn',
        onYesClick: () => this.checkpointNamesStore.deleteName(checkpoint.name),
      },
    });
  }
}
