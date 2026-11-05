import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { ConnectedPosition } from '@angular/cdk/overlay';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  Injector,
  input,
  untracked,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { LoaderComponent, SectionPanelComponent, SpinnerComponent } from '@mas/frontend-shared-components';
import {
  AlliesOnProgramsStore,
  ProgramsStore,
  TaskReviewStore,
  UsersOnProgramsStore,
} from '@mas/frontend-shared-data-access';
import { UsersOnProgramsWithName } from '@mas/models';
import { openMonthlyPlan } from '../monthly-progress/monthly-plan-dialog.component';
import { ConfirmWindowComponent, ConfirmWindowData } from '../ui/confirm-window.component';
import { openWindow } from '../ui/open-window';
import {
  AVATAR,
  CONTROL_PRIMARY,
  CONTROL_SM,
  CONTROL_SOLID_SM,
  FIELD,
  ICON_CONTROL,
  ICON_TILE,
  MENU,
  MENU_ITEM,
  PILLS,
  ROW,
  SEGMENT,
  SEGMENT_BUTTON,
} from '../ui/staff-ui';
import { AddPeopleDialogComponent } from './add-people-dialog.component';
import { EditParticipantData, EditParticipantDialogComponent } from './edit-participant-dialog.component';
import { ManageProgramStore } from './manage-program.store';
import { ParticipantPaymentsStore } from './participant-payments.store';
import { ProgramDocumentsStore } from './program-documents.store';
import { ProgramSettingsDialogComponent } from './program-settings-dialog.component';
import { RecordPaymentData, RecordPaymentDialogComponent } from './record-payment-dialog.component';

export const ROW_MENU_POSITIONS: ConnectedPosition[] = [
  { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 6 },
  { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -6 },
];

type Person = {
  userId: string;
  name: string;
  initials: string;
  isParticipant: boolean;
  record: UsersOnProgramsWithName | null;
};

