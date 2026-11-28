import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { DiscussionBoardsStore, ProgramsStore, UsersStore } from '@mas/frontend-shared-data-access';
import { UserFull } from '@mas/models';
import type { EmailCampaignAudience } from './email-blast.store';

type AudienceMode = EmailCampaignAudience['type'];
type RoleFilter = 'all' | 'Participant' | 'Partner_Staff' | 'Administrator';
const FILTERS: { key: RoleFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'Participant', label: 'Participants' },
  { key: 'Partner_Staff', label: 'Partner staff' },
  { key: 'Administrator', label: 'Admins' },
];
const roleOf = (user: Pick<UserFull, 'role'>): Exclude<RoleFilter, 'all'> =>
  user.role === 'Administrator' || user.role === 'Partner_Staff' ? user.role : 'Participant';

@Component({
  selector: 'mas-email-recipient-modal',
  imports: [MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="flex max-h-[calc(100dvh-3rem)] w-full flex-col overflow-hidden rounded-2xl border border-outline/65 bg-surface/90 text-ink shadow-xl backdrop-blur-lg backdrop-saturate-150"
      aria-labelledby="recipient-heading"
    >
      <div class="flex items-center justify-between gap-3 border-b border-outline/55 py-4 pl-5 pr-4">
        <div>
          <h2 id="recipient-heading" class="text-xl font-bold">Choose recipients</h2>
          <p class="mt-1 text-sm text-ink-muted">Select people, one discussion board, or one program.</p>
        </div>
        <button
          type="button"
          class="flex h-10 w-10 items-center justify-center rounded-xl border border-brand/25 bg-surface-raised/70 text-ink-muted hover:border-brand/70 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand"
          aria-label="Close"
          (click)="dialogRef.close()"
        >
          <mat-icon class="mas-icon-md">close</mat-icon>
        </button>
      </div>
      <div role="tablist" aria-label="Recipient type" class="flex gap-1 border-b border-outline/55 px-4 pt-3">
        @for (tab of tabs; track tab.key) {
          <button
            type="button"
            role="tab"
            class="rounded-t-xl border border-b-0 px-3 py-2 text-xs font-bold text-ink-muted hover:text-ink aria-selected:border-brand/35 aria-selected:bg-surface-raised aria-selected:text-brand-strong sm:px-4 sm:text-sm"
            [attr.aria-selected]="mode() === tab.key"
            (click)="setMode(tab.key)"
          >
            {{ tab.label }}
          </button>
        }
      </div>
      <div class="flex flex-col gap-2 px-4 pt-3">
        <label class="relative block">
          <span class="sr-only">Search {{ activeLabel().toLowerCase() }}</span>
          <mat-icon class="mas-icon-sm pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle">
            search
          </mat-icon>
          <input
            type="search"
            class="min-h-10 w-full rounded-xl border border-brand/25 bg-surface-raised/70 py-2 pl-9 pr-3 text-sm text-ink outline-none placeholder:text-ink-subtle hover:border-brand/70 focus:border-brand/70 focus-visible:ring-2 focus-visible:ring-brand"
            [placeholder]="searchPlaceholder()"
            [value]="query()"
            (input)="updateQuery($event)"
          />
        </label>
        @if (mode() === 'users') {
          <div
            role="group"
            aria-label="Filter by role"
            class="flex w-full gap-1 overflow-x-auto rounded-xl border border-brand/25 bg-surface-raised/70 p-1"
          >
            @for (filter of filters; track filter.key) {
              <button
                type="button"
                class="flex min-h-8 flex-auto items-center justify-center whitespace-nowrap rounded-lg border border-transparent px-2 text-xs font-bold text-ink-muted hover:text-ink aria-pressed:border-brand/70 aria-pressed:bg-surface-raised aria-pressed:text-brand-strong"
                [attr.aria-pressed]="roleFilter() === filter.key"
                (click)="roleFilter.set(filter.key)"
              >
                {{ filter.label }}
              </button>
            }
          </div>
        }
      </div>
      <div class="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3">
        @if (mode() === 'users') {
          @for (group of userGroups(); track group.role) {
            <h3 class="mb-1.5 mt-3 px-1 text-xs font-bold text-ink-muted first:mt-0">{{ group.label }}</h3>
            <ul class="flex flex-col gap-2" [attr.aria-label]="group.label">
              @for (person of group.people; track person.id) {
                @let picked = selectedUserIds().includes(person.id);
                <li>
                  <button
                    type="button"
                    class="flex min-h-14 w-full items-center gap-3 rounded-xl border py-2 pl-2 pr-3 text-left transition-colors hover:border-brand/70 hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-brand"
                    [class]="picked ? pickedRowClass : rowClass"
                    [attr.aria-pressed]="picked"
                    (click)="toggleUser(person.id)"
                  >
                    <span
                      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft/80 text-sm font-bold text-brand-strong"
                    >
                      {{ person.initials }}
                    </span>
                    <span class="min-w-0 flex-1">
                      <span class="block truncate text-sm font-bold">{{ person.name }}</span>
                      <span class="block truncate text-xs text-ink-muted">{{ person.email }}</span>
                    </span>
                    <span
                      class="shrink-0 whitespace-nowrap rounded-full border border-brand/40 px-2 py-0.5 text-xs font-bold text-brand-strong"
                    >
                      {{ person.roleLabel }}
                    </span>
                    <span
                      class="ml-1 flex h-5 w-5 items-center justify-center rounded border text-xs"
                      [class.bg-brand-strong]="picked"
                      [class.text-brand-on]="picked"
                    >
                      {{ picked ? '✓' : '' }}
                    </span>
                  </button>
                </li>
              }
            </ul>
          } @empty {
            <p class="px-3 py-8 text-center text-sm text-ink-muted">
              {{ usersStore.users().length ? 'No one matches your search' : 'No users available.' }}
            </p>
          }
        } @else if (mode() === 'board') {
          <ul class="flex flex-col gap-2" aria-label="Discussion boards">
            @for (board of visibleBoards(); track board.id) {
              @let picked = selectedBoardId() === board.id;
              <li>
                <button
                  type="button"
                  class="flex min-h-14 w-full items-center gap-3 rounded-xl border px-3 py-2 text-left hover:border-brand/70 hover:bg-surface-raised aria-pressed:border-brand aria-pressed:bg-surface-raised"
                  [class]="picked ? pickedRowClass : rowClass"
                  [attr.aria-pressed]="picked"
                  (click)="selectedBoardId.set(picked ? null : board.id)"
                >
                  <span class="min-w-0 flex-1">
                    <span class="block truncate text-sm font-bold">{{ board.name }}</span>
                    <span class="block text-xs text-ink-muted">{{ board.memberCount }} members</span>
                  </span>
                  @if (picked) {
                    <span class="text-xs font-bold text-brand-strong">Selected</span>
                  }
                </button>
              </li>
            } @empty {
              <li class="px-3 py-8 text-center text-sm text-ink-muted">No discussion boards match your search.</li>
            }
          </ul>
        } @else {
          <ul class="flex flex-col gap-2" aria-label="Programs">
            @for (program of visiblePrograms(); track program.id) {
              @let picked = selectedProgramId() === program.id;
              <li>
                <button
                  type="button"
                  class="flex min-h-14 w-full items-center gap-3 rounded-xl border px-3 py-2 text-left hover:border-brand/70 hover:bg-surface-raised aria-pressed:border-brand aria-pressed:bg-surface-raised"
                  [class]="picked ? pickedRowClass : rowClass"
                  [attr.aria-pressed]="picked"
                  (click)="selectedProgramId.set(picked ? null : program.id)"
                >
                  <span class="min-w-0 flex-1 truncate text-sm font-bold">{{ program.name }}</span>
                  @if (picked) {
                    <span class="text-xs font-bold text-brand-strong">Selected</span>
                  }
                </button>
              </li>
            } @empty {
              <li class="px-3 py-8 text-center text-sm text-ink-muted">No programs match your search.</li>
            }
          </ul>
        }
      </div>
      <div class="flex items-center justify-between gap-3 border-t border-outline/55 px-4 py-3">
        <span class="text-sm font-bold text-ink-muted">{{ selectionSummary() }}</span>
        <div class="flex gap-2">
          <button
            type="button"
            class="min-h-10 rounded-xl border border-brand/25 bg-surface-raised/70 px-4 text-sm font-bold text-ink hover:border-brand/70"
            (click)="dialogRef.close()"
          >
            Cancel
          </button>
          <button
            type="button"
            class="min-h-10 rounded-xl border border-brand-strong bg-brand-strong px-4 text-sm font-bold text-brand-on disabled:opacity-45"
            [disabled]="!selection()"
            (click)="confirm()"
          >
            Use selection
          </button>
        </div>
      </div>
    </section>
  `,
  host: { class: 'block' },
})
export class EmailRecipientModalComponent {
  readonly dialogRef = inject(MatDialogRef<EmailRecipientModalComponent>);
  private readonly initialAudience = inject<EmailCampaignAudience | null>(MAT_DIALOG_DATA, { optional: true });
  readonly usersStore = inject(UsersStore);
  readonly boardsStore = inject(DiscussionBoardsStore);
  readonly programsStore = inject(ProgramsStore);
  readonly tabs: { key: AudienceMode; label: string }[] = [
    { key: 'users', label: 'Users' },
    { key: 'board', label: 'Discussion boards' },
    { key: 'program', label: 'Programs' },
  ];
  readonly filters = FILTERS;
  readonly rowClass = 'border-brand/25 bg-surface-raised/70';
  readonly pickedRowClass = 'border-brand bg-surface-raised ring-1 ring-inset ring-brand';
  readonly mode = signal<AudienceMode>(this.initialAudience?.type ?? 'users');
  readonly query = signal('');
  readonly roleFilter = signal<RoleFilter>('all');
  readonly selectedUserIds = signal<string[]>(
    this.initialAudience?.type === 'users' ? this.initialAudience.userIds : [],
  );
  readonly selectedBoardId = signal<string | null>(
    this.initialAudience?.type === 'board' ? this.initialAudience.boardId : null,
  );
  readonly selectedProgramId = signal<string | null>(
    this.initialAudience?.type === 'program' ? this.initialAudience.programId : null,
  );
  readonly activeLabel = computed(() => this.tabs.find((tab) => tab.key === this.mode())?.label ?? 'Users');
  readonly searchPlaceholder = computed(() =>
    this.mode() === 'users' ? 'Search by name or email' : `Search ${this.activeLabel().toLowerCase()}`,
  );
  readonly userGroups = computed(() => {
    const needle = this.query().trim().toLocaleLowerCase();
    const users = this.usersStore
      .users()
      .filter(
        (u) =>
          (this.roleFilter() === 'all' || roleOf(u) === this.roleFilter()) &&
          (!needle || `${u.firstName} ${u.lastName} ${u.email}`.toLocaleLowerCase().includes(needle)),
      );
    return (['Participant', 'Partner_Staff', 'Administrator'] as const)
      .map((role) => ({
        role,
        label: FILTERS.find((filter) => filter.key === role)?.label ?? role,
        people: users
          .filter((u) => roleOf(u) === role)
          .map((u) => ({
            id: u.id,
            name: `${u.firstName} ${u.lastName}`.trim(),
            email: u.email,
            initials: `${u.firstName.trim().charAt(0)}${u.lastName.trim().charAt(0)}`.toUpperCase(),
            roleLabel: role === 'Partner_Staff' ? 'Partner staff' : role === 'Administrator' ? 'Admin' : 'Participant',
          })),
      }))
      .filter((group) => group.people.length);
  });
  readonly visibleBoards = computed(() => {
    const n = this.query().trim().toLowerCase();
    return this.boardsStore.boards().filter((x) => x.name.toLowerCase().includes(n));
  });
  readonly visiblePrograms = computed(() => {
    const n = this.query().trim().toLowerCase();
    return this.programsStore.programs().filter((x) => x.name.toLowerCase().includes(n));
  });
  readonly selection = computed<EmailCampaignAudience | null>(() =>
    this.mode() === 'users' && this.selectedUserIds().length
      ? { type: 'users', userIds: this.selectedUserIds() }
      : this.mode() === 'board' && this.selectedBoardId()
        ? { type: 'board', boardId: this.selectedBoardId()! }
        : this.mode() === 'program' && this.selectedProgramId()
          ? { type: 'program', programId: this.selectedProgramId()! }
          : null,
  );
  readonly selectionSummary = computed(() =>
    this.selection()?.type === 'users'
      ? `${this.selectedUserIds().length} users selected`
      : this.selection()
        ? '1 audience selected'
        : 'Select recipients',
  );

  constructor() {
    this.usersStore.getUsers();
    this.boardsStore.getAllBoards().subscribe({ error: () => undefined });
    this.programsStore.getPrograms(undefined);
  }
  updateQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }
  setMode(mode: AudienceMode): void {
    if (this.mode() === mode) return;
    this.mode.set(mode);
    this.query.set('');
    this.selectedUserIds.set([]);
    this.selectedBoardId.set(null);
    this.selectedProgramId.set(null);
  }
  toggleUser(id: string): void {
    this.selectedUserIds.update((ids) => (ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]));
  }
  confirm(): void {
    const audience = this.selection();
    if (audience) this.dialogRef.close(audience);
  }
}
