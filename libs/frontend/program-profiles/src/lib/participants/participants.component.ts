import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { AuthStore } from '@mas/frontend-shared-auth';
import { SectionPanelComponent } from '@mas/frontend-shared-components';
import { UsersOnProgramsStore } from '@mas/frontend-shared-data-access';

@Component({
  selector: 'mas-participants',
  imports: [MatIcon, SectionPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mas-section-panel heading="Participants" headingId="participants-heading">
      <label panelActions class="relative block w-full sm:w-72">
        <span class="sr-only">Search participants</span>
        <mat-icon
          class="mas-icon-sm pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle"
          aria-hidden="true"
        >
          search
        </mat-icon>
        <input
          type="search"
          class="min-h-10 w-full rounded-xl border border-brand/25 bg-surface-raised/70 py-2 pl-9 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle hover:border-brand/70 hover:bg-surface-raised focus:border-brand/70 focus:bg-surface-raised focus-visible:ring-2 focus-visible:ring-brand"
          placeholder="Search participants"
          [value]="store.participantQuery()"
          (input)="updateSearch($event)"
        />
      </label>

      @if (store.usersLoading()) {
        <div role="status" class="grid gap-3 p-4 sm:p-5 md:grid-cols-2 lg:grid-cols-3">
          <span class="sr-only">Loading participants</span>
          @for (card of skeletonCards; track card) {
            <div aria-hidden="true" class="rounded-xl border border-brand/25 bg-surface-raised/70 p-3.5">
              <div class="flex animate-pulse items-center gap-3 motion-reduce:animate-none">
                <span class="h-10 w-10 shrink-0 rounded-lg bg-outline/50"></span>
                <span class="min-w-0 flex-1 space-y-2">
                  <span class="block h-3.5 w-2/5 rounded-lg bg-outline/50"></span>
                  <span class="block h-3 w-4/5 rounded-lg bg-outline/50"></span>
                </span>
              </div>
            </div>
          }
        </div>
      } @else if (store.users().length) {
        @if (store.visibleParticipants().length) {
          <ul class="grid items-start gap-3 p-4 sm:p-5 md:grid-cols-2 lg:grid-cols-3">
            @for (user of store.visibleParticipants(); track user.userId) {
              @let open = expandedId() === user.userId;
              @let isMe = user.userId === authStore.user()?.id;
              <li>
                <button
                  type="button"
                  class="flex w-full gap-3 rounded-xl border p-3.5 text-left text-ink transition-colors hover:border-brand/70 hover:bg-surface-raised focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  [class]="open ? openCardClass : isMe ? myCardClass : cardClass"
                  [attr.aria-expanded]="open"
                  [attr.aria-label]="
                    user.firstName + ' ' + user.lastName + (open ? ', hide full bio' : ', show full bio')
                  "
                  (click)="toggle(user.userId)"
                >
                  <span
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft/80 text-sm font-bold text-brand-strong"
                    aria-hidden="true"
                  >
                    {{ user.initials }}
                  </span>
                  <span class="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span class="flex min-w-0 items-center gap-2">
                      <span class="min-w-0 flex-1 truncate text-sm font-bold">
                        {{ user.firstName }} {{ user.lastName }}
                      </span>
                      @if (isMe) {
                        <span
                          class="shrink-0 rounded-full border border-brand/40 px-2 py-0.5 text-xs font-bold text-brand-strong"
                        >
                          You
                        </span>
                      }
                      <mat-icon
                        class="mas-icon-sm shrink-0 text-ink-muted transition-transform motion-reduce:transition-none"
                        [class.rotate-180]="open"
                        aria-hidden="true"
                      >
                        expand_more
                      </mat-icon>
                    </span>
                    <span
                      class="text-xs"
                      [class.truncate]="!open"
                      [class.leading-4]="!open"
                      [class.leading-5]="open"
                      [class.text-ink-muted]="!!user.bio"
                      [class.text-ink-subtle]="!user.bio"
                    >
                      {{ user.bio || 'No bio added yet' }}
                    </span>
                  </span>
                </button>
              </li>
            }
          </ul>
        } @else {
          <p class="px-5 py-8 text-center text-sm text-ink-muted">No participants match your search</p>
        }
      } @else {
        <div class="flex flex-col items-center px-6 py-12 text-center">
          <mat-icon class="text-brand-strong" aria-hidden="true">groups</mat-icon>
          <h3 class="mt-3 text-base font-bold">No participants to show</h3>
          <p class="mt-1 text-sm text-ink-muted">Participants will appear here after they join this program.</p>
        </div>
      }
    </mas-section-panel>
  `,
  host: { class: 'block' },
})
export default class ParticipantsComponent {
  readonly store = inject(UsersOnProgramsStore);
  readonly authStore = inject(AuthStore);
  readonly skeletonCards = [1, 2, 3, 4, 5, 6];
  readonly expandedId = signal<string | null>(null);
  readonly cardClass = 'border-brand/25 bg-surface-raised/70 items-center';
  readonly myCardClass = 'border-brand/70 bg-surface-raised/70 items-center';
  readonly openCardClass = 'border-brand bg-surface-raised items-start';

  constructor() {
    this.store.setParticipantQuery('');
  }

  toggle(userId: string): void {
    this.expandedId.update((current) => (current === userId ? null : userId));
  }

  updateSearch(event: Event): void {
    this.store.setParticipantQuery((event.target as HTMLInputElement).value);
  }
}
