import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatOption, MatSelectModule } from '@angular/material/select';
import { AuthStore } from '@mas/frontend-shared-auth';
import { CheckpointsStore, ProgramsStore, UsersOnProgramsStore, UsersStore } from '@mas/frontend-shared-data-access';
import { RequirementsStore } from '../requirements/requirements.store';
import { TotalAmountSavedChartComponent } from './total-amount-saved-chart.component';
import { injectComputedUsersCombined } from './utils/inject-computed-users-combined';
import { CohortPercentageCompletionChartComponent } from './cohort-percentage-completion-chart.component';
import { CohortPercentageCompletionByUserChartComponent } from './cohort-percentage-completion-by-user-chart.component';

type ChartType = 'total-program-progress' | 'total-amount-saved' | 'individual-program-progress';

@Component({
  selector: 'mas-cohort-percentage-completion',
  imports: [
    MatIcon,
    MatButtonModule,
    CohortPercentageCompletionChartComponent,
    MatSelectModule,
    MatOption,
    TotalAmountSavedChartComponent,
    FormsModule,
    CohortPercentageCompletionByUserChartComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="p-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-300">
            Program insights
          </p>
          <h2 class="mt-1.5 text-xl font-bold tracking-[-0.025em] text-slate-900 dark:text-slate-100">
            Cohort summary
          </h2>
          <p class="mt-1.5 text-[0.8125rem] leading-5 text-slate-500 dark:text-slate-400">
            Understand program progress and savings outcomes across the cohort.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button
            matPrefix
            mat-raised-button
            class="!rounded-xl !bg-teal-50 !text-[0.8125rem] !font-bold !text-teal-800 dark:!bg-teal-400/10 dark:!text-teal-200"
            aria-label="Export cohort data"
            (click)="usersOnProgramsStore.downloadExcel()"
          >
            <mat-icon>download</mat-icon>
            Export
          </button>
          <mat-form-field
            appearance="outline"
            class="w-64 [--mdc-outlined-text-field-focus-outline-color:#0f766e] [--mdc-outlined-text-field-hover-outline-color:#5eead4] dark:[--mdc-outlined-text-field-input-text-color:#e2e8f0] dark:[--mdc-outlined-text-field-label-text-color:#94a3b8] dark:[--mdc-outlined-text-field-outline-color:rgba(148,163,184,0.3)] dark:[--mdc-outlined-text-field-focus-outline-color:#2dd4bf] w-64"
          >
            <mat-label>Summary view</mat-label>
            <mat-select [(ngModel)]="selectedChartType" (selectionChange)="onChartTypeChange($event.value)">
              <mat-option value="total-amount-saved">Total Amount Saved</mat-option>
              <mat-option value="total-program-progress">Total Program Progress</mat-option>
              <mat-option value="individual-program-progress">Individual Program Progress</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </div>
      <div class="mt-6 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-400/15 p-5 sm:p-6">
        <div class="w-full">
          @switch (selectedChartType()) {
            @case ('total-program-progress') {
              <div class="chart-container">
                <mas-cohort-percentage-completion-chart [data]="percentageCompleted()" />
              </div>
            }
            @case ('total-amount-saved') {
              <div class="chart-container">
                <mas-total-amount-saved-chart [id]="id()" [userId]="authStore.user()!.id" />
              </div>
            }
            @case ('individual-program-progress') {
              <div class="chart-container">
                <mas-cohort-percentage-completion-by-user-chart />
              </div>
            }
          }
        </div>
      </div>
    </section>
  `,
  host: {
    class: 'block',
  },
})
export default class CohortPercentageCompletionComponent {
  id = input.required<string>();
  userId = input.required<string>();
  programsStore = inject(ProgramsStore);
  usersOnProgramsStore = inject(UsersOnProgramsStore);
  usersStore = inject(UsersStore);
  requirementsStore = inject(RequirementsStore);
  checkpointsStore = inject(CheckpointsStore);
  authStore = inject(AuthStore);
  showPieChart = signal(true);
  selectedChartType = signal<ChartType>('total-amount-saved');

  checkpointsEffect = effect(() => {
    const id = this.id();
    const userId = this.authStore.user()?.id;

    untracked(() => {
      this.checkpointsStore.setProgramId(id);
      if (userId) {
        this.checkpointsStore.setUserId(userId);
        this.checkpointsStore.getCheckpoints();
      }
    });
  });

  initializationEffect = effect(() => {
    const id = this.id();

    untracked(() => {
      this.usersOnProgramsStore.setProgramId(id);
      this.usersOnProgramsStore.getUsers();
      this.usersOnProgramsStore.users();
      this.requirementsStore.setProgramId(id);
      this.requirementsStore.getRequirements();
    });
  });

  toggleChart() {
    this.showPieChart.update((value) => !value);
  }

  usersCombined = injectComputedUsersCombined();

  percentageCompleted = computed(() => this.usersCombined().reduce((acc, user) => acc + user.percentageCompleted, 0));

  onChartTypeChange(selectedValue: ChartType): void {
    this.selectedChartType.set(selectedValue);
  }
}
