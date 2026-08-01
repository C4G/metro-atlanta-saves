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
    <div class="flex flex-col p-6">
      <div class="flex justify-between align-middle">
        <h2 class="text-2xl font-bold mb-3">Cohort Summary Page</h2>
        <div>
          <button matPrefix mat-raised-button aria-label="download" (click)="usersOnProgramsStore.downloadExcel()">
            <mat-icon>download</mat-icon>
            Export
          </button>
          <span style="margin-left: 16px;"></span>
          <mat-form-field class="w-64 mt-4">
            <mat-select [(ngModel)]="selectedChartType" (selectionChange)="onChartTypeChange($event.value)">
              <mat-option value="total-amount-saved">Total Amount Saved</mat-option>
              <mat-option value="total-program-progress">Total Program Progress</mat-option>
              <mat-option value="individual-program-progress">Individual Program Progress</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </div>
      <!-- Chart Wrapper -->
      <div class="w-full flex justify-center">
        <div class="w-full max-w-4xl bg-white rounded-2xl shadow-md p-6 mt-10 ml-10">
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
    </div>
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
