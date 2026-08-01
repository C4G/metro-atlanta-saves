import { formatCurrency, isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, PLATFORM_ID } from '@angular/core';
import { AgCharts } from 'ag-charts-angular';
import { AgChartOptions } from 'ag-charts-community';
import { SavingsChartData } from '../../savings-chart-data.model';

@Component({
  selector: 'mas-savings-chart',
  imports: [AgCharts],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-4 h-full">
      <p>You could save an extra {{ interestEarned() }} in interest over the course of {{ period() }} months!</p>
      @defer (when isBrowser) {
        <ag-charts class="flex-grow" [options]="options()" />
      }
    </div>
  `,
  host: {
    class: 'block',
  },
})
export class SavingsChartComponent {
  data = input.required<SavingsChartData>();
  isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  interestEarned = computed(() => {
    return `${formatCurrency(this.data().interestEarned, 'en-US', '$', 'USD', '1.0-0')}`;
  });
  period = computed(() => {
    return this.data().period;
  });
  options = computed<AgChartOptions>(() => {
    const data = this.data();
    const defaultOptions: AgChartOptions = {
      title: {
        text: 'Savings Calculator',
      },
      subtitle: {
        text: 'Compounded monthly based on APY',
      },
      series: [
        {
          type: 'bar',
          xKey: 'total',
          yKey: 'initialDeposit',
          yName: 'Initial Deposit',
          label: {
            formatter: (params) => `${formatCurrency(params.value, 'en-US', '$', 'USD', '1.0-0')}`,
            color: 'black',
          },
        },
        {
          type: 'bar',
          xKey: 'total',
          yKey: 'monthlyContribution',
          yName: 'Monthly Contribution',
          label: {
            formatter: (params) => `${formatCurrency(params.value, 'en-US', '$', 'USD', '1.0-0')}`,
            color: 'black',
          },
        },
        {
          type: 'bar',
          xKey: 'total',
          yKey: 'interestEarned',
          yName: 'Interest Earned',
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
          total: 'Total Savings Breakdown',
          initialDeposit: data.initialDeposit,
          monthlyContribution: data.monthlyContribution,
          interestEarned: data.interestEarned,
        },
      ],
    };
  });
}
