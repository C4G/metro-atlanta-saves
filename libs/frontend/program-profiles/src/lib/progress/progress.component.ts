import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { LoaderComponent, SpinnerComponent } from '@mas/frontend-shared-components';
import { ActivatedRoute } from '@angular/router';
import { MonthlyProgressStore, UsersOnProgramsStore } from '@mas/frontend-shared-data-access';
import { MonthReceiptsComponent } from './month-receipts.component';

@Component({
  selector: 'mas-progress',
  imports: [SpinnerComponent, LoaderComponent, NgTemplateOutlet, MatIcon, ReactiveFormsModule, MonthReceiptsComponent],
  providers: [MonthlyProgressStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="py-6 sm:py-8" aria-labelledby="progress-heading">
      <header>
        <p class="text-xs font-bold uppercase tracking-[0.16em] text-brand-strong">One month at a time</p>
        <h2 id="progress-heading" class="mt-1 text-2xl font-black tracking-tight">My progress</h2>
        <p class="mt-2 max-w-xl text-sm leading-6 text-ink-muted">
          Pick a month to check off your tasks, record your savings and add your receipts.
        </p>
      </header>

      @if (progressStore.loading()) {
        <mas-loader class="mt-6" label="Loading your months" />
      } @else if (progressStore.loadFailed()) {
        <div class="mt-6 rounded-2xl border border-outline bg-surface-raised p-6" role="alert">
          <p class="text-sm text-ink-muted">We could not load your progress.</p>
          <button
            type="button"
            (click)="progressStore.load(id())"
            class="mt-3 min-h-11 rounded-xl border border-outline px-4 text-sm font-bold text-brand-strong focus:outline-none focus:ring-2 focus:ring-brand"
          >
            Try again
          </button>
        </div>
      } @else if (progressStore.trackerMonths().length) {
        <nav aria-label="Program months" class="mt-6 flex items-stretch gap-2 sm:gap-3">
          <button
            type="button"
            (click)="scrollMonths(-1)"
            [disabled]="!canScrollBack()"
            aria-label="Show earlier months"
            class="flex w-10 shrink-0 items-center justify-center rounded-2xl border border-outline bg-surface-raised text-ink hover:border-brand/60 hover:bg-brand-soft/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-40 disabled:hover:border-outline disabled:hover:bg-surface-raised"
          >
            <mat-icon aria-hidden="true">chevron_left</mat-icon>
          </button>
          <ol
            #monthStrip
            (scroll)="updateScrollState()"
            class="relative flex min-w-0 flex-1 snap-x gap-3 overflow-x-auto scroll-smooth [scrollbar-width:none] motion-reduce:scroll-auto [&::-webkit-scrollbar]:hidden"
          >
            @for (month of progressStore.trackerMonths(); track month.name) {
              @let selected = month.number === progressStore.selectedMonth()?.number;
              <li class="min-w-[8.5rem] flex-1 snap-start">
                <button
                  type="button"
                  (click)="progressStore.selectMonth(month.number)"
                  [attr.aria-current]="selected ? 'step' : null"
                  [attr.aria-label]="
                    month.name +
                    ', ' +
                    month.completeCount +
                    ' of ' +
                    month.tasks.length +
                    ' tasks done, ' +
                    month.stateLabel
                  "
                  class="flex w-full flex-col items-center gap-2.5 rounded-2xl border px-3 py-4 transition-colors hover:border-brand/60 hover:bg-brand-soft/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                  [class.border-brand]="selected"
                  [class.bg-brand-soft]="selected"
                  [class.border-outline]="!selected"
                  [class.bg-surface-raised]="!selected"
                >
                  <svg viewBox="0 0 36 36" class="h-16 w-16" aria-hidden="true">
                    <circle cx="18" cy="18" r="15" fill="none" stroke-width="3.5" class="stroke-ink/10" />
                    @if (month.percentComplete > 0) {
                      <circle
                        cx="18"
                        cy="18"
                        r="15"
                        fill="none"
                        stroke-width="3.5"
                        stroke-linecap="round"
                        class="stroke-brand"
                        transform="rotate(-90 18 18)"
                        [attr.stroke-dasharray]="month.ringDash"
                      />
                    }
                    <text x="18" y="21.5" text-anchor="middle" class="fill-ink text-[0.625rem] font-bold">
                      {{ month.completeCount }}/{{ month.tasks.length }}
                    </text>
                  </svg>
                  <span class="text-sm font-bold">{{ month.name }}</span>
                  <span
                    class="rounded-full px-2.5 py-0.5 text-[0.6875rem] font-bold"
                    [class.bg-brand-soft]="month.state === 'complete'"
                    [class.text-brand-strong]="month.state === 'complete'"
                    [class.border]="month.state === 'complete'"
                    [class.border-brand]="month.state === 'complete'"
                    [class.bg-brand-strong]="month.state === 'current'"
                    [class.text-brand-on]="month.state === 'current'"
                    [class.bg-warn-soft]="month.state === 'attention'"
                    [class.text-warn-ink]="month.state === 'attention'"
                    [class.bg-surface-subtle]="month.state === 'upcoming' || month.state === 'past'"
                    [class.text-ink-muted]="month.state === 'upcoming' || month.state === 'past'"
                  >
                    {{ month.stateLabel }}
                  </span>
                </button>
              </li>
            }
          </ol>
          <button
            type="button"
            (click)="scrollMonths(1)"
            [disabled]="!canScrollForward()"
            aria-label="Show later months"
            class="flex w-10 shrink-0 items-center justify-center rounded-2xl border border-outline bg-surface-raised text-ink hover:border-brand/60 hover:bg-brand-soft/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-40 disabled:hover:border-outline disabled:hover:bg-surface-raised"
          >
            <mat-icon aria-hidden="true">chevron_right</mat-icon>
          </button>
        </nav>

        @if (progressStore.selectedMonth(); as month) {
          <section
            class="mt-5 rounded-3xl border border-outline bg-surface-raised"
            [attr.aria-labelledby]="'month-heading-' + month.number"
          >
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-outline px-5 py-5 sm:px-6">
              <div>
                <p class="text-xs font-bold uppercase tracking-[0.16em] text-brand-strong">
                  {{ month.stateLabel }}
                </p>
                <h3 [id]="'month-heading-' + month.number" class="mt-1 text-2xl font-bold tracking-tight">
                  {{ month.name }}
                </h3>
              </div>
              <div role="group" aria-label="Change month" class="flex gap-2">
                <button
                  type="button"
                  (click)="progressStore.stepMonth(-1)"
                  [disabled]="progressStore.isFirstMonth()"
                  aria-label="Previous month"
                  class="flex h-11 w-11 items-center justify-center rounded-xl border border-outline bg-surface text-ink hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-40 disabled:hover:bg-surface"
                >
                  <mat-icon aria-hidden="true">chevron_left</mat-icon>
                </button>
                <button
                  type="button"
                  (click)="progressStore.showCurrentMonth()"
                  [disabled]="progressStore.isCurrentMonth()"
                  class="inline-flex min-h-11 items-center gap-2 rounded-xl border border-outline bg-surface px-4 text-sm font-bold text-brand-strong hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand disabled:text-ink-muted disabled:opacity-60 disabled:hover:bg-surface"
                >
                  <mat-icon aria-hidden="true" class="!h-5 !w-5 shrink-0 !text-xl !leading-none">today</mat-icon>
                  Current month
                </button>
                <button
                  type="button"
                  (click)="progressStore.stepMonth(1)"
                  [disabled]="progressStore.isLastMonth()"
                  aria-label="Next month"
                  class="flex h-11 w-11 items-center justify-center rounded-xl border border-outline bg-surface text-ink hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-40 disabled:hover:bg-surface"
                >
                  <mat-icon aria-hidden="true">chevron_right</mat-icon>
                </button>
              </div>
            </div>

            <div class="flex flex-wrap gap-6 p-5 sm:p-6">
              <div class="min-w-0 flex-[1_1_26rem]">
                <h4 class="sr-only">Tasks for {{ month.name }}</h4>
                @if (month.tasks.length) {
                  <ul class="grid gap-3 sm:grid-cols-2">
                    @for (task of month.tasks; track task.requirementId) {
                      <li>
                        <ng-container *ngTemplateOutlet="taskCard; context: { $implicit: task }" />
                      </li>
                    }
                  </ul>
                } @else {
                  <div class="rounded-2xl border border-dashed border-outline px-6 py-10 text-center">
                    <mat-icon class="text-brand-strong" aria-hidden="true">task_alt</mat-icon>
                    <p class="mt-2 text-sm text-ink-muted">No tasks for {{ month.name }}.</p>
                  </div>
                }
              </div>

              <div class="flex min-w-0 flex-[1_1_20rem] flex-col gap-4">
                <section
                  class="rounded-2xl border border-outline bg-surface p-5"
                  [attr.aria-labelledby]="'update-heading-' + month.number"
                >
                  <div class="flex items-start justify-between gap-3">
                    <h4 [id]="'update-heading-' + month.number" class="text-base font-bold">Your monthly update</h4>
                    @if (month.updatedLabel) {
                      <p class="text-xs text-ink-subtle">{{ month.updatedLabel }}</p>
                    }
                  </div>
                  @if (month.verified) {
                    <p class="mt-2 text-xs leading-5 text-ink-muted">
                      Verified by your program team. Contact them if a correction is needed.
                    </p>
                  }
                  <form [formGroup]="progressForm" (ngSubmit)="saveProgress(month.name)" class="mt-4">
                    <fieldset [disabled]="progressStore.saving() || month.verified" class="grid gap-4">
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <label [for]="'saved-' + month.number" class="block text-xs font-bold text-ink-muted">
                            Amount saved
                          </label>
                          <div class="relative mt-1.5">
                            <span
                              aria-hidden="true"
                              class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-subtle"
                            >
                              $
                            </span>
                            <input
                              [id]="'saved-' + month.number"
                              formControlName="savedMoney"
                              type="number"
                              inputmode="decimal"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              [attr.aria-invalid]="showAmountError()"
                              [attr.aria-describedby]="'saved-help-' + month.number"
                              class="min-h-11 w-full rounded-xl border border-outline bg-surface-raised py-2 pl-7 pr-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/25 disabled:opacity-70"
                            />
                          </div>
                        </div>
                        <div>
                          <label [for]="'credit-' + month.number" class="block text-xs font-bold text-ink-muted">
                            Credit score
                            <span class="font-normal">(optional)</span>
                          </label>
                          <input
                            [id]="'credit-' + month.number"
                            formControlName="creditScore"
                            type="number"
                            inputmode="numeric"
                            min="0"
                            step="1"
                            placeholder="Optional"
                            class="mt-1.5 min-h-11 w-full rounded-xl border border-outline bg-surface-raised px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/25 disabled:opacity-70"
                          />
                        </div>
                      </div>
                      <p [id]="'saved-help-' + month.number" class="-mt-2 text-xs text-ink-muted">
                        Enter what you saved during this month, not your running total.
                      </p>
                      @if (showAmountError()) {
                        <p class="-mt-2 text-xs text-danger" role="alert">
                          Enter an amount of 0 or more, with no more than two decimal places.
                        </p>
                      }
                      @if (progressForm.controls.creditScore.touched && progressForm.controls.creditScore.invalid) {
                        <p class="-mt-2 text-xs text-danger" role="alert">
                          Enter a whole number of 0 or more, or leave the credit score blank.
                        </p>
                      }
                      <div>
                        <label [for]="'notes-' + month.number" class="block text-xs font-bold text-ink-muted">
                          Notes
                          <span class="font-normal">(optional)</span>
                        </label>
                        <textarea
                          [id]="'notes-' + month.number"
                          formControlName="application"
                          rows="2"
                          maxlength="2000"
                          placeholder="Share a milestone, a challenge, or anything your program team should know."
                          class="mt-1.5 w-full resize-y rounded-xl border border-outline bg-surface-raised px-3 py-2.5 text-sm leading-6 text-ink outline-none placeholder:text-ink-subtle focus:border-brand focus:ring-2 focus:ring-brand/25 disabled:opacity-70"
                        ></textarea>
                      </div>
                    </fieldset>
                    @if (progressStore.saveError()) {
                      <p class="mt-3 text-sm text-danger" role="alert">{{ progressStore.saveError() }}</p>
                    }
                    @if (!month.verified) {
                      <button
                        type="submit"
                        [disabled]="progressStore.saving()"
                        class="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-strong px-5 text-sm font-bold text-brand-on hover:bg-brand focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-surface disabled:cursor-wait disabled:opacity-60"
                      >
                        <span class="relative inline-flex items-center justify-center">
                          <span [class.invisible]="progressStore.saving()">Save update</span>
                          @if (progressStore.saving()) {
                            <mas-spinner class="absolute" />
                            <span class="sr-only">Save update</span>
                          }
                        </span>
                      </button>
                    }
                  </form>
                </section>

                <section
                  class="rounded-2xl border border-outline bg-surface px-5 pb-5 [&_section]:mt-0 [&_section]:border-t-0"
                >
                  <mas-month-receipts
                    [programId]="id()"
                    [checkpointId]="month.checkpoint?.id || ''"
                    [monthName]="month.name"
                  />
                </section>
              </div>
            </div>
          </section>
        }
      } @else {
        <div class="mt-6 rounded-2xl border border-dashed border-outline bg-surface-raised px-6 py-12 text-center">
          <mat-icon class="text-brand-strong" aria-hidden="true">event_note</mat-icon>
          <h3 class="mt-3 text-lg font-bold">No months configured yet</h3>
          <p class="mt-1 text-sm text-ink-muted">Your program team will add your monthly plan here.</p>
        </div>
      }
    </section>

    <ng-template #taskCard let-task>
      @let saving = usersOnProgramsStore.savingRequirementIds().includes(task.requirementId);
      <label
        [id]="task.requirementId"
        class="flex h-full min-h-32 scroll-mt-28 cursor-pointer flex-col gap-3 rounded-2xl border p-4 transition-colors hover:border-brand/60 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-surface-raised"
        [class.border-brand]="task.isCompleted"
        [class.bg-brand-soft]="task.isCompleted"
        [class.border-outline]="!task.isCompleted"
        [class.bg-surface]="!task.isCompleted"
        [class.cursor-wait]="saving"
      >
        <input
          type="checkbox"
          class="peer sr-only"
          [checked]="task.isCompleted"
          [disabled]="saving"
          (change)="toggleTask($event, task.requirementId, task.isCompleted)"
        />
        <span class="flex items-start justify-between gap-3">
          <span class="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-ink-subtle">
            {{ task.dueLabel ? 'Due ' + task.dueLabel : task.isActionRequirement ? 'Action task' : 'Program task' }}
          </span>
          <span
            aria-hidden="true"
            class="flex h-[1.625rem] w-[1.625rem] shrink-0 items-center justify-center rounded-lg border-2"
            [class.border-brand-strong]="task.isCompleted"
            [class.bg-brand-strong]="task.isCompleted"
            [class.text-brand-on]="task.isCompleted"
            [class.border-brand]="!task.isCompleted"
            [class.bg-surface-raised]="!task.isCompleted"
          >
            @if (saving) {
              <span
                class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
              ></span>
            } @else if (task.isCompleted) {
              <svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3.25 8.25 6.5 11.5l6.25-7"
                  stroke="currentColor"
                  stroke-width="2.25"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            }
          </span>
        </span>
        <span class="text-base font-bold leading-snug">{{ task.requirementName }}</span>
        @if (task.actionInstructions) {
          <span class="line-clamp-3 text-xs leading-5 text-ink-muted">{{ task.actionInstructions }}</span>
        }
        <span class="mt-auto flex items-center justify-between gap-2">
          <span
            class="text-xs font-bold"
            [class.text-brand-strong]="task.isCompleted"
            [class.text-ink-muted]="!task.isCompleted"
          >
            {{ task.isCompleted ? 'Done · select to undo' : 'Select to mark done' }}
          </span>
          @if (task.completionLink) {
            <a
              [href]="task.completionLink"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex min-h-9 items-center rounded-lg border border-outline bg-surface-raised px-3 text-xs font-semibold text-brand-strong hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand"
            >
              Open content
            </a>
          }
        </span>
      </label>
    </ng-template>
  `,
  host: { class: 'block', '(window:resize)': 'updateScrollState()' },
})
export default class ProgressComponent {
  readonly id = input.required<string>();
  readonly progressStore = inject(MonthlyProgressStore);
  readonly usersOnProgramsStore = inject(UsersOnProgramsStore);
  private readonly fragment = toSignal(inject(ActivatedRoute).fragment);
  private readonly fb = inject(FormBuilder);
  readonly saveAttempted = signal(false);
  private readonly injector = inject(Injector);
  private readonly monthStrip = viewChild<ElementRef<HTMLElement>>('monthStrip');
  readonly canScrollBack = signal(false);
  readonly canScrollForward = signal(false);
  readonly progressForm = this.fb.group({
    savedMoney: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0),
      Validators.pattern(/^\d+(\.\d{1,2})?$/),
    ]),
    creditScore: this.fb.control<number | null>(null, [Validators.min(0), Validators.pattern(/^\d+$/)]),
    application: this.fb.nonNullable.control('', Validators.maxLength(2000)),
  });
  private readonly amountState = toSignal(this.progressForm.controls.savedMoney.statusChanges, {
    initialValue: 'VALID',
  });
  readonly showAmountError = computed(() => {
    this.amountState();
    const control = this.progressForm.controls.savedMoney;
    return this.saveAttempted() && control.invalid;
  });

  readonly loadEffect = effect(() => {
    const id = this.id();
    untracked(() => this.progressStore.load(id));
  });
  // Links from the dashboard calendar point at a task; open the month that holds it once, so ticking
  // tasks afterwards (which recalculates the months) does not pull the participant back to that month.
  private openedFragment: string | null = null;
  readonly fragmentEffect = effect(() => {
    const fragment = this.fragment() ?? null;
    if (!fragment || fragment === this.openedFragment) return;
    const month = this.progressStore
      .trackerMonths()
      .find((item) => item.tasks.some((task) => task.requirementId === fragment));
    if (!month) return;
    this.openedFragment = fragment;
    untracked(() => this.progressStore.selectMonth(month.number));
  });
  // Keep the chosen month's card in view and the strip arrows in step with what can still scroll.
  readonly stripEffect = effect(() => {
    const strip = this.monthStrip()?.nativeElement;
    this.progressStore.selectedMonth();
    if (!strip) return;
    afterNextRender(
      () => {
        // Scroll only the strip sideways, never the page.
        const card = strip.querySelector('[aria-current="step"]')?.closest('li');
        if (card instanceof HTMLElement) {
          if (card.offsetLeft < strip.scrollLeft) strip.scrollLeft = card.offsetLeft;
          else if (card.offsetLeft + card.offsetWidth > strip.scrollLeft + strip.clientWidth)
            strip.scrollLeft = card.offsetLeft + card.offsetWidth - strip.clientWidth;
        }
        this.updateScrollState();
      },
      { injector: this.injector },
    );
  });
  // Keyed on the saved entry so that ticking a task does not wipe what the participant is typing.
  private readonly formSource = computed(
    () => {
      const month = this.progressStore.selectedMonth();
      return month ? { name: month.name, checkpoint: month.checkpoint } : null;
    },
    {
      equal: (a, b) =>
        a?.name === b?.name &&
        a?.checkpoint?.id === b?.checkpoint?.id &&
        a?.checkpoint?.updatedAt === b?.checkpoint?.updatedAt,
    },
  );
  readonly formEffect = effect(() => {
    const checkpoint = this.formSource()?.checkpoint;
    untracked(() => {
      this.saveAttempted.set(false);
      this.progressForm.reset({
        savedMoney: checkpoint?.savedMoney ?? null,
        creditScore: checkpoint?.creditScore ?? null,
        application: checkpoint?.application ?? '',
      });
    });
  });

  updateScrollState(): void {
    const strip = this.monthStrip()?.nativeElement;
    if (!strip) return;
    this.canScrollBack.set(strip.scrollLeft > 4);
    this.canScrollForward.set(strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 4);
  }

  scrollMonths(direction: number): void {
    const strip = this.monthStrip()?.nativeElement;
    if (strip) strip.scrollLeft += direction * strip.clientWidth * 0.8;
  }

  toggleTask(event: Event, requirementId: string, isCompleted: boolean): void {
    if (event.target instanceof HTMLInputElement) event.target.checked = isCompleted;
    this.usersOnProgramsStore.setRequirementCompletion({ requirementId, isCompleted: !isCompleted });
  }

  saveProgress(name: string): void {
    if (this.progressStore.saving()) return;
    this.saveAttempted.set(true);
    if (this.progressForm.invalid) {
      this.progressForm.markAllAsTouched();
      return;
    }
    const values = this.progressForm.getRawValue();
    if (values.savedMoney === null) return;
    this.progressStore.save({
      name,
      savedMoney: values.savedMoney,
      creditScore: values.creditScore,
      application: values.application,
      onSaved: () => this.usersOnProgramsStore.getUserOnProgram(),
    });
  }
}
