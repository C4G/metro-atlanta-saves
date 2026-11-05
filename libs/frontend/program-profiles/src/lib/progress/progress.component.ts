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
import { NgTemplateOutlet } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { LoaderComponent, SectionPanelComponent, SpinnerComponent } from '@mas/frontend-shared-components';
import { MonthlyProgressStore, TrackerMonthState, UsersOnProgramsStore } from '@mas/frontend-shared-data-access';
import { MonthReceiptsComponent } from './month-receipts.component';

const PILL_BASE =
  'inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-bold';

export const MONTH_PILL_CLASSES: Record<TrackerMonthState, string> = {
  complete: `${PILL_BASE} border-transparent bg-brand-soft/80 text-brand-strong`,
  current: `${PILL_BASE} border-brand-strong bg-brand-strong text-brand-on`,
  attention: `${PILL_BASE} border-warn-ink/45 bg-warn-soft text-warn-ink`,
  upcoming: `${PILL_BASE} border-ink-muted/45 text-ink-muted`,
  past: `${PILL_BASE} border-ink-muted/45 text-ink-muted`,
};

export const MONTH_DOT_CLASSES: Record<TrackerMonthState, string> = {
  complete: 'bg-brand',
  current: 'bg-transparent ring-[1.5px] ring-inset ring-brand',
  attention: 'bg-warn-ink',
  upcoming: 'bg-ink/15',
  past: 'bg-ink/15',
};

const ARROW_CLASS =
  'flex min-h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand/25 bg-surface-raised/70 text-ink transition-colors hover:border-brand/70 hover:bg-surface-raised focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-default disabled:opacity-40 disabled:hover:border-brand/25 disabled:hover:bg-surface-raised/70';
const CONTROL_CLASS =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-brand/25 bg-surface-raised/70 px-3 text-xs font-bold text-ink transition-colors hover:border-brand/70 hover:bg-surface-raised focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-default disabled:opacity-45 disabled:hover:border-brand/25 disabled:hover:bg-surface-raised/70';
const CHIP_CLASS = 'border-brand/25 bg-surface-raised/70';
const CHIP_SELECTED_CLASS = 'border-brand bg-surface-raised ring-1 ring-inset ring-brand';
const BOX_CLASS = 'border-ink-muted/60';
const BOX_DONE_CLASS = 'border-brand bg-brand text-brand-on';
const FIELD_CLASS =
  'min-h-10 w-full rounded-xl border border-brand/25 bg-surface-raised/70 px-3 text-sm tabular-nums text-ink outline-none transition-colors placeholder:text-ink-subtle hover:border-brand/70 focus:border-brand/70 focus:bg-surface-raised focus-visible:ring-2 focus-visible:ring-brand disabled:border-dashed disabled:bg-transparent disabled:hover:border-brand/25';

