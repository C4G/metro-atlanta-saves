import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AuthStore } from '@mas/frontend-shared-auth';
import { ProgramsStore } from '@mas/frontend-shared-data-access';
import { type Program } from '@mas/prisma-client/browser';
import { AddProgramComponent } from './ui/add-program/add-program.component';
import { CloneDialogComponent } from './ui/program-actions/clone-dialog/clone-dialog.component';
import { DeleteProgramDialogComponent } from './ui/program-actions/delete-dialog/delete-dialog.component';

type ProgramCard = Program & {
  descriptionText: string;
  searchText: string;
};

@Component({
  selector: 'mas-programs',
  imports: [DatePipe, MatIcon, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-canvas px-4 py-6 text-ink sm:px-6 sm:py-8 lg:px-8">
      <div class="mx-auto max-w-7xl space-y-6">
        <header class="rounded-3xl border border-outline bg-surface-raised px-6 py-8 sm:px-10 sm:py-10">
          <div class="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div class="max-w-2xl">
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-brand-strong">Program operations</p>
              <h1 class="mt-3 font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Programs</h1>
              <p class="mt-3 text-sm leading-6 text-ink-muted">
                Create, organize, and maintain the programs your participants rely on.
              </p>
            </div>
            <button
              type="button"
              class="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-brand-strong px-4 py-2.5 text-sm font-bold text-brand-on transition-colors hover:bg-brand focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-surface-raised sm:self-auto"
              (click)="openCreateDialog()"
            >
              <mat-icon aria-hidden="true">add</mat-icon>
              New program
            </button>
          </div>
        </header>

        <section
          class="overflow-hidden rounded-3xl border border-outline bg-surface shadow-sm"
          aria-labelledby="directory-title"
        >
          <div
            class="flex flex-col gap-4 border-b border-outline px-5 py-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between"
          >
            <div>
              <div class="flex items-center gap-3">
                <h2 id="directory-title" class="text-lg font-bold text-ink">Program directory</h2>
                <span class="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand-strong">
                  {{ programsStore.programs().length }}
                </span>
              </div>
              <p class="mt-1 text-sm text-ink-muted">
                Open a program to manage its participants, requirements, and content.
              </p>
            </div>

            <label class="relative block w-full lg:w-80">
              <span class="sr-only">Search programs</span>
              <mat-icon
                class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle"
                aria-hidden="true"
              >
                search
              </mat-icon>
              <input
                type="search"
                class="min-h-11 w-full rounded-xl border border-outline bg-surface-raised py-2.5 pl-11 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand focus:ring-2 focus:ring-brand/25"
                placeholder="Search programs"
                [value]="searchQuery()"
                (input)="updateSearch($event)"
              />
            </label>
          </div>

          @if (programCards().length) {
            <div class="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
              @for (program of programCards(); track program.id) {
                <article
                  class="group flex min-h-72 flex-col rounded-2xl border border-outline bg-surface-raised p-5 transition-colors hover:border-brand hover:bg-brand-soft/35 focus-within:border-brand focus-within:bg-brand-soft/35"
                >
                  <div class="flex items-start justify-between gap-3">
                    <span class="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand-strong">
                      {{ program.isTemplate ? 'Template' : 'Active program' }}
                    </span>
                    <button
                      type="button"
                      class="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl text-danger transition-colors hover:bg-danger/10 focus:outline-none focus:ring-2 focus:ring-danger/40"
                      [attr.aria-label]="'Delete ' + program.name"
                      (click)="deleteProgram(program)"
                    >
                      <mat-icon aria-hidden="true">delete_outline</mat-icon>
                    </button>
                  </div>

                  <h3 class="mt-5 line-clamp-2 text-lg font-bold tracking-tight text-ink">{{ program.name }}</h3>
                  <p class="mt-2 line-clamp-3 text-sm leading-6 text-ink-muted">
                    {{ program.descriptionText || 'No program description has been added yet.' }}
                  </p>

                  <dl class="mt-5 grid grid-cols-2 gap-3 border-t border-outline pt-4 text-xs">
                    <div>
                      <dt class="font-medium text-ink-subtle">Starts</dt>
                      <dd class="mt-1 font-bold text-ink">
                        {{ program.startDate ? (program.startDate | date: 'MMM d, y') : 'To be set' }}
                      </dd>
                    </div>
                    <div>
                      <dt class="font-medium text-ink-subtle">Ends</dt>
                      <dd class="mt-1 font-bold text-ink">
                        {{ program.endDate ? (program.endDate | date: 'MMM d, y') : 'To be set' }}
                      </dd>
                    </div>
                  </dl>

                  <div class="mt-auto flex flex-wrap items-center gap-2 pt-5">
                    <a
                      class="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl bg-brand-strong px-3 py-2 text-xs font-bold text-brand-on transition-colors hover:bg-brand focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-surface-raised"
                      [routerLink]="[program.id]"
                    >
                      Manage program
                    </a>
                    <button
                      type="button"
                      class="inline-flex min-h-10 items-center justify-center rounded-xl border border-outline bg-surface px-3 py-2 text-xs font-bold text-brand-strong transition-colors hover:border-brand hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand/40"
                      (click)="openEditDialog(program)"
                    >
                      Edit
                    </button>
                    @if (program.isTemplate) {
                      <button
                        type="button"
                        class="inline-flex min-h-10 items-center justify-center rounded-xl border border-outline bg-surface px-3 py-2 text-xs font-bold text-brand-strong transition-colors hover:border-brand hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand/40"
                        (click)="openCloneDialog(program)"
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
              <span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand-strong">
                <mat-icon aria-hidden="true">{{ searchQuery() ? 'search_off' : 'school' }}</mat-icon>
              </span>
              <h3 class="mt-4 text-base font-bold text-ink">
                {{ searchQuery() ? 'No programs match your search' : 'No programs yet' }}
              </h3>
              <p class="mt-1 max-w-sm text-sm leading-6 text-ink-muted">
                {{
                  searchQuery()
                    ? 'Try a different name or description.'
                    : 'Create your first program to begin organizing participants and requirements.'
                }}
              </p>
            </div>
          }
        </section>
      </div>
    </div>
  `,
  host: { class: 'block' },
})
export default class ProgramsComponent {
  private readonly authStore = inject(AuthStore);
  private readonly dialog = inject(MatDialog);
  readonly programsStore = inject(ProgramsStore);
  readonly searchQuery = signal('');
  readonly programCards = computed<ProgramCard[]>(() => {
    const query = this.searchQuery().trim().toLocaleLowerCase();

    return this.programsStore
      .programs()
      .map((program) => {
        const descriptionText = (program.description ?? '')
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        return {
          ...program,
          descriptionText,
          searchText: `${program.name} ${descriptionText}`.toLocaleLowerCase(),
        };
      })
      .filter((program) => !query || program.searchText.includes(query));
  });

  constructor() {
    this.programsStore.getPrograms(this.authStore.user()?.partnerId ?? undefined);
  }

  deleteProgram(program: Program): void {
    this.dialog.open(DeleteProgramDialogComponent, {
      data: {
        name: program.name,
        onConfirm: () => this.programsStore.deleteProgram(program.id),
      },
      maxWidth: 'calc(100vw - 2rem)',
      width: '28rem',
    });
  }

  openCloneDialog(program: Program): void {
    this.dialog.open(CloneDialogComponent, {
      data: {
        id: program.id,
        name: program.name,
        onYesClick: (name: string) => this.programsStore.cloneProgram([program.id, name]),
      },
      maxWidth: 'calc(100vw - 2rem)',
      width: '30rem',
    });
  }

  openCreateDialog(): void {
    this.dialog.open(AddProgramComponent, {
      maxWidth: 'calc(100vw - 2rem)',
      width: '44rem',
    });
  }

  openEditDialog(program: Program): void {
    this.dialog.open(AddProgramComponent, {
      data: program,
      maxWidth: 'calc(100vw - 2rem)',
      width: '44rem',
    });
  }

  updateSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }
}
