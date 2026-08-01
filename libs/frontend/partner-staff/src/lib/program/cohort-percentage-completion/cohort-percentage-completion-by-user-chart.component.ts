import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { UsersOnProgramsStore, UsersStore } from '@mas/frontend-shared-data-access';
import { AgChartsModule } from 'ag-charts-angular';
import { AgCartesianSeriesOptions, AgChartOptions } from 'ag-charts-community';
import { injectComputedUsersCombined } from './utils/inject-computed-users-combined';

@Component({
  selector: 'mas-cohort-percentage-completion-by-user-chart',
  imports: [AgChartsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-4 h-full">
      <ag-charts [options]="individualCompletionOptions()" class="w-full h-[400px]" />
    </div>
  `,
  host: {
    class: 'block',
  },
})
export class CohortPercentageCompletionByUserChartComponent {
  usersOnProgramsStore = inject(UsersOnProgramsStore);
  usersStore = inject(UsersStore);
  showPieChart = signal(true);

  usersCombined = injectComputedUsersCombined();

  totalUserProgress = computed(() =>
    this.usersCombined().reduce<Record<string, string | number>>((acc, user, index) => {
      acc[`${user.firstName}, ${user.lastName}`] = user.percentageCompleted;
      acc[`name${index}`] = `${user.firstName} ${user.lastName}`;
      return acc;
    }, {}),
  );

  series = computed<AgCartesianSeriesOptions[]>(() => {
    const users = this.usersCombined();

    return users.map((item, idx) => ({
      type: 'bar',
      direction: 'horizontal',
      yKey: `${item.firstName}, ${item.lastName}`,
      xKey: `name${idx}`,
      fill: '#4A90E2',
      label: {
        enabled: true,
        fontSize: 14,
        color: '#333',
      },
    }));
  });

  individualCompletionOptions = computed<AgChartOptions>(() => ({
    title: {
      text: 'Individual Completion Percentage',
    },
    series: this.series(),
    data: [this.totalUserProgress()],
  }));
}
