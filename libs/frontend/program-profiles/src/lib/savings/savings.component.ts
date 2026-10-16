import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { MonthlyProgressStore, UsersOnProgramsStore } from '@mas/frontend-shared-data-access';

@Component({
  selector: 'mas-savings',
  imports: [CurrencyPipe, DatePipe, MatIcon, ReactiveFormsModule, RouterLink],
  providers: [MonthlyProgressStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="py-6 sm:py-8" aria-labelledby="history-heading">
      <header class="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.16em] text-brand-strong">One month at a time</p>
          <h2 id="history-heading" class="mt-1 text-2xl font-black tracking-tight">My progress</h2>
          <p class="mt-2 max-w-xl text-sm leading-6 text-ink-muted">
            Choose a month to record your savings and track how things are changing.
          </p>
        </div>
        <div class="w-fit shrink-0 rounded-2xl border border-outline bg-surface-raised px-5 py-4">
          <p class="text-xs font-bold text-ink-subtle">Credit score change</p>
          <p class="mt-1 text-2xl font-black text-brand-strong">
            {{ usersOnProgramsStore.userCreditIncrease() > 0 ? '+' : ''
            }}{{ usersOnProgramsStore.userCreditIncrease() }}
            <span class="ml-1.5 text-xs font-semibold text-ink-subtle">points</span>
          </p>
        </div>
      </header>

      @if (editingName(); as name) {
        <section
          class="mt-6 rounded-2xl border border-brand bg-surface-raised p-5 sm:p-6"
          aria-labelledby="month-editor-heading"
        >
          <div class="mb-5">
            <p class="text-xs font-bold uppercase tracking-wider text-brand-strong">Your monthly update</p>
            <h3 id="month-editor-heading" class="mt-1 text-xl font-bold">{{ name }} progress</h3>
            <p class="mt-2 text-sm text-ink-muted">Enter the amount saved during this month—not your running total.</p>
          </div>
          <form [formGroup]="progressForm" (ngSubmit)="saveProgress()">
            <fieldset [disabled]="progressStore.saving()" class="grid min-w-0 gap-5 sm:grid-cols-2">
              <div>
                <label for="monthly-savings" class="block text-sm font-bold">
                  Amount saved this month
                  <span class="font-normal text-ink-subtle">(required)</span>
                </label>
                <div class="relative mt-2">
                  <span class="pointer-events-none absolute left-3.5 top-3 text-sm text-ink-subtle" aria-hidden="true">
                    $
                  </span>
                  <input
                    #savedAmount
                    id="monthly-savings"
                    formControlName="savedMoney"
                    type="number"
                    inputmode="decimal"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    [attr.aria-invalid]="
                      progressForm.controls.savedMoney.touched && progressForm.controls.savedMoney.invalid
                    "
                    aria-describedby="monthly-savings-help"
                    class="min-h-11 w-full rounded-xl border border-outline bg-surface py-2.5 pl-8 pr-3.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/25"
                  />
                </div>
                <p id="monthly-savings-help" class="mt-2 text-xs text-ink-muted">
                  Zero is a valid update. Every month counts.
                </p>
                @if (progressForm.controls.savedMoney.touched && progressForm.controls.savedMoney.invalid) {
                  <p class="mt-2 text-xs text-danger" role="alert">
                    Enter an amount of 0 or more, with no more than two decimal places.
                  </p>
                }
              </div>
              <div>
                <label for="monthly-credit-score" class="block text-sm font-bold">
                  Credit score
                  <span class="font-normal text-ink-subtle">(optional)</span>
                </label>
                <input
                  id="monthly-credit-score"
                  formControlName="creditScore"
                  type="number"
                  inputmode="numeric"
                  min="0"
                  step="1"
                  placeholder="Enter your score"
                  class="mt-2 min-h-11 w-full rounded-xl border border-outline bg-surface px-3.5 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/25"
                />
                @if (progressForm.controls.creditScore.touched && progressForm.controls.creditScore.invalid) {
                  <p class="mt-2 text-xs text-danger" role="alert">
                    Enter a whole number of 0 or more, or leave this blank.
                  </p>
                }
              </div>
              <div class="sm:col-span-2">
                <label for="monthly-notes" class="block text-sm font-bold">
                  Notes
                  <span class="font-normal text-ink-subtle">(optional)</span>
                </label>
                <textarea
                  id="monthly-notes"
                  formControlName="application"
                  rows="3"
                  maxlength="2000"
                  placeholder="Share a milestone, a challenge, or anything you would like your program team to know."
                  class="mt-2 w-full resize-y rounded-xl border border-outline bg-surface px-3.5 py-3 text-sm leading-6 text-ink outline-none placeholder:text-ink-subtle focus:border-brand focus:ring-2 focus:ring-brand/25"
                ></textarea>
              </div>
            </fieldset>
            @if (progressStore.saveError()) {
              <p class="mt-4 text-sm text-danger" role="alert">{{ progressStore.saveError() }}</p>
            }
            <div class="mt-5 flex flex-wrap justify-end gap-2 border-t border-outline pt-5">
              <button
                type="button"
                [disabled]="progressStore.saving()"
                (click)="editingName.set(null)"
                class="inline-flex min-h-11 items-center justify-center rounded-xl border border-outline bg-surface px-5 text-sm font-bold text-ink transition-colors hover:bg-surface-subtle focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="progressStore.saving()"
                class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-strong px-5 text-sm font-bold text-brand-on transition-colors hover:bg-brand focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-wait disabled:opacity-60"
              >
                @if (progressStore.saving()) {
                  <span
                    class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                    aria-hidden="true"
                  ></span>
                }
                {{ progressStore.saving() ? 'Saving…' : 'Save progress' }}
              </button>
            </div>
          </form>
        </section>
      }

      @if (progressStore.loading()) {
        <p class="mt-6 rounded-2xl border border-outline bg-surface-raised p-8 text-sm text-ink-muted" role="status">
          Loading your months…
        </p>
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
      } @else if (progressStore.months().length) {
        <div class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          @for (month of progressStore.months(); track month.name) {
            <article
              class="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-outline bg-surface-raised transition-colors hover:border-brand/65 hover:bg-brand-soft/20"
              [class.border-brand]="editingName() === month.name"
            >
              <div class="flex flex-1 flex-col p-5">
                <div class="flex items-center justify-between gap-3">
                  <span
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft/70 text-brand-strong"
                  >
                    <mat-icon aria-hidden="true">savings</mat-icon>
                  </span>
                  <span
                    class="rounded-lg px-2.5 py-1 text-xs font-semibold"
                    [class.bg-brand-soft]="month.hasProgress"
                    [class.text-brand-strong]="month.hasProgress"
                    [class.bg-surface-subtle]="!month.hasProgress"
                    [class.text-ink-subtle]="!month.hasProgress"
                  >
                    {{ month.verified ? 'Verified' : month.hasProgress ? 'Progress added' : 'Not added yet' }}
                  </span>
                </div>
                <h3 class="mt-4 text-lg font-bold tracking-tight">{{ month.name }}</h3>
                @if (month.hasProgress) {
                  <dl class="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <dt class="text-xs font-semibold text-ink-subtle">Amount saved</dt>
                      <dd class="mt-1 text-xl font-bold">
                        {{ month.checkpoint?.savedMoney === null ? '—' : (month.checkpoint?.savedMoney | currency) }}
                      </dd>
                    </div>
                    <div>
                      <dt class="text-xs font-semibold text-ink-subtle">Credit score</dt>
                      <dd class="mt-1 text-xl font-bold">{{ month.checkpoint?.creditScore ?? '—' }}</dd>
                    </div>
                  </dl>
                  @if (month.checkpoint?.application) {
                    <p class="mt-4 whitespace-pre-line break-words text-sm leading-6 text-ink-muted">
                      {{ month.checkpoint?.application }}
                    </p>
                  }
                } @else {
                  <p class="mt-3 text-sm leading-6 text-ink-muted">
                    Ready when you are. Add your savings for this month.
                  </p>
                }
              </div>
              <footer class="mt-auto border-t border-outline bg-surface-subtle/50 px-5 py-4">
                @if (month.verified) {
                  <p class="text-xs leading-5 text-ink-muted">
                    Verified by your program team. Contact them if a correction is needed.
                  </p>
                } @else {
                  <button
                    type="button"
                    [disabled]="progressStore.saving()"
                    (click)="editMonth(month)"
                    class="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-outline bg-surface px-4 text-sm font-bold text-brand-strong transition-colors hover:border-brand hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
                  >
                    {{ month.hasProgress ? 'Update progress' : 'Add progress' }}
                  </button>
                }
                @if (month.hasProgress) {
                  <p class="mt-3 text-center text-xs text-ink-subtle">
                    Updated {{ month.checkpoint?.updatedAt | date: 'mediumDate' }}
                  </p>
                }
              </footer>
            </article>
          }
        </div>
        <p class="mt-5 text-sm leading-6 text-ink-muted">
          Have a supporting receipt?
          <a
            routerLink="../receipts"
            class="rounded font-bold text-brand-strong underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-brand"
          >
            Upload it in Receipts
          </a>
          after saving your progress.
        </p>
      } @else {
        <div class="mt-6 rounded-2xl border border-dashed border-outline bg-surface-raised px-6 py-12 text-center">
          <mat-icon class="text-brand-strong" aria-hidden="true">event_note</mat-icon>
          <h3 class="mt-3 text-lg font-bold">No months configured yet</h3>
          <p class="mt-1 text-sm text-ink-muted">Your program team will make monthly updates available here.</p>
        </div>
      }
    </section>
  `,
  host: { class: 'block' },
})
export default class SavingsComponent {
  readonly id = input.required<string>();
  readonly progressStore = inject(MonthlyProgressStore);
  readonly usersOnProgramsStore = inject(UsersOnProgramsStore);
  readonly editingName = signal<string | null>(null);
  private readonly injector = inject(Injector);
  private readonly amountInput = viewChild<ElementRef<HTMLInputElement>>('savedAmount');
  private readonly fb = inject(FormBuilder);
  readonly progressForm = this.fb.group({
    savedMoney: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0),
      Validators.pattern(/^\d+(\.\d{1,2})?$/),
    ]),
    creditScore: this.fb.control<number | null>(null, [Validators.min(0), Validators.pattern(/^\d+$/)]),
    application: this.fb.nonNullable.control('', Validators.maxLength(2000)),
  });
  loadEffect = effect(() => {
    const id = this.id();
    untracked(() => {
      this.editingName.set(null);
      this.progressStore.load(id);
    });
  });

  editMonth(month: ReturnType<InstanceType<typeof MonthlyProgressStore>['months']>[number]): void {
    if (month.verified || this.progressStore.saving()) return;
    this.progressForm.reset({
      savedMoney: month.checkpoint?.savedMoney ?? null,
      creditScore: month.checkpoint?.creditScore ?? null,
      application: month.checkpoint?.application ?? '',
    });
    this.editingName.set(month.name);
    afterNextRender(() => this.amountInput()?.nativeElement.focus(), { injector: this.injector });
  }

  saveProgress(): void {
    const name = this.editingName();
    if (!name || this.progressStore.saving()) return;
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
      onSaved: () => {
        this.editingName.set(null);
        this.usersOnProgramsStore.getUserOnProgram();
      },
    });
  }
}
