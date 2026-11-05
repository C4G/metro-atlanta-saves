import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { AuthStore, roleLabelFor } from '@mas/frontend-shared-auth';
import { UsersStore } from '@mas/frontend-shared-data-access';
import { UserFull } from '@mas/models';
import { MimicRingComponent } from './mimic-ring.component';

export type MimicRole = 'Participant' | 'Partner_Staff' | 'Administrator';
export type MimicFilter = 'all' | MimicRole;

export type MimicCandidate = {
  id: string;
  name: string;
  email: string;
  initials: string;
  roleLabel: string;
};

export type MimicGroup = {
  role: MimicRole;
  label: string;
  people: MimicCandidate[];
};

export const MIMIC_FILTERS: { key: MimicFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'Participant', label: 'Participants' },
  { key: 'Partner_Staff', label: 'Partner staff' },
  { key: 'Administrator', label: 'Admins' },
];

const GROUP_ORDER: MimicRole[] = ['Participant', 'Partner_Staff', 'Administrator'];

export const mimicRoleOf = (user: Pick<UserFull, 'role'>): MimicRole =>
  user.role === 'Administrator' || user.role === 'Partner_Staff' ? user.role : 'Participant';

export const mimicGroupsFor = (
  users: Pick<UserFull, 'id' | 'firstName' | 'lastName' | 'email' | 'role'>[],
  currentEmail: string | undefined,
  query: string,
  filter: MimicFilter,
): MimicGroup[] => {
  const needle = query.trim().toLocaleLowerCase();
  const candidates = users.filter(
    (user) =>
      user.email !== currentEmail &&
      (filter === 'all' || mimicRoleOf(user) === filter) &&
      (!needle || `${user.firstName} ${user.lastName} ${user.email}`.toLocaleLowerCase().includes(needle)),
  );
  return GROUP_ORDER.map((role) => ({
    role,
    label: MIMIC_FILTERS.find(({ key }) => key === role)?.label ?? role,
    people: candidates
      .filter((user) => mimicRoleOf(user) === role)
      .map((user) => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        initials: `${user.firstName.trim().charAt(0)}${user.lastName.trim().charAt(0)}`.toLocaleUpperCase(),
        roleLabel: roleLabelFor(user.role),
      })),
  })).filter(({ people }) => people.length);
};

const CONTROL_CLASS =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand';

