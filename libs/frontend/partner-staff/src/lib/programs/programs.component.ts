import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AuthStore } from '@mas/frontend-shared-auth';
import { ConfirmDialogComponent } from '@mas/frontend-shared-components';
import { ProgramsStore } from '@mas/frontend-shared-data-access';
import { type Program } from '@mas/prisma-client/browser';
import { AddProgramComponent } from './ui/add-program/add-program.component';
import { CloneDialogComponent } from './ui/program-actions/clone-dialog/clone-dialog.component';

@Component({
  selector: 'mas-programs',
  imports: [DatePipe, MatIcon, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="min-h-dvh bg-[#f8fafc] dark:bg-[#0c1222] px-4 py-6 sm:px-6 lg:px-8">
      <section class="mx-auto max-w-7xl">
        <header
          class="relative bg-[#0d1b2f] dark:shadow-[inset_0_1px_0_rgba(148,163,184,0.1)] overflow-hidden rounded-3xl px-6 py-8 text-white sm:px-10 sm:py-10"
        >
          <div class="absolute -right-12 -top-16 h-52 w-52 rounded-full bg-teal-400/15 blur-3xl"></div>
          <div class="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div class="max-w-2xl">
              <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-teal-200">Program operations</p>
              <h1 class="mt-3 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Programs</h1>
              <p class="mt-3 text-sm leading-6 text-slate-300">
                Create, organize, and maintain the programs your participants rely on.
              </p>
            </div>
            <div class="flex items-center gap-3">
              <p class="hidden items-center gap-2 text-xs font-semibold text-slate-300 sm:inline-flex">
                <span class="h-2 w-2 rounded-full bg-teal-300"></span>
                {{ programsStore.programs().length }} programs
              </p>
              <button
                type="button"
                class="inline-flex bg-teal-100 text-teal-900 hover:bg-teal-200 dark:bg-teal-400 dark:text-teal-950 dark:hover:bg-teal-200 items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:ring-offset-2 focus:ring-offset-slate-950"
                (click)="openModal()"
              >
                <mat-icon class="!h-5 !w-5 !text-xl !leading-5">add</mat-icon>
                New program
              </button>
            </div>
          </div>
        </header>

        <section
          class="mt-6 dark:shadow-[0_10px_24px_rgba(0,0,0,0.2)] overflow-hidden rounded-2xl border border-gray-200 dark:border-slate-400/15 bg-white dark:bg-[#151b2e] shadow-sm dark:shadow-none"
        >
          <div
            class="flex flex-col gap-4 border-b border-gray-100 dark:border-slate-400/15 px-5 py-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between"
          >
            <div>
              <h2 class="text-base font-bold text-slate-950 dark:text-slate-100">Program directory</h2>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                Open a program to manage its participants, requirements, and content.
              </p>
            </div>
            <label class="relative block w-full lg:w-72">
              <mat-icon
                class="pointer-events-none absolute left-3 top-1/2 !h-5 !w-5 -translate-y-1/2 !text-xl !leading-5 text-gray-400 dark:text-slate-500"
              >
                search
              </mat-icon>
              <input
                type="search"
                class="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-gray-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-50 dark:border-slate-400/25 dark:bg-slate-950 dark:text-slate-200 dark:placeholder:text-slate-500"
                placeholder="Search programs"
                [value]="searchQuery()"
                (input)="setSearchQuery($event)"
              />
            </label>
          </div>
          @if (filteredPrograms().length) {
            <div class="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
              @for (program of filteredPrograms(); track program.id) {
                <article
                  class="flex min-h-72 flex-col rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-sm dark:border-slate-400/15 dark:bg-[#10182a] dark:shadow-none dark:hover:border-teal-400/40 dark:hover:bg-[#16243a]"
                >
                  <div class="flex items-start justify-between gap-3">
                    <span
                      class="inline-flex items-center rounded-full bg-teal-50 dark:bg-teal-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-teal-700 dark:text-teal-300"
                    >
                      {{ program.isTemplate ? 'Template' : 'Active program' }}
                    </span>
                    <button
                      type="button"
                      class="flex dark:hover:bg-red-400/10 dark:hover:text-red-300 h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
                      [attr.aria-label]="'Delete ' + program.name"
                      title="Delete program"
                      (click)="openDeleteConfirm(program)"
                    >
                      <mat-icon class="!h-4 !w-4 !text-base !leading-4">delete_outline</mat-icon>
                    </button>
                  </div>
                  <h3 class="mt-5 line-clamp-2 text-lg font-bold tracking-tight text-slate-950 dark:text-slate-100">
                    {{ program.name }}
                  </h3>
                  <p class="mt-2 line-clamp-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {{
                      descriptionPreview(program.description) ||
                        'Add a description to help staff understand this program.'
                    }}
                  </p>
                  <div
                    class="mt-5 grid grid-cols-2 gap-3 border-t border-gray-100 dark:border-slate-400/15 pt-4 text-xs"
                  >
                    <div>
                      <p class="font-medium text-gray-400 dark:text-slate-500">Starts</p>
                      <p class="mt-1 font-bold text-slate-700 dark:text-slate-300">
                        {{ program.startDate ? (program.startDate | date: 'MMM d, y') : 'To be set' }}
                      </p>
                    </div>
                    <div>
                      <p class="font-medium text-gray-400 dark:text-slate-500">Ends</p>
                      <p class="mt-1 font-bold text-slate-700 dark:text-slate-300">
                        {{ program.endDate ? (program.endDate | date: 'MMM d, y') : 'To be set' }}
                      </p>
                    </div>
                  </div>
                  <div class="mt-auto flex items-center gap-2 pt-5">
                    <a
                      class="inline-flex bg-teal-700 text-cyan-50 hover:bg-teal-800 dark:bg-teal-400 dark:text-teal-950 dark:hover:bg-teal-200 flex-1 items-center justify-center rounded-xl px-3 py-2.5 text-xs font-bold transition-colors"
                      [routerLink]="['/partner-staff/programs', program.id]"
                    >
                      Manage program
                    </a>
                    <button
                      type="button"
                      class="inline-flex items-center justify-center rounded-xl bg-teal-50 px-3 py-2.5 text-xs font-bold text-teal-800 transition-colors hover:bg-teal-100 dark:bg-teal-400/10 dark:text-teal-200 dark:hover:bg-teal-400/20"
                      (click)="openEdit(program)"
                    >
                      Edit
                    </button>
                    @if (program.isTemplate) {
                      <button
                        type="button"
                        class="inline-flex items-center justify-center rounded-xl bg-teal-50 px-3 py-2.5 text-xs font-bold text-teal-800 transition-colors hover:bg-teal-100 dark:bg-teal-400/10 dark:text-teal-200 dark:hover:bg-teal-400/20"
                        (click)="openCloneConfirm(program)"
                      >
                        Clone
                      </button>
                    }
                  </div>
                </article>
              }
            </div>
          } @else {
            <div class="flex flex-col items-center px-6 py-16 text-center">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-400/10 text-teal-700 dark:text-teal-300"
              >
                <mat-icon>search_off</mat-icon>
              </div>
              <h3 class="mt-4 text-sm font-bold text-slate-900 dark:text-slate-100">No programs found</h3>
              <p class="mt-1 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
                Try another search, or create a program to begin organizing your work.
              </p>
            </div>
          }
        </section>
      </section>
    </main>
  `,
  host: { class: 'block' },
})
export default class ProgramsComponent {
  private dialog = inject(MatDialog);
  private authStore = inject(AuthStore);
  programsStore = inject(ProgramsStore);

  readonly searchQuery = signal('');
  readonly filteredPrograms = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return this.programsStore.programs();
    return this.programsStore
      .programs()
      .filter((program) =>
        `${program.name} ${this.descriptionPreview(program.description)}`.toLowerCase().includes(query),
      );
  });

  constructor() {
    this.programsStore.getPrograms(this.authStore.user()?.partnerId ?? undefined);
  }

  openModal() {
    this.dialog.open(AddProgramComponent, { panelClass: 'w-full' });
  }

  setSearchQuery(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  descriptionPreview(description: string | null): string {
    return (description ?? '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  openEdit(program: Program): void {
    this.dialog.open(AddProgramComponent, { data: program, panelClass: 'w-full' });
  }

  openDeleteConfirm(program: Program): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Program',
        content: `Are you sure you want to delete ${program.name}?`,
        color: 'warn',
        onYesClick: () => this.programsStore.deleteProgram(program.id),
      },
    });
  }

  openCloneConfirm(program: Program): void {
    this.dialog.open(CloneDialogComponent, {
      data: {
        id: program.id,
        name: program.name,
        onYesClick: (name: string) => this.programsStore.cloneProgram([program.id, name]),
      },
    });
  }
}