@Component({
  selector: 'mas-progress',
  imports: [
    LoaderComponent,
    MatIcon,
    MonthReceiptsComponent,
    NgTemplateOutlet,
    ReactiveFormsModule,
    SectionPanelComponent,
    SpinnerComponent,
  ],
  providers: [MonthlyProgressStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (progressStore.loading()) {
      <mas-loader label="Loading your months" />
    } @else if (progressStore.loadFailed()) {
      <div class="rounded-2xl border border-outline/65 bg-surface/60 p-6" role="alert">
        <p class="text-sm text-ink-muted">We could not load your progress.</p>
        <button type="button" (click)="progressStore.load(id())" [class]="controlClass + ' mt-3'">Try again</button>
      </div>
    } @else if (progressStore.trackerMonths().length) {
      <div class="space-y-6 sm:space-y-8">
        <mas-section-panel heading="Monthly progress" headingId="months-heading">
          <div panelActions class="flex items-center gap-2">
            <button
              type="button"
              class="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-brand/40 px-2.5 text-xs font-bold text-brand-strong transition-colors hover:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-default disabled:opacity-45"
              [disabled]="progressStore.isCurrentMonth()"
              (click)="progressStore.showCurrentMonth()"
            >
              <mat-icon class="mas-icon-sm" aria-hidden="true">today</mat-icon>
              This month
            </button>
          </div>

          @if (progressStore.selectedMonth(); as month) {
            <div class="md:hidden">
              <div class="grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] gap-2 p-4">
                <button
                  type="button"
                  [class]="arrowClass + ' h-full'"
                  aria-label="Previous month"
                  [disabled]="progressStore.isFirstMonth()"
                  (click)="progressStore.stepMonth(-1)"
                >
                  <mat-icon class="mas-icon-md" aria-hidden="true">chevron_left</mat-icon>
                </button>
                <div
                  class="flex flex-col items-center gap-2 rounded-xl border border-brand bg-surface-raised px-2 py-3.5 ring-1 ring-inset ring-brand"
                  role="status"
                  aria-live="polite"
                  [attr.aria-label]="monthLabel(month)"
                >
                  <ng-container *ngTemplateOutlet="ring; context: { $implicit: month, size: 'h-14 w-14' }" />
                  <span class="text-base font-bold">{{ month.name }}</span>
                  <span [class]="pillClasses[month.state]">{{ month.stateLabel }}</span>
                </div>
                <button
                  type="button"
                  [class]="arrowClass + ' h-full'"
                  aria-label="Next month"
                  [disabled]="progressStore.isLastMonth()"
                  (click)="progressStore.stepMonth(1)"
                >
                  <mat-icon class="mas-icon-md" aria-hidden="true">chevron_right</mat-icon>
                </button>
              </div>
              <div role="group" aria-label="Jump to a month" class="-mt-1 flex justify-center gap-1 px-4 pb-4">
                @for (item of progressStore.trackerMonths(); track item.name) {
                  @let picked = item.number === month.number;
                  <button
                    type="button"
                    class="flex h-7 w-7 items-center justify-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    [attr.aria-label]="monthLabel(item)"
                    [attr.aria-current]="picked ? 'step' : null"
                    (click)="progressStore.selectMonth(item.number)"
                  >
                    <span
                      class="h-2 rounded-full transition-[width] motion-reduce:transition-none"
                      [class]="dotClasses[item.state]"
                      [class.w-2]="!picked"
                      [class.w-5]="picked"
                    ></span>
                  </button>
                }
              </div>
            </div>
          }

          <div class="hidden items-stretch gap-2 px-5 pb-5 pt-4 md:flex">
            <button
              type="button"
              [class]="arrowClass"
              aria-label="Previous month"
              [disabled]="progressStore.isFirstMonth()"
              (click)="progressStore.stepMonth(-1)"
            >
              <mat-icon class="mas-icon-md" aria-hidden="true">chevron_left</mat-icon>
            </button>
            <ol
              #monthStrip
              aria-label="Program months"
              class="flex min-w-0 flex-1 snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth [scrollbar-width:none] motion-reduce:scroll-auto [&::-webkit-scrollbar]:hidden"
            >
              @for (month of progressStore.trackerMonths(); track month.name) {
                @let selected = month.number === progressStore.selectedMonth()?.number;
                <li
                  class="shrink-0 basis-[calc((100%-1.5rem)/4)] snap-start lg:min-w-[calc((100%-3rem)/7)] lg:flex-1 lg:basis-[calc((100%-3rem)/7)]"
                >
                  <button
                    type="button"
                    class="flex h-full w-full flex-col items-center gap-2 rounded-xl border px-2 py-3.5 transition-colors hover:border-brand/70 hover:bg-surface-raised focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    [class]="selected ? chipSelectedClass : chipClass"
                    [attr.aria-current]="selected ? 'step' : null"
                    [attr.aria-label]="monthLabel(month)"
                    (click)="progressStore.selectMonth(month.number)"
                  >
                    <ng-container
                      *ngTemplateOutlet="ring; context: { $implicit: month, size: 'h-[3.25rem] w-[3.25rem]' }"
                    />
                    <span class="text-sm font-bold">{{ month.name }}</span>
                    <span [class]="pillClasses[month.state]">{{ month.stateLabel }}</span>
                  </button>
                </li>
              }
            </ol>
            <button
              type="button"
              [class]="arrowClass"
              aria-label="Next month"
              [disabled]="progressStore.isLastMonth()"
              (click)="progressStore.stepMonth(1)"
            >
              <mat-icon class="mas-icon-md" aria-hidden="true">chevron_right</mat-icon>
            </button>
          </div>
        </mas-section-panel>

        @if (progressStore.selectedMonth(); as month) {
          <mas-section-panel [heading]="month.name" [headingId]="'month-heading-' + month.number">
            <span panelActions [class]="pillClasses[month.state]">{{ month.stateLabel }}</span>
            <div class="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
              <div class="flex min-w-0 flex-col gap-3 p-4 sm:p-5">
                <h3 class="text-sm font-bold">Tasks</h3>
                @if (month.tasks.length) {
                  <ul class="flex flex-col gap-2">
                    @for (task of month.tasks; track task.requirementId) {
                      @let saving = usersOnProgramsStore.savingRequirementIds().includes(task.requirementId);
                      <li
                        class="flex flex-wrap items-start gap-x-3 gap-y-2 rounded-xl border border-brand/25 bg-surface-raised/70 p-3 transition-colors hover:border-brand/70 hover:bg-surface-raised has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand sm:flex-nowrap sm:px-3.5"
                      >
                        <label
                          [id]="task.requirementId"
                          class="flex min-w-0 flex-1 basis-full scroll-mt-28 items-start gap-3 sm:basis-auto"
                          [class.cursor-pointer]="!saving"
                          [class.cursor-wait]="saving"
                        >
                          <input
                            type="checkbox"
                            class="peer sr-only"
                            [checked]="task.isCompleted"
                            [disabled]="saving"
                            (change)="toggleTask($event, task.requirementId, task.isCompleted)"
                          />
                          <span
                            aria-hidden="true"
                            class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2"
                            [class]="task.isCompleted ? boxDoneClass : boxClass"
                          >
                            @if (saving) {
                              <span
                                class="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
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
                          <span class="min-w-0">
                            <span class="block text-sm font-bold leading-5">{{ task.requirementName }}</span>
                            @if (task.actionInstructions) {
                              <span class="mt-0.5 line-clamp-2 block text-xs text-ink-muted">
                                {{ task.actionInstructions }}
                              </span>
                            }
                          </span>
                        </label>
                        <span class="ml-8 flex shrink-0 items-center gap-2 sm:ml-0 sm:flex-col sm:items-end">
                          <span
                            class="whitespace-nowrap text-xs font-bold leading-5"
                            [class.text-brand-strong]="!task.isCompleted"
                            [class.text-ink-muted]="task.isCompleted"
                          >
                            {{
                              task.dueLabel
                                ? 'Due ' + task.dueLabel
                                : task.isActionRequirement
                                  ? 'Action task'
                                  : 'Program task'
                            }}
                          </span>
                          @if (task.completionLink) {
                            <a
                              [href]="task.completionLink"
                              target="_blank"
                              rel="noopener noreferrer"
                              class="inline-flex min-h-7 items-center gap-1 whitespace-nowrap rounded-lg border border-brand/40 px-2 text-xs font-bold text-brand-strong transition-colors hover:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                            >
                              Open content
                              <mat-icon class="mas-icon-sm" aria-hidden="true">open_in_new</mat-icon>
                            </a>
                          }
                        </span>
                      </li>
                    }
                  </ul>
                } @else {
                  <p
                    class="rounded-xl border border-dashed border-outline px-4 py-8 text-center text-sm text-ink-muted"
                  >
                    No tasks for {{ month.name }}
                  </p>
                }
              </div>

              <div class="flex min-w-0 flex-col gap-5 border-t border-outline/55 p-4 sm:p-5 lg:border-l lg:border-t-0">
                <section class="flex flex-col gap-3" [attr.aria-labelledby]="'update-heading-' + month.number">
                  <div class="flex items-baseline justify-between gap-3">
                    <h3 [id]="'update-heading-' + month.number" class="text-sm font-bold">Monthly update</h3>
                    @if (month.updatedLabel) {
                      <p class="text-xs text-ink-muted">{{ month.updatedLabel }}</p>
                    }
                  </div>
                  @if (month.verified) {
                    <p
                      class="flex items-start gap-2 rounded-xl border border-brand/40 bg-brand-soft/35 px-3 py-2.5 text-xs text-ink"
                    >
                      <mat-icon class="mas-icon-sm shrink-0 text-brand-strong" aria-hidden="true">verified</mat-icon>
                      Verified by your program team. Contact them if a correction is needed.
                    </p>
                  }
                  <form [formGroup]="progressForm" (ngSubmit)="saveProgress(month.name)">
                    <fieldset [disabled]="progressStore.saving() || month.verified" class="grid gap-3">
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
                              [class]="fieldClass + ' pl-6'"
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
                            [class]="fieldClass + ' mt-1.5'"
                          />
                        </div>
                      </div>
                      @if (showAmountError()) {
                        <p class="text-xs text-danger" role="alert">
                          Enter an amount of 0 or more, with no more than two decimal places.
                        </p>
                      }
                      @if (progressForm.controls.creditScore.touched && progressForm.controls.creditScore.invalid) {
                        <p class="text-xs text-danger" role="alert">
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
                          placeholder="A milestone, a challenge or anything your program team should know"
                          [class]="fieldClass + ' mt-1.5 resize-y py-2.5 leading-5'"
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
                        class="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-brand-strong bg-brand-strong px-5 text-sm font-bold text-brand-on transition-colors hover:border-brand hover:bg-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-wait disabled:opacity-60"
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

                <div class="h-px bg-outline/55" aria-hidden="true"></div>

                <mas-month-receipts
                  [programId]="id()"
                  [checkpointId]="month.checkpoint?.id || ''"
                  [monthName]="month.name"
                />
              </div>
            </div>
          </mas-section-panel>
        }
      </div>
    } @else {
      <div class="rounded-2xl border border-dashed border-outline bg-surface/60 px-6 py-12 text-center">
        <mat-icon class="text-brand-strong" aria-hidden="true">event_note</mat-icon>
        <h2 class="mt-3 text-lg font-bold">No months configured yet</h2>
        <p class="mt-1 text-sm text-ink-muted">Your program team will add your monthly plan here.</p>
      </div>
    }

    <ng-template #ring let-month let-size="size">
      <span class="relative flex shrink-0 items-center justify-center" [class]="size" aria-hidden="true">
        <svg viewBox="0 0 36 36" class="absolute inset-0 h-full w-full -rotate-90">
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
              [attr.stroke-dasharray]="month.ringDash"
            />
          }
        </svg>
        <span class="relative text-xs font-bold tabular-nums text-ink">
          {{ month.completeCount }}/{{ month.tasks.length }}
        </span>
      </span>
    </ng-template>
  `,
  host: { class: 'block', '(window:resize)': 'scrollToSelected()' },
})
export default class ProgressComponent {
  readonly id = input.required<string>();
  readonly progressStore = inject(MonthlyProgressStore);
  readonly usersOnProgramsStore = inject(UsersOnProgramsStore);
  readonly pillClasses = MONTH_PILL_CLASSES;
  readonly dotClasses = MONTH_DOT_CLASSES;
  readonly arrowClass = ARROW_CLASS;
  readonly controlClass = CONTROL_CLASS;
  readonly fieldClass = FIELD_CLASS;
  readonly chipClass = CHIP_CLASS;
  readonly chipSelectedClass = CHIP_SELECTED_CLASS;
  readonly boxClass = BOX_CLASS;
  readonly boxDoneClass = BOX_DONE_CLASS;
  private readonly fragment = toSignal(inject(ActivatedRoute).fragment);
  private readonly fb = inject(FormBuilder);
  readonly saveAttempted = signal(false);
  private readonly injector = inject(Injector);
  private readonly monthStrip = viewChild<ElementRef<HTMLElement>>('monthStrip');
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
  readonly stripEffect = effect(() => {
    this.monthStrip();
    this.progressStore.selectedMonth();
    afterNextRender(() => this.scrollToSelected(), { injector: this.injector });
  });
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

  scrollToSelected(): void {
    const strip = this.monthStrip()?.nativeElement;
    const card = strip?.querySelector('[aria-current="step"]')?.closest('li');
    if (!strip || !(card instanceof HTMLElement)) return;
    if (card.offsetLeft < strip.scrollLeft) strip.scrollLeft = card.offsetLeft;
    else if (card.offsetLeft + card.offsetWidth > strip.scrollLeft + strip.clientWidth)
      strip.scrollLeft = card.offsetLeft + card.offsetWidth - strip.clientWidth;
  }

  monthLabel(month: { name: string; completeCount: number; tasks: unknown[]; stateLabel: string }): string {
    return `${month.name}, ${month.completeCount} of ${month.tasks.length} tasks done, ${month.stateLabel}`;
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
