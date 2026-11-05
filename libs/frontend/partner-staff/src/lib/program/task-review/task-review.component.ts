import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { TaskReviewStore } from '@mas/frontend-shared-data-access';

import { SpinnerComponent } from '@mas/frontend-shared-components';

@Component({
  selector: 'mas-task-review',
  imports: [SpinnerComponent, DatePipe, MatIcon, RouterLink],
  providers: [TaskReviewStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-labelledby="task-review-heading" class="space-y-6">
      <header class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="task-review-heading" class="text-2xl font-semibold tracking-tight">Task review</h2>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">
            Participants report their progress. Your team verifies the work separately after reviewing it.
          </p>
        </div>
        <button
          type="button"
          (click)="store.load(id())"
          [disabled]="store.loading() || store.pending().length > 0"
          class="min-h-11 rounded-xl border border-outline px-4 text-sm font-semibold text-brand-strong hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
        >
          Refresh list
        </button>
      </header>
      @if (store.loading()) {
        <p role="status" class="text-sm text-ink-muted flex items-center gap-2">
          <mas-spinner class="text-brand" />
          <span class="sr-only">Loading tasks and participants</span>
        </p>
      } @else if (store.loadFailed()) {
        <div role="alert" class="rounded-2xl border border-outline bg-surface-raised p-6">
          <p class="text-sm text-danger">We could not load task reviews.</p>
          <button
            type="button"
            (click)="store.load(id())"
            class="mt-3 min-h-11 rounded-xl px-4 text-sm font-bold text-brand-strong underline focus:outline-none focus:ring-2 focus:ring-brand"
          >
            Try again
          </button>
        </div>
      } @else if (store.data()) {
        <div class="grid gap-3 sm:grid-cols-3" role="group" aria-label="Review status">
          @for (option of filters; track option.value) {
            @if (option.value !== 'all' && option.value !== 'unverified') {
              <button
                type="button"
                (click)="status.set(status() === option.value ? 'all' : option.value); page.set(0)"
                [attr.aria-pressed]="status() === option.value"
                [class.border-brand]="status() === option.value"
                [class.bg-brand-soft]="status() === option.value"
                class="min-h-24 rounded-2xl border border-outline bg-surface-raised p-5 text-left hover:border-brand/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
              >
                <span class="block text-sm font-medium text-ink-muted">{{ option.label }}</span>
                <span class="mt-2 block text-2xl font-semibold tabular-nums text-brand-strong">
                  {{ counts()[option.value] }}
                </span>
              </button>
            }
          }
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="text-sm font-semibold">
            Find a participant or task
            <input
              #search
              type="search"
              [value]="query()"
              (input)="query.set(search.value); page.set(0)"
              placeholder="Search name, email, or task"
              class="mt-2 min-h-11 w-full rounded-xl border border-outline bg-surface-raised px-3 text-ink focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </label>
          <label class="text-sm font-semibold">
            Task
            <select
              #task
              [value]="status() === 'unverified' ? 'unverified' : taskId()"
              (change)="
                taskId.set(task.value === 'unverified' ? '' : task.value);
                status.set(task.value === 'unverified' ? 'unverified' : 'all');
                page.set(0)
              "
              class="mt-2 min-h-11 w-full rounded-xl border border-outline bg-surface-raised px-3 text-ink focus:outline-none focus:ring-2 focus:ring-brand"
            >
              <option value="">All tasks</option>
              <option value="unverified">Unverified</option>
              @for (requirement of store.data()?.requirements; track requirement.id) {
                <option [value]="requirement.id">{{ requirement.name }}</option>
              }
            </select>
          </label>
        </div>
        <div class="flex flex-wrap gap-2" aria-label="Review status">
          @for (option of filters; track option.value) {
            @if (option.value === 'all') {
              <button
                type="button"
                (click)="status.set(option.value); page.set(0)"
                [attr.aria-pressed]="status() === option.value"
                [class.bg-brand-soft]="status() === option.value"
                [class.text-brand-strong]="status() === option.value"
                class="min-h-11 rounded-xl border border-outline px-4 text-sm font-semibold hover:bg-brand-soft/35 focus:outline-none focus:ring-2 focus:ring-brand"
              >
                {{ option.label }}
              </button>
            }
          }
        </div>
        @if (store.saveError()) {
          <p role="alert" class="text-sm leading-6 text-danger">{{ store.saveError() }}</p>
        }
        <div>
          <div class="grid gap-4 xl:grid-cols-2">
            @for (row of visibleRows(); track row.key) {
              <article
                class="grid min-w-0 grid-cols-1 gap-x-5 gap-y-5 rounded-2xl border border-outline bg-surface-raised p-5 transition-colors hover:border-brand/50 sm:grid-cols-2 sm:p-6"
                [attr.aria-label]="
                  row.participant.firstName + ' ' + row.participant.lastName + ': ' + row.requirement.name
                "
              >
                <div class="min-w-0">
                  <p class="mb-2 text-xs font-medium text-ink-subtle">Participant</p>
                  <a
                    [routerLink]="['/partner-staff/programs', id(), 'users', row.participant.id]"
                    class="rounded font-semibold text-brand-strong hover:underline focus:outline-none focus:ring-2 focus:ring-brand"
                  >
                    {{ row.participant.firstName }} {{ row.participant.lastName }}
                  </a>
                  <p class="mt-1 break-all text-xs text-ink-muted">{{ row.participant.email }}</p>
                </div>
                <div class="min-w-0">
                  <p class="mb-2 text-xs font-medium text-ink-subtle">Task</p>
                  <a
                    routerLink="../requirements"
                    [fragment]="row.requirement.id"
                    class="rounded text-sm font-semibold hover:text-brand-strong hover:underline focus:outline-none focus:ring-2 focus:ring-brand"
                  >
                    {{ row.requirement.name }}
                  </a>
                  @if (row.requirement.dueAt) {
                    <p class="mt-2 text-xs text-ink-muted">Due {{ row.requirement.dueAt | date: 'mediumDate' }}</p>
                  }
                </div>
                <div class="min-w-0 pt-2">
                  <p class="mb-2 text-xs font-medium text-ink-subtle">Participant report</p>
                  <span
                    class="inline-flex min-h-11 items-center gap-2 text-sm"
                    [class.text-brand-strong]="!!row.completion"
                    [class.text-ink-muted]="!row.completion"
                  >
                    <mat-icon aria-hidden="true">{{ row.completion ? 'task_alt' : 'radio_button_unchecked' }}</mat-icon>
                    {{ row.completion ? 'Reported done' : 'Not reported' }}
                  </span>
                  @if (row.completion) {
                    <div class="ml-3 border-l border-outline pl-5 text-xs leading-5 text-ink-muted">
                      <p>Reported by {{ row.participant.firstName }} {{ row.participant.lastName }}</p>
                      <time
                        [attr.datetime]="row.completion.completedAt | date: 'yyyy-MM-ddTHH:mm:ssZZZZZ'"
                        class="text-ink-subtle"
                      >
                        {{ row.completion.completedAt | date: 'MMM d, y' }} ·
                        {{ row.completion.completedAt | date: 'shortTime' }}
                      </time>
                    </div>
                  } @else if (row.legacyComplete) {
                    <p class="mt-2 text-xs leading-5 text-ink-muted">
                      Legacy program record. No participant submission.
                    </p>
                  }
                </div>
                <div class="min-w-0 pt-2">
                  <p class="mb-2 text-xs font-medium text-ink-subtle">Staff verification</p>
                  <label class="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm">
                    <input
                      #verification
                      type="checkbox"
                      [checked]="!!row.completion?.verifiedAt"
                      [disabled]="!row.completion || store.pending().includes(row.key)"
                      (change)="toggle(row, verification)"
                      [attr.aria-label]="
                        'Verify ' +
                        row.requirement.name +
                        ' for ' +
                        row.participant.firstName +
                        ' ' +
                        row.participant.lastName
                      "
                      class="peer sr-only"
                    />
                    @if (store.pending().includes(row.key)) {
                      <span role="status" class="inline-flex h-6 w-6 items-center justify-center text-brand-strong">
                        <span
                          aria-hidden="true"
                          class="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"
                        ></span>
                        <span class="sr-only">Updating task verification</span>
                      </span>
                    } @else {
                      <mat-icon
                        aria-hidden="true"
                        class="rounded-full peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-brand peer-disabled:opacity-40"
                        [class.text-brand-strong]="!!row.completion?.verifiedAt"
                        [class.text-ink-muted]="!row.completion?.verifiedAt"
                      >
                        {{ row.completion?.verifiedAt ? 'task_alt' : 'radio_button_unchecked' }}
                      </mat-icon>
                    }
                    <span
                      class="peer-disabled:text-ink-subtle"
                      [class.text-brand-strong]="!!row.completion?.verifiedAt"
                    >
                      {{ row.completion?.verifiedAt ? 'Verified' : 'Verify work' }}
                    </span>
                  </label>
                  @if (row.completion?.verifiedAt) {
                    <div class="ml-3 border-l border-outline pl-5 text-xs leading-5 text-ink-muted">
                      <p>
                        Verified by
                        {{
                          row.completion?.verifiedBy
                            ? row.completion?.verifiedBy?.firstName + ' ' + row.completion?.verifiedBy?.lastName
                            : 'Former team member'
                        }}
                      </p>
                      <time
                        [attr.datetime]="row.completion?.verifiedAt | date: 'yyyy-MM-ddTHH:mm:ssZZZZZ'"
                        class="text-ink-subtle"
                      >
                        {{ row.completion?.verifiedAt | date: 'MMM d, y' }} ·
                        {{ row.completion?.verifiedAt | date: 'shortTime' }}
                      </time>
                    </div>
                  } @else if (!row.completion) {
                    <p class="text-xs leading-5 text-ink-muted">Waiting for the participant to report completion.</p>
                  }
                </div>
              </article>
            } @empty {
              <p
                class="rounded-2xl border border-dashed border-outline px-6 py-10 text-center text-sm text-ink-muted xl:col-span-2"
              >
                {{
                  rows().length
                    ? 'No tasks match these filters.'
                    : 'Tasks will appear here once this program has participants and requirements.'
                }}
              </p>
            }
          </div>
          <footer class="mt-4 flex flex-wrap items-center justify-between gap-3 px-1 py-4">
            <p class="text-xs text-ink-muted">
              Showing {{ filteredRows().length ? currentPage() * 25 + 1 : 0 }}–{{ rangeEnd() }} of
              {{ filteredRows().length }}
            </p>
            <div class="flex gap-2">
              <button
                type="button"
                [disabled]="currentPage() === 0"
                (click)="page.set(currentPage() - 1)"
                class="min-h-11 rounded-xl border border-outline px-4 text-sm font-semibold text-brand-strong hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                [disabled]="rangeEnd() >= filteredRows().length"
                (click)="page.set(currentPage() + 1)"
                class="min-h-11 rounded-xl border border-outline px-4 text-sm font-semibold text-brand-strong hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </footer>
        </div>
        <p class="text-xs leading-5 text-ink-muted">
          Verification applies to the current submission. If a participant unchecks and resubmits a task, it must be
          reviewed again. Legacy program records are not treated as participant reports.
        </p>
      }
    </section>
  `,
  host: { class: 'block' },
})
export default class TaskReviewComponent {
  readonly id = input.required<string>();
  readonly store = inject(TaskReviewStore);
  readonly query = signal('');
  readonly taskId = signal('');
  readonly status = signal<'all' | 'pending' | 'verified' | 'missing' | 'unverified'>('all');
  readonly page = signal(0);
  readonly filters = [
    { value: 'all' as const, label: 'All' },
    { value: 'unverified' as const, label: 'Unverified' },
    { value: 'pending' as const, label: 'Awaiting review' },
    { value: 'verified' as const, label: 'Verified' },
    { value: 'missing' as const, label: 'Not reported' },
  ];
  readonly rows = computed(() => {
    const data = this.store.data();
    if (!data) return [];
    return data.participants.flatMap((participant) => {
      const completions = new Map(participant.completions.map((completion) => [completion.requirementId, completion]));
      return data.requirements.map((requirement) => ({
        key: `${participant.id}:${requirement.id}`,
        participant,
        requirement,
        completion: completions.get(requirement.id),
        legacyComplete: participant.requirementStatus.includes(requirement.id),
      }));
    });
  });
  readonly counts = computed(() =>
    this.rows().reduce(
      (counts, row) => {
        if (row.completion?.verifiedAt) counts.verified++;
        else if (row.completion) counts.pending++;
        else counts.missing++;
        return counts;
      },
      { pending: 0, verified: 0, missing: 0 },
    ),
  );
  readonly filteredRows = computed(() => {
    const term = this.query().trim().toLowerCase();
    const taskId = this.taskId();
    const status = this.status();
    return this.rows().filter(
      (row) =>
        (!taskId || row.requirement.id === taskId) &&
        (!term ||
          `${row.participant.firstName} ${row.participant.lastName} ${row.participant.email} ${row.requirement.name}`
            .toLowerCase()
            .includes(term)) &&
        (status === 'all' ||
          (status === 'unverified' && !row.completion?.verifiedAt) ||
          (status === 'pending' && !!row.completion && !row.completion.verifiedAt) ||
          (status === 'verified' && !!row.completion?.verifiedAt) ||
          (status === 'missing' && !row.completion)),
    );
  });
  readonly currentPage = computed(() =>
    Math.min(this.page(), Math.max(0, Math.ceil(this.filteredRows().length / 25) - 1)),
  );
  readonly visibleRows = computed(() =>
    this.filteredRows().slice(this.currentPage() * 25, this.currentPage() * 25 + 25),
  );
  readonly rangeEnd = computed(() => Math.min(this.filteredRows().length, (this.currentPage() + 1) * 25));
  readonly programEffect = effect(() => {
    const id = this.id();
    untracked(() => {
      this.query.set('');
      this.taskId.set('');
      this.page.set(0);
      this.store.load(id);
    });
  });
  toggle(row: ReturnType<TaskReviewComponent['rows']>[number], checkbox: HTMLInputElement): void {
    checkbox.checked = !!row.completion?.verifiedAt;
    if (!row.completion) return;
    this.store.verify({
      userId: row.participant.id,
      requirementId: row.requirement.id,
      completedAt: new Date(row.completion.completedAt).toISOString(),
      verified: !row.completion.verifiedAt,
    });
  }
}