@Component({
  selector: 'mas-manage-program',
  imports: [
    CdkMenu,
    CdkMenuItem,
    CdkMenuTrigger,
    LoaderComponent,
    MatIcon,
    RouterLink,
    SectionPanelComponent,
    SpinnerComponent,
  ],
  providers: [ManageProgramStore, ParticipantPaymentsStore, ProgramDocumentsStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <section class="min-w-0 overflow-hidden rounded-2xl border border-outline/65 bg-surface/60" aria-label="People">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-outline/55 px-4 py-4 sm:px-5">
          <div class="flex items-center gap-2 max-sm:w-full">
            <div role="group" aria-label="Show" [class]="segmentClass + ' max-sm:flex-1'">
              @for (tab of store.tabs(); track tab.value) {
                <button
                  type="button"
                  [class]="segmentButtonClass + ' max-sm:flex-1'"
                  [attr.aria-pressed]="store.tab() === tab.value"
                  (click)="store.setTab(tab.value)"
                >
                  {{ tab.label }}
                  <span class="font-normal tabular-nums opacity-80">{{ tab.count }}</span>
                </button>
              }
            </div>
            <button type="button" [class]="primaryClass" (click)="addPeople()">
              <mat-icon class="mas-icon-sm" aria-hidden="true">person_add</mat-icon>
              {{ store.addView().button }}
            </button>
          </div>
          <label class="relative block w-full sm:w-64">
            <span class="sr-only">Search people</span>
            <mat-icon
              class="mas-icon-sm pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle"
              aria-hidden="true"
            >
              search
            </mat-icon>
            <input
              #search
              type="search"
              [class]="fieldClass + ' pl-9'"
              placeholder="Search by name or email"
              [value]="store.query()"
              (input)="store.setQuery(search.value)"
            />
          </label>
        </div>

        @if (store.isLoadingPeople() && !store.rows().length) {
          <mas-loader label="Loading people" />
        } @else if (store.peopleLoadFailed()) {
          <p role="alert" class="p-6 text-sm text-danger">We could not load this list. Refresh to try again.</p>
        }
        <ul class="flex flex-col gap-2 p-3 sm:p-4" aria-label="People in this program">
          @for (person of store.rows(); track person.userId) {
            <li
              [class]="
                rowClass +
                ' flex items-center gap-3 p-2 transition-colors hover:border-brand/70 hover:bg-surface-raised has-[[aria-expanded=true]]:border-brand/70 has-[[aria-expanded=true]]:bg-surface-raised'
              "
            >
              <span [class]="avatarClass" aria-hidden="true">{{ person.initials }}</span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-bold">{{ person.name }}</span>
                <span class="block truncate text-xs text-ink-muted">{{ person.email }}</span>
              </span>
              <button
                type="button"
                [class]="iconControlClass"
                [cdkMenuTriggerFor]="rowMenu"
                [cdkMenuTriggerData]="{ $implicit: person }"
                [cdkMenuPosition]="menuPositions"
                [attr.aria-label]="'More options for ' + person.name"
              >
                <mat-icon class="mas-icon-md" aria-hidden="true">more_horiz</mat-icon>
              </button>
            </li>
          } @empty {
            @if (!store.isLoadingPeople() && !store.peopleLoadFailed()) {
              <li class="px-6 py-10 text-center text-sm text-ink-muted">
                {{
                  store.query().trim()
                    ? 'Nobody matches “' + store.query().trim() + '”.'
                    : store.tab() === 'allies'
                      ? 'No allies yet.'
                      : 'No participants yet.'
                }}
              </li>
            }
          }
        </ul>
      </section>

      <ng-template #rowMenu let-person>
        <div cdkMenu [class]="menuClass" [attr.aria-label]="'Actions for ' + person.name">
          @if (person.record) {
            <button type="button" cdkMenuItem [class]="menuItemClass" (cdkMenuItemTriggered)="editPerson(person)">
              <mat-icon class="mas-icon-md text-ink-muted" aria-hidden="true">edit</mat-icon>
              Edit details
            </button>
          }
          @if (person.isParticipant) {
            <button type="button" cdkMenuItem [class]="menuItemClass" (cdkMenuItemTriggered)="recordPayment(person)">
              <mat-icon class="mas-icon-md text-ink-muted" aria-hidden="true">payments</mat-icon>
              Record payment
            </button>
            <span class="mx-1 my-1.5 h-px bg-outline/55" role="separator"></span>
          }
          <button
            type="button"
            cdkMenuItem
            [class]="menuItemClass + ' text-danger hover:!border-danger/45'"
            (cdkMenuItemTriggered)="askToRemove(person)"
          >
            <mat-icon class="mas-icon-md text-danger" aria-hidden="true">person_remove</mat-icon>
            Remove from program
          </button>
        </div>
      </ng-template>

      <div class="grid min-w-0 grid-cols-[minmax(0,1fr)] items-start gap-6 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)]">
        <mas-section-panel heading="Program settings" headingId="settings-heading">
          <div panelActions class="flex gap-2">
            <button type="button" [class]="controlSmClass" (click)="participants.downloadExcel()">
              <mat-icon class="mas-icon-sm" aria-hidden="true">download</mat-icon>
              Export records
            </button>
            <button type="button" [class]="controlSmClass" (click)="editSettings()">Edit</button>
          </div>
          <dl class="flex flex-col px-4 py-2 sm:px-5">
            @for (row of store.settingRows(); track row.label) {
              <div class="flex min-h-11 items-center justify-between gap-3 border-b border-outline/45 last:border-b-0">
                <dt class="text-sm text-ink-muted">{{ row.label }}</dt>
                <dd class="flex items-center gap-2 text-right text-sm font-bold" [class.text-ink-muted]="row.isMissing">
                  {{ row.value }}
                  @if (row.needsDate) {
                    <button
                      type="button"
                      [class]="pills.warn + ' focus:outline-none focus-visible:ring-2 focus-visible:ring-brand'"
                      (click)="editSettings()"
                    >
                      Add date
                    </button>
                  }
                </dd>
              </div>
            }
          </dl>
        </mas-section-panel>

        <mas-section-panel heading="Monthly plan" headingId="plan-heading">
          <button
            panelActions
            type="button"
            [class]="controlSmClass"
            [disabled]="!review.data()"
            (click)="openPlan(review.currentMonth())"
          >
            Edit plan
          </button>
          <div class="flex flex-col gap-3 p-4 sm:p-5">
            @if (store.planMonths().length) {
              <ol class="grid grid-cols-5 gap-2">
                @for (month of store.planMonths(); track month.number) {
                  <li>
                    <button
                      type="button"
                      class="flex min-h-9 w-full items-center justify-center rounded-xl border text-xs font-bold transition-colors hover:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                      [class]="
                        month.hasTasks
                          ? 'border-brand/55 bg-brand-soft/60 text-brand-strong'
                          : 'border-brand/25 bg-surface-raised/70 text-ink-muted'
                      "
                      [attr.aria-label]="month.name + ', edit this month'"
                      (click)="openPlan(month.number)"
                    >
                      M{{ month.number }}
                    </button>
                  </li>
                }
              </ol>
            } @else if (review.data()) {
              <p class="text-sm text-ink-muted">No months yet. Choose how long the program runs.</p>
            }
            <a
              routerLink="../tasks"
              class="inline-flex min-h-9 items-center gap-1 self-start rounded-lg text-xs font-bold text-brand-strong hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              Task types, reminders and instructions
              <mat-icon class="mas-icon-sm" aria-hidden="true">arrow_forward</mat-icon>
            </a>
          </div>
        </mas-section-panel>

        <mas-section-panel heading="Enrollment requests" headingId="requests-heading">
          @if (store.requests().length) {
            <span panelActions [class]="pills.warn">{{ store.requests().length }} waiting</span>
          }
          <div class="p-4 sm:p-5">
            @if (programs.enrollmentsLoading()) {
              <p role="status" class="flex items-center gap-2 text-sm text-ink-muted">
                <mas-spinner class="text-brand" />
                Loading requests
              </p>
            } @else if (programs.enrollmentsLoadFailed()) {
              <p role="alert" class="text-sm text-danger">We could not load requests.</p>
            } @else {
              <ul class="flex flex-col gap-2.5">
                @for (request of store.requests(); track request.id) {
                  <li [class]="rowClass + ' overflow-hidden'">
                    <div class="flex items-center gap-3 p-3">
                      <span [class]="avatarClass" aria-hidden="true">{{ request.initials }}</span>
                      <span class="min-w-0 flex-1">
                        <span class="block truncate text-sm font-bold">{{ request.name }}</span>
                        @if (request.email) {
                          <span class="block truncate text-xs text-ink-muted">{{ request.email }}</span>
                        }
                      </span>
                    </div>
                    <div
                      class="flex flex-wrap items-center justify-between gap-2 border-t border-outline/45 bg-surface-subtle/45 py-2 pl-3 pr-2"
                    >
                      <span
                        class="inline-flex items-center gap-1.5 text-xs text-ink-muted"
                        [title]="'Applied ' + request.appliedOn"
                      >
                        <mat-icon class="mas-icon-sm" aria-hidden="true">schedule</mat-icon>
                        {{ request.appliedLabel }}
                      </span>
                      <span class="ml-auto flex gap-1.5">
                        <button
                          type="button"
                          [class]="controlSmClass + ' hover:!border-danger/55 hover:text-danger'"
                          [attr.aria-label]="'Decline ' + request.name"
                          (click)="decline(request)"
                        >
                          Decline
                        </button>
                        <button
                          type="button"
                          [class]="solidSmClass"
                          [attr.aria-label]="'Approve ' + request.name"
                          (click)="approve(request.id)"
                        >
                          Approve
                        </button>
                      </span>
                    </div>
                  </li>
                } @empty {
                  <li class="flex flex-col items-center gap-1.5 py-3 text-center">
                    <span [class]="iconTileClass" aria-hidden="true">
                      <mat-icon class="mas-icon-sm">how_to_reg</mat-icon>
                    </span>
                    <span class="text-sm font-bold">No requests waiting</span>
                    <span class="text-xs text-ink-muted">New applications to {{ programs.programName() }} show up here.</span>
                  </li>
                }
              </ul>
            }
          </div>
        </mas-section-panel>

        <mas-section-panel heading="Documents" headingId="documents-heading">
          <label panelActions [class]="controlSmClass + ' cursor-pointer focus-within:ring-2 focus-within:ring-brand'">
            @if (documents.uploading()) {
              <mas-spinner />
            } @else {
              <mat-icon class="mas-icon-sm" aria-hidden="true">upload</mat-icon>
            }
            Upload
            <input
              #files
              type="file"
              multiple
              accept="image/*,application/pdf"
              class="sr-only"
              [disabled]="documents.uploading()"
              (change)="upload(files)"
            />
          </label>
          <div class="flex flex-col gap-3 p-4 sm:p-5">
            @if (documents.error()) {
              <p role="alert" class="text-xs text-danger">{{ documents.error() }}</p>
            }
            @if (documents.loading()) {
              <p role="status" class="flex items-center gap-2 text-sm text-ink-muted">
                <mas-spinner class="text-brand" />
                Loading documents
              </p>
            } @else if (documents.loadFailed()) {
              <p role="alert" class="text-sm text-danger">We could not load documents.</p>
            } @else {
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-bold">Receipts without a month</h3>
                <span
                  class="text-xs font-bold tabular-nums"
                  [class]="documents.unsorted().length ? 'text-warn-ink' : 'text-ink-muted'"
                >
                  {{ documents.unsorted().length }}
                </span>
              </div>
              <ul class="flex flex-col gap-2">
                @for (receipt of documents.unsorted(); track receipt.id) {
                  <li [class]="rowClass + ' flex items-center gap-2 py-2 pl-3 pr-2'">
                    <span class="min-w-0 flex-1">
                      <span class="block truncate text-sm font-bold">{{ receipt.name }}</span>
                      <span class="block text-xs text-ink-muted">{{ receipt.who }}</span>
                    </span>
                    @if (receipt.isAssigning) {
                      <span role="status" class="text-brand">
                        <mas-spinner />
                        <span class="sr-only">Filing {{ receipt.name }}</span>
                      </span>
                    }
                    <select
                      #month
                      class="min-h-8 rounded-lg border border-brand/25 bg-surface-raised/70 px-2 text-xs text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50"
                      [disabled]="receipt.isAssigning || !documents.monthOptions().length"
                      [attr.aria-label]="'Assign ' + receipt.name + ' to a month'"
                      (change)="month.value && documents.assign({ imageId: receipt.id, month: +month.value })"
                    >
                      <option value="">Assign</option>
                      @for (option of documents.monthOptions(); track option.number) {
                        <option [value]="option.number">{{ option.name }}</option>
                      }
                    </select>
                  </li>
                } @empty {
                  <li
                    class="rounded-xl border border-dashed border-outline px-3 py-3 text-center text-sm text-ink-muted"
                  >
                    Every receipt has a month.
                  </li>
                }
              </ul>
              <div class="flex items-center justify-between pt-1">
                <h3 class="text-sm font-bold">Program library</h3>
                <span class="text-xs font-bold tabular-nums text-ink-muted">{{ documents.library().length }}</span>
              </div>
              <ul class="flex flex-col gap-2">
                @for (file of documents.library(); track file.id) {
                  <li [class]="rowClass + ' flex items-center gap-3 p-2'">
                    <span [class]="iconTileClass" aria-hidden="true">
                      <mat-icon class="mas-icon-sm">{{ fileIcons[file.kind] ?? 'description' }}</mat-icon>
                    </span>
                    <span class="min-w-0 flex-1 truncate text-sm font-bold">{{ file.name }}</span>
                    <button
                      type="button"
                      [class]="controlSmClass"
                      [attr.aria-label]="'Download ' + file.name"
                      (click)="download(file.id, file.name)"
                    >
                      Download
                    </button>
                  </li>
                } @empty {
                  <li
                    class="rounded-xl border border-dashed border-outline px-3 py-3 text-center text-sm text-ink-muted"
                  >
                    No shared files yet. Upload one for everyone in the program.
                  </li>
                }
              </ul>
            }
          </div>
        </mas-section-panel>
      </div>
    </div>
  `,
  host: { class: 'block' },
})
export default class ManageProgramComponent {
  readonly id = input.required<string>();
  readonly store = inject(ManageProgramStore);
  readonly documents = inject(ProgramDocumentsStore);
  readonly participants = inject(UsersOnProgramsStore);
  readonly programs = inject(ProgramsStore);
  readonly review = inject(TaskReviewStore);
  private readonly payments = inject(ParticipantPaymentsStore);
  private readonly allies = inject(AlliesOnProgramsStore);
  private readonly dialog = inject(MatDialog);
  private readonly injector = inject(Injector);
  readonly pills = PILLS;
  readonly segmentClass = SEGMENT;
  readonly segmentButtonClass = SEGMENT_BUTTON;
  readonly primaryClass = CONTROL_PRIMARY;
  readonly controlSmClass = CONTROL_SM;
  readonly solidSmClass = CONTROL_SOLID_SM;
  readonly iconControlClass = ICON_CONTROL;
  readonly iconTileClass = ICON_TILE;
  readonly fieldClass = FIELD;
  readonly rowClass = ROW;
  readonly avatarClass = AVATAR;
  readonly menuClass = MENU;
  readonly menuItemClass = MENU_ITEM;
  readonly menuPositions = ROW_MENU_POSITIONS;
  readonly fileIcons: Record<string, string> = { PDF: 'picture_as_pdf', IMG: 'image' };

  readonly loadEffect = effect(() => {
    const id = this.id();
    untracked(() => {
      this.participants.setProgramId(id);
      this.participants.getUsers();
      this.allies.setProgramId(id);
      this.allies.getAllies();
      this.programs.getEnrollments(id);
      this.documents.load(id);
      this.payments.load(id);
    });
  });

  addPeople(): void {
    this.store.startAdding();
    openWindow(this.dialog, AddPeopleDialogComponent, {
      width: '32.5rem',
      labelledBy: 'add-people-heading',
      injector: this.injector,
    });
  }

  editSettings(): void {
    openWindow(this.dialog, ProgramSettingsDialogComponent, {
      width: '37.5rem',
      labelledBy: 'program-settings-heading',
      injector: this.injector,
    });
  }

  editPerson(person: Person): void {
    if (!person.record) return;
    openWindow<EditParticipantDialogComponent, EditParticipantData>(this.dialog, EditParticipantDialogComponent, {
      width: '47.5rem',
      labelledBy: 'edit-participant-heading',
      injector: this.injector,
      data: { record: person.record, recordPayment: () => this.recordPayment(person) },
    });
  }

  recordPayment(person: Person): void {
    openWindow<RecordPaymentDialogComponent, RecordPaymentData>(this.dialog, RecordPaymentDialogComponent, {
      width: '35rem',
      labelledBy: 'record-payment-heading',
      injector: this.injector,
      data: { userId: person.userId, name: person.name, initials: person.initials },
    });
  }

  askToRemove(person: Person): void {
    this.store.askToRemove(person.userId);
    const removal = this.store.removal();
    if (!removal) return;
    openWindow<ConfirmWindowComponent, ConfirmWindowData, boolean>(this.dialog, ConfirmWindowComponent, {
      width: '26.25rem',
      labelledBy: 'confirm-window-heading',
      data: {
        initials: removal.initials,
        icon: removal.isParticipant ? 'person_remove' : 'visibility_off',
        heading: `Remove ${removal.name}?`,
        detail: removal.roleLabel,
        points: removal.points,
        keepLabel: 'Keep',
        confirmLabel: removal.confirmLabel,
      },
    })
      .afterClosed()
      .subscribe((confirmed) => (confirmed ? this.store.confirmRemove() : this.store.cancelRemove()));
  }

  approve(enrollmentId: string): void {
    this.programs.convertToUser({
      programId: this.id(),
      enrollmentId,
      onApproved: () => {
        this.participants.getUsers();
        this.review.load(this.id());
      },
    });
  }

  decline(request: { id: string; name: string; initials: string }): void {
    openWindow<ConfirmWindowComponent, ConfirmWindowData, boolean>(this.dialog, ConfirmWindowComponent, {
      width: '26.25rem',
      labelledBy: 'confirm-window-heading',
      data: {
        initials: request.initials,
        icon: 'close',
        heading: `Decline ${request.name}’s request?`,
        detail: 'Their application is deleted.',
        points: [],
        keepLabel: 'Keep',
        confirmLabel: 'Decline request',
      },
    })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) this.programs.deleteEnrollment({ programId: this.id(), enrollmentId: request.id });
      });
  }

  upload(input: HTMLInputElement): void {
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (files.length) this.documents.upload(files);
  }

  openPlan(month: number): void {
    openMonthlyPlan(this.dialog, this.injector, month);
  }

  download(id: string, name: string): void {
    this.documents.download({
      id,
      onReady: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = name;
        link.click();
        URL.revokeObjectURL(url);
      },
    });
  }
}
