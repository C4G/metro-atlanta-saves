import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { ConnectedPosition } from '@angular/cdk/overlay';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { AuthStore } from '@mas/frontend-shared-auth';
import {
  ActionCardComponent,
  type ActionCardTone,
  ConfirmDialogComponent,
  PageTitleComponent,
  SectionPanelComponent,
} from '@mas/frontend-shared-components';
import { type DirectorySection, ProgramsStore } from '@mas/frontend-shared-data-access';
import { type Program } from '@mas/prisma-client/browser';
import { AddProgramComponent } from './ui/add-program/add-program.component';
import { CloneDialogComponent } from './ui/program-actions/clone-dialog/clone-dialog.component';

export const DIRECTORY_TONES: Record<DirectorySection, ActionCardTone> = {
  active: 'brand',
  upcoming: 'soft',
  inactive: 'warn',
  template: 'muted',
};

const PROGRAM_MENU_POSITIONS: ConnectedPosition[] = [
  { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 8 },
  { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -8 },
];

@Component({
  selector: 'mas-programs',
  imports: [
    ActionCardComponent,
    CdkMenu,
    CdkMenuItem,
    CdkMenuTrigger,
    MatIcon,
    PageTitleComponent,
    SectionPanelComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-4 py-6 text-ink sm:px-6 sm:py-8 lg:px-8">
      <div class="mx-auto max-w-7xl space-y-8">
        <mas-page-title title="Programs" />

        @for (group of programsStore.directoryGroups(); track group.key) {
          <mas-section-panel [heading]="group.title" [headingId]="'programs-' + group.key" [count]="group.total">
            <div panelActions class="flex w-full items-center gap-2 sm:w-auto">
              <label class="relative block min-w-0 flex-1 sm:w-64 sm:flex-none">
                <span class="sr-only">Search {{ group.title.toLowerCase() }}</span>
                <mat-icon
                  class="mas-icon-sm pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle"
                  aria-hidden="true"
                >
                  search
                </mat-icon>
                <input
                  type="search"
                  class="min-h-10 w-full rounded-xl border border-brand/25 bg-surface-raised/70 py-2 pl-9 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle hover:border-brand/70 hover:bg-surface-raised focus:border-brand/70 focus:bg-surface-raised focus-visible:ring-2 focus-visible:ring-brand"
                  [placeholder]="'Search ' + group.title.toLowerCase()"
                  [value]="group.query"
                  (input)="updateSearch(group.key, $event)"
                />
              </label>
              @if (group.key === 'active') {
                <button
                  type="button"
                  class="inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-brand/70 bg-surface-raised px-2.5 text-sm font-bold text-brand-strong transition-colors hover:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:px-3"
                  aria-label="New program"
                  (click)="openCreateDialog()"
                >
                  <mat-icon class="mas-icon-sm" aria-hidden="true">add</mat-icon>
                  <span class="hidden sm:inline" aria-hidden="true">New program</span>
                </button>
              }
            </div>

            @if (group.cards.length) {
              <div class="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
                @for (card of group.cards; track card.program.id) {
                  <mas-action-card
                    [title]="card.program.name"
                    [status]="card.label"
                    [tone]="tones[group.key]"
                    [inactive]="card.isInactive"
                    [meta]="card.meta"
                    [description]="card.program.description || 'No program description has been added yet.'"
                    actionLabel="Open program"
                    [link]="['/partner-staff/programs', card.program.id, 'progress']"
                  >
                    <button
                      cardMenu
                      type="button"
                      class="-my-1.5 -mr-2 flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-ink-muted transition-colors hover:border-brand/40 hover:bg-surface-raised hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand aria-expanded:border-brand/40 aria-expanded:bg-surface-raised aria-expanded:text-ink"
                      [cdkMenuTriggerFor]="programMenu"
                      [cdkMenuTriggerData]="{ $implicit: card.program }"
                      [cdkMenuPosition]="menuPositions"
                      [attr.aria-label]="'More actions for ' + card.program.name"
                    >
                      <mat-icon class="mas-icon-md" aria-hidden="true">more_horiz</mat-icon>
                    </button>
                    @if (card.isTemplate) {
                      <button
                        cardActions
                        type="button"
                        class="flex min-h-10 items-center justify-center rounded-xl border border-brand/55 px-4 text-xs font-bold text-brand-strong transition-colors hover:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                        [attr.aria-label]="'Clone ' + card.program.name"
                        (click)="openCloneDialog(card.program)"
                      >
                        Clone
                      </button>
                    }
                  </mas-action-card>
                }
              </div>
            } @else {
              <p class="px-5 py-10 text-center text-sm text-ink-muted">
                {{ group.query.trim() ? 'No matches in this section.' : group.emptyText }}
              </p>
            }
          </mas-section-panel>
        }
      </div>
    </div>

    <ng-template #programMenu let-program>
      <div
        cdkMenu
        class="w-60 rounded-2xl border border-brand/25 bg-surface-raised p-2 text-ink shadow-xl"
        [attr.aria-label]="'Actions for ' + program.name"
      >
        <button
          cdkMenuItem
          type="button"
          class="flex min-h-11 w-full items-center gap-3 rounded-xl border border-danger/35 py-1.5 pl-1.5 pr-2.5 text-left text-sm font-bold text-danger transition-colors hover:border-danger/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-danger/40"
          (cdkMenuItemTriggered)="deleteProgram(program)"
        >
          <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-danger/10" aria-hidden="true">
            <mat-icon class="mas-icon-sm">delete</mat-icon>
          </span>
          <span>
            Delete program
            <span class="block text-xs font-normal text-ink-muted">This cannot be undone</span>
          </span>
        </button>
      </div>
    </ng-template>
  `,
  host: { class: 'block' },
})
export default class ProgramsComponent {
  private readonly authStore = inject(AuthStore);
  private readonly dialog = inject(MatDialog);
  readonly programsStore = inject(ProgramsStore);
  readonly tones = DIRECTORY_TONES;
  readonly menuPositions = PROGRAM_MENU_POSITIONS;

  constructor() {
    this.programsStore.clearDirectoryQueries();
    this.programsStore.getPrograms(this.authStore.user()?.partnerId ?? undefined);
  }

  deleteProgram(program: Program): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        color: 'warn',
        content: `Delete ${program.name}? This action cannot be undone.`,
        onYesClick: () => this.programsStore.deleteProgram(program.id),
        title: 'Delete program',
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

  updateSearch(section: DirectorySection, event: Event): void {
    this.programsStore.setDirectoryQuery(section, (event.target as HTMLInputElement).value);
  }
}
