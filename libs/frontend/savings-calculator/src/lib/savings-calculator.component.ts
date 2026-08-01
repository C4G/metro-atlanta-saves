import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { FooterComponent } from '@mas/frontend-shared-layout';
import { SavingsCalculatorStore } from './data-access/savings-calculator.store';
import { SavingsData } from './savings-data.model';
import { SavingsChartComponent } from './ui/savings-chart/savings-chart.component';
import { SavingsFormComponent } from './ui/savings-form/savings-form.component';

@Component({
  selector: 'mas-savings-calculator',
  imports: [SavingsFormComponent, SavingsChartComponent, FooterComponent, MatIcon],
  providers: [SavingsCalculatorStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-4 p-6 max-w-4xl mx-auto">
      <h2 class="text-2xl font-bold mb-3">Savings Calculator</h2>
      <p>Look up your banks current interest rate and see what you could be saving each month for your future!</p>
      <div class="grid grid-cols-4 gap-4">
        <mas-savings-form
          class="col-span-4 sm:col-span-2"
          [data]="savingsCalculatorStore.calculator()"
          (formSubmit)="onFormSubmit($event)"
        />
        <mas-savings-chart class="col-span-4 sm:col-span-2" [data]="savingsCalculatorStore.chartData()" />
      </div>
      <p class="flex align-center gap-4">
        <mat-icon color="primary">trending_up</mat-icon>
        The average APY in the U.S. is 0.58%. Enter an APY to see how much you can save!
      </p>
    </div>
    <mas-footer />
  `,
  host: {
    class: 'block',
  },
})
export class SavingsCalculatorComponent {
  savingsCalculatorStore = inject(SavingsCalculatorStore);

  onFormSubmit(data: SavingsData) {
    this.savingsCalculatorStore.update(data);
  }
}