@Component({
  selector: 'mas-mimic-user-modal',
  imports: [MatIcon, MimicRingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="flex max-h-[calc(100dvh-6rem)] w-full flex-col overflow-hidden rounded-2xl border border-outline/65 bg-surface/90 text-ink shadow-xl backdrop-blur-lg backdrop-saturate-150"
      aria-labelledby="mimic-user-heading"
    >
      <div class="flex items-center justify-between gap-3 border-b border-outline/55 py-4 pl-5 pr-4">
        <h2 id="mimic-user-heading" class="text-xl font-bold">Mimic user</h2>
        <button
          type="button"
          class="flex h-10 w-10 items-center justify-center rounded-xl border border-brand/25 bg-surface-raised/70 text-ink-muted transition-colors hover:border-brand/70 hover:bg-surface-raised hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          aria-label="Close"
          (click)="dialogRef.close()"
        >
          <mat-icon class="mas-icon-md" aria-hidden="true">close</mat-icon>
        </button>
      </div>

      <div class="flex flex-col gap-2 px-4 pt-3">
        <label class="relative block">
          <span class="sr-only">Search people</span>
          <mat-icon
            class="mas-icon-sm pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle"
            aria-hidden="true"
          >
            search
          </mat-icon>
          <input
            type="search"
            class="min-h-10 w-full rounded-xl border border-brand/25 bg-surface-raised/70 py-2 pl-9 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle hover:border-brand/70 hover:bg-surface-raised focus:border-brand/70 focus:bg-surface-raised focus-visible:ring-2 focus-visible:ring-brand"
            placeholder="Search by name or email"
            [value]="query()"
            (input)="updateQuery($event)"
          />
        </label>
        <div
          role="group"
          aria-label="Filter by role"
          class="flex w-full gap-1 rounded-xl border border-brand/25 bg-surface-raised/70 p-1"
        >
          @for (option of filters; track option.key) {
            <button
              type="button"
              class="flex min-h-8 flex-auto items-center justify-center whitespace-nowrap rounded-lg border border-transparent px-2 text-xs font-bold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand aria-pressed:border-brand/70 aria-pressed:bg-surface-raised aria-pressed:text-brand-strong"
              [attr.aria-pressed]="filter() === option.key"
              (click)="filter.set(option.key)"
            >
              {{ option.label }}
            </button>
          }
        </div>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3">
        @for (group of groups(); track group.role) {
          <h3 class="mb-1.5 mt-3 px-1 text-xs font-bold text-ink-muted first:mt-0">{{ group.label }}</h3>
          <ul class="flex flex-col gap-2" [attr.aria-label]="group.label">
            @for (person of group.people; track person.id) {
              @let picked = person.id === selectedId();
              <li>
                <button
                  type="button"
                  class="flex min-h-14 w-full items-center gap-3 rounded-xl border py-2 pl-2 pr-3 text-left transition-colors hover:border-brand/70 hover:bg-surface-raised focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  [class]="picked ? pickedRowClass : rowClass"
                  [attr.aria-pressed]="picked"
                  (click)="selectedId.set(person.id)"
                >
                  <span
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft/80 text-sm font-bold text-brand-strong"
                    aria-hidden="true"
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
                </button>
              </li>
            }
          </ul>
        } @empty {
          <p class="px-3 py-8 text-center text-sm text-ink-muted">
            {{ hasCandidates() ? 'No one matches your search' : 'No users available to mimic.' }}
          </p>
        }
      </div>

      <div class="flex items-center justify-end gap-2 border-t border-outline/55 px-4 py-3">
        <span class="hidden min-w-0 flex-1 items-center gap-2.5 text-sm font-bold sm:flex">
          @if (selected(); as person) {
            <mas-mimic-ring>
              <span
                class="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-strong text-xs font-bold text-brand-on"
                aria-hidden="true"
              >
                {{ person.initials }}
              </span>
            </mas-mimic-ring>
            <span class="truncate">Mimic as {{ person.name }}</span>
          } @else {
            <span class="truncate text-ink-muted">Pick someone to mimic</span>
          }
        </span>
        <button
          type="button"
          [class]="
            controlClass + ' flex-1 border-brand/25 bg-surface-raised/70 text-ink hover:border-brand/70 sm:flex-none'
          "
          (click)="dialogRef.close()"
        >
          Cancel
        </button>
        <button
          type="button"
          [class]="
            controlClass +
            ' flex-1 border-brand-strong bg-brand-strong text-brand-on hover:border-brand hover:bg-brand disabled:cursor-default disabled:opacity-45 sm:flex-none'
          "
          [disabled]="!selected()"
          (click)="mimic()"
        >
          Mimic
        </button>
      </div>
    </section>
  `,
  host: { class: 'block' },
})
export class MimicUserModalComponent {
  private readonly authStore = inject(AuthStore);
  private readonly usersStore = inject(UsersStore);
  readonly dialogRef = inject(MatDialogRef<MimicUserModalComponent>);
  readonly filters = MIMIC_FILTERS;
  readonly controlClass = CONTROL_CLASS;
  readonly rowClass = 'border-brand/25 bg-surface-raised/70';
  readonly pickedRowClass = 'border-brand bg-surface-raised ring-1 ring-inset ring-brand';
  readonly query = signal('');
  readonly filter = signal<MimicFilter>('all');
  readonly selectedId = signal<string | null>(null);

  readonly groups = computed(() =>
    mimicGroupsFor(this.usersStore.users(), this.authStore.user()?.email, this.query(), this.filter()),
  );
  readonly hasCandidates = computed(() =>
    this.usersStore.users().some((user) => user.email !== this.authStore.user()?.email),
  );
  readonly selected = computed(
    () =>
      this.groups()
        .flatMap(({ people }) => people)
        .find(({ id }) => id === this.selectedId()) ?? null,
  );

  constructor() {
    this.usersStore.getUsers();
  }

  updateQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  mimic(): void {
    const person = this.selected();
    if (person) this.authStore.mimicUser(person.id);
  }
}
