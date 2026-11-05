import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { UsersOnProgramsStore } from '@mas/frontend-shared-data-access';
import { RequirementsStore } from '../requirements/requirements.store';

import { SpinnerComponent } from '@mas/frontend-shared-components';

@Component({
  selector: 'mas-cohort-percentage-completion',
  imports: [SpinnerComponent, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-labelledby="insights-heading" class="space-y-6">
      <header class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="insights-heading" class="text-2xl font-semibold tracking-tight">Program insights</h2>
          <p class="mt-2 text-sm leading-6 text-ink-muted">
            A clear view of savings, payouts, and participant progress.
          </p>
        </div>
        <button
          type="button"
          (click)="usersOnProgramsStore.downloadExcel()"
          class="min-h-11 rounded-xl border border-outline bg-surface-raised px-5 text-sm font-bold text-brand-strong hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand"
        >
          Export records
        </button>
      </header>
      @if (usersOnProgramsStore.usersLoading() || requirementsStore.loading()) {
        <p role="status" class="text-sm text-ink-muted flex items-center gap-2">
          <mas-spinner class="text-brand" />
          <span class="sr-only">Loading program insights</span>
        </p>
      } @else if (usersOnProgramsStore.usersLoadFailed() || requirementsStore.loadFailed()) {
        <div role="alert" class="text-sm text-danger">
          Insights could not be loaded.
          <button
            type="button"
            (click)="usersOnProgramsStore.getUsers(); requirementsStore.getRequirements()"
            class="min-h-11 rounded-lg px-3 font-bold underline focus:outline-none focus:ring-2 focus:ring-brand"
          >
            Try again
          </button>
        </div>
      } @else {
        <div class="grid gap-6 border-y border-outline py-6 sm:grid-cols-3">
          <article class="px-1 sm:px-5">
            <h3 class="text-sm text-ink-muted">Total saved</h3>
            <p class="mt-3 text-4xl font-semibold tracking-tight text-brand-strong">{{ totalSaved() | currency }}</p>
          </article>
          <article class="px-1 sm:px-5">
            <h3 class="text-sm text-ink-muted">Total paid out</h3>
            <p class="mt-3 text-4xl font-semibold tracking-tight">{{ totalPaidOut() | currency }}</p>
          </article>
          <article class="px-1 sm:px-5">
            <h3 class="text-sm text-ink-muted">Requirements complete</h3>
            <p class="mt-3 text-4xl font-semibold tracking-tight">
              {{ completion() }}
              <span class="text-lg text-ink-muted">%</span>
            </p>
          </article>
        </div>
        <section
          class="overflow-hidden rounded-2xl border border-outline bg-surface-raised"
          aria-labelledby="breakdown-heading"
        >
          <header class="flex flex-wrap items-end justify-between gap-4 border-b border-outline p-5 sm:p-6">
            <div>
              <h3 id="breakdown-heading" class="text-lg font-semibold">Participant breakdown</h3>
              <p class="mt-1 text-sm text-ink-muted">
                Compare progress without losing sight of individual participants.
              </p>
            </div>
            <div class="flex flex-wrap gap-2" aria-label="Breakdown metric">
              @for (option of metrics; track option.value) {
                <button
                  type="button"
                  [attr.aria-pressed]="metric() === option.value"
                  (click)="metric.set(option.value)"
                  [class.bg-brand-soft]="metric() === option.value"
                  [class.text-brand-strong]="metric() === option.value"
                  class="min-h-11 rounded-lg px-4 text-sm font-semibold hover:bg-brand-soft/35 focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  {{ option.label }}
                </button>
              }
            </div>
          </header>
          <div class="divide-y divide-outline">
            @for (person of people(); track person.userId) {
              <div class="grid gap-3 p-5 sm:grid-cols-[12rem_minmax(0,1fr)_7rem] sm:items-center sm:p-6">
                <p class="break-words text-sm font-bold">{{ person.name }}</p>
                <div
                  class="h-3 overflow-hidden rounded-full bg-surface-subtle"
                  role="progressbar"
                  [attr.aria-label]="
                    person.name + (metric() === 'completion' ? ' requirement completion' : ' share of maximum savings')
                  "
                  aria-valuemin="0"
                  aria-valuemax="100"
                  [attr.aria-valuenow]="metric() === 'completion' ? person.progress : person.savingsPercent"
                >
                  <div
                    class="h-full rounded-full bg-brand-strong motion-safe:transition-all"
                    [style.width.%]="metric() === 'completion' ? person.progress : person.savingsPercent"
                  ></div>
                </div>
                <p class="text-sm font-bold text-brand-strong sm:text-right">
                  {{ metric() === 'completion' ? person.progress + '%' : (person.saved | currency) }}
                </p>
              </div>
            }
          </div>
        </section>
      }
    </section>
  `,
  host: { class: 'block' },
})
export default class CohortPercentageCompletionComponent {
  readonly id = input.required<string>();
  readonly usersOnProgramsStore = inject(UsersOnProgramsStore);
  readonly requirementsStore = inject(RequirementsStore);
  readonly metric = signal<'completion' | 'savings'>('completion');
  readonly metrics = [
    { value: 'completion' as const, label: 'Completion' },
    { value: 'savings' as const, label: 'Savings' },
  ];
  readonly people = computed(() => {
    const ids = new Set(this.requirementsStore.requirements().map((requirement) => requirement.id));
    const users = this.usersOnProgramsStore.users();
    const max = Math.max(0, ...users.map((user) => user.totalAmountSaved ?? 0));
    return users.map((user) => {
      const complete = new Set(
        (user.completedRequirementIds ?? user.requirementStatus ?? []).filter((id) => ids.has(id)),
      );
      return {
        userId: user.userId,
        name: `${user.firstName} ${user.lastName}`,
        saved: user.totalAmountSaved ?? 0,
        progress: ids.size ? Math.round((complete.size / ids.size) * 100) : 0,
        savingsPercent: max ? Math.round(((user.totalAmountSaved ?? 0) / max) * 100) : 0,
      };
    });
  });
  readonly totalSaved = computed(() =>
    this.usersOnProgramsStore.users().reduce((total, user) => total + (user.totalAmountSaved ?? 0), 0),
  );
  readonly totalPaidOut = computed(() =>
    this.usersOnProgramsStore.users().reduce((total, user) => total + (user.totalAmountPaidOut ?? 0), 0),
  );
  readonly completion = computed(() =>
    this.people().length
      ? Math.round(this.people().reduce((total, person) => total + person.progress, 0) / this.people().length)
      : 0,
  );
  readonly initializationEffect = effect(() => {
    const id = this.id();
    untracked(() => {
      this.usersOnProgramsStore.setProgramId(id);
      this.usersOnProgramsStore.getUsers();
      this.requirementsStore.setProgramId(id);
      this.requirementsStore.getRequirements();
    });
  });
}
