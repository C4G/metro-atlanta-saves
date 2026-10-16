import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { UsersOnProgramsStore } from '@mas/frontend-shared-data-access';

@Component({
  selector: 'mas-participants',
  imports: [MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="py-6 sm:py-8" aria-labelledby="participants-heading">
      <div>
        <p class="text-xs font-bold uppercase tracking-[0.16em] text-brand-strong">Your community</p>
        <h2 id="participants-heading" class="mt-1 text-2xl font-black tracking-tight">Participants</h2>
        <p class="mt-2 text-sm text-ink-muted">Meet the people learning and saving alongside you.</p>
      </div>
      @if (usersOnProgramsStore.users().length) {
        <div class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          @for (user of usersOnProgramsStore.users(); track user.userId) {
            <article
              class="rounded-2xl border border-outline bg-surface-raised p-5 transition-colors hover:border-brand hover:bg-brand-soft/25"
            >
              <div class="flex items-start gap-4">
                <span
                  class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-strong"
                >
                  <mat-icon aria-hidden="true">person</mat-icon>
                </span>
                <div class="min-w-0">
                  <h3 class="truncate text-base font-black">{{ user.firstName }} {{ user.lastName }}</h3>
                  @if (user.bio) {
                    <p class="mt-2 line-clamp-3 text-sm leading-6 text-ink-muted">{{ user.bio }}</p>
                  } @else {
                    <p class="mt-2 text-sm italic text-ink-subtle">No bio added yet.</p>
                  }
                </div>
              </div>
            </article>
          }
        </div>
      } @else {
        <div class="mt-5 rounded-2xl border border-dashed border-outline bg-surface-raised px-6 py-12 text-center">
          <mat-icon class="text-brand-strong" aria-hidden="true">groups</mat-icon>
          <h3 class="mt-3 text-lg font-bold">No participants to show</h3>
          <p class="mt-1 text-sm text-ink-muted">Participants will appear here after they join this program.</p>
        </div>
      }
    </section>
  `,
  host: { class: 'block' },
})
export default class ParticipantsComponent {
  usersOnProgramsStore = inject(UsersOnProgramsStore);
}
