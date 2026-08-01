import { formatCurrency, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  PLATFORM_ID,
  untracked,
} from '@angular/core';
import { CheckpointsStore, UsersOnProgramsStore, UsersStore } from '@mas/frontend-shared-data-access';
import { AgCharts } from 'ag-charts-angular';
import { AgChartOptions } from 'ag-charts-community';

@Component({
  selector: 'mas-total-amount-saved-chart',
  imports: [AgCharts],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-4 h-full">
      @defer (when isBrowser) {
        <ag-charts class="flex-grow" [options]="options()" />
      }
    </div>
  `,
  host: {
    class: 'block',
  },
})
export class TotalAmountSavedChartComponent {
  id = input.required<string>();
  userId = input.required<string>();
  usersOnProgramsStore = inject(UsersOnProgramsStore);
  checkpointsStore = inject(CheckpointsStore);
  usersStore = inject(UsersStore);
  isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  usersOnProgramEffect = effect(() => {
    const id = this.id();

    untracked(() => {
      this.usersOnProgramsStore.setProgramId(id);
      this.usersOnProgramsStore.getUsers();
    });
  });

  totalAmountPaidOut = computed(() => {
    const users = this.usersOnProgramsStore.users();
    return users.reduce((total, user) => total + (user.totalAmountPaidOut || 0), 0);
  });

  totalSavedMoney = computed(() => {
    const checkpoints = this.checkpointsStore.checkpoints();
    return checkpoints.reduce((total, checkpoint) => total + (checkpoint.savedMoney || 0), 0);
  });

  options = computed<AgChartOptions>(() => {
    const defaultOptions: AgChartOptions = {
      title: {
        text: 'Total Amount Saved',
      },
      series: [
        {
          type: 'bar',
          xKey: 'total',
          yKey: 'savedMoney',
          yName: 'Saved Money',
          label: {
            formatter: (params) => `${formatCurrency(params.value, 'en-US', '$', 'USD', '1.0-0')}`,
            color: 'black',
          },
        },
        {
          type: 'bar',
          xKey: 'total',
          yKey: 'totalAmountPaidOut',
          yName: 'Total Amount Paid Out',
          label: {
            formatter: (params) => `${formatCurrency(params.value, 'en-US', '$', 'USD', '1.0-0')}`,
            color: 'black',
          },
        },
      ],
    };

    return {
      ...defaultOptions,
      data: [
        {
          total: '',
          totalAmountPaidOut: this.totalAmountPaidOut(),
          savedMoney: this.totalSavedMoney(),
        },
      ],
    };
  });
}
