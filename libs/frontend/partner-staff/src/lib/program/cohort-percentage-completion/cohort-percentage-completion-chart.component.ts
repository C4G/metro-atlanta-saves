import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { UsersOnProgramsStore, UsersStore } from '@mas/frontend-shared-data-access';
import { AgChartsModule } from 'ag-charts-angular';
import { RequirementsStore } from '../requirements/requirements.store';

@Component({
  selector: 'mas-cohort-percentage-completion-chart',
  imports: [AgChartsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-4 h-full">
      <ag-charts [options]="totalCompletionChartOptions" class="w-full h-[400px]" />
    </div>
  `,
  host: {
    class: 'block',
  },
})
export class CohortPercentageCompletionChartComponent {
  data = input.required<number>();
  usersOnProgramsStore = inject(UsersOnProgramsStore);
  usersStore = inject(UsersStore);
  requirementsStore = inject(RequirementsStore);

  constructor() {
    this.usersStore.getUsers();
    this.usersStore.users();
  }

  totalCompletionChartOptions: any = {
    width: 600,
    height: 400,
    autoSize: true,
    data: [
      { category: 'Complete', value: this.sumPercentages(this.getTotalUserProgress()) },
      { category: 'Incomplete', value: 100 - this.sumPercentages(this.getTotalUserProgress()) },
    ],
    series: [
      {
        type: 'pie',
        angleKey: 'value',
        labelKey: 'category',
        fills: ['#2196f3', '#9e9e9e'],
        tooltip: {
          renderer: (params: any) => {
            return `
              <div>
                <strong>${params.datum.category}</strong>
                <br>
                Percentage: ${params.datum.value}%
              </div>
            `;
          },
        },
      },
    ],
    title: {
      text: 'Total Program Progress',
    },
  };

  sumPercentages(
    usersProgress: {
      userId: string;
      firstName: string;
      lastName: string;
      percentageCompleted: number;
      percentageOutstanding: number;
    }[],
  ): number {
    let totalPercentage = 0;
    for (const userProgress of usersProgress) {
      totalPercentage += userProgress.percentageCompleted;
    }
    return totalPercentage;
  }

  getTotalUserProgress(): {
    userId: string;
    firstName: string;
    lastName: string;
    percentageCompleted: number;
    percentageOutstanding: number;
  }[] {
    const users = this.usersOnProgramsStore.users();

    return users.map((user: any) => {
      const totalRequirements = this.requirementsStore.requirements().length ?? 0;
      const completedRequirements = user.requirementStatus?.length ?? 0;
      const percentageCompleted =
        totalRequirements > 0 ? Math.round((completedRequirements / totalRequirements) * 100) : 0;
      const percentageOutstanding = 100 - percentageCompleted;
      return {
        userId: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        percentageCompleted: percentageCompleted,
        percentageOutstanding: percentageOutstanding,
      };
    });
  }
}
