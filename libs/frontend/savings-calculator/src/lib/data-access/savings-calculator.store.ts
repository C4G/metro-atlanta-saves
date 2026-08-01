import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { SavingsData } from '../savings-data.model';
import { computed } from '@angular/core';
import { SavingsChartData } from '../savings-chart-data.model';

type SavingsState = {
  calculator: SavingsData;
};

const initialState: SavingsState = {
  calculator: {
    initialDeposit: 600,
    monthlyContribution: 100,
    period: 6,
    apy: 2.4,
  },
};

export const SavingsCalculatorStore = signalStore(
  withState(initialState),
  withComputed(({ calculator }) => ({
    chartData: computed<SavingsChartData>(() => {
      let interestEarned = 0;
      for (let i = 0; i < calculator.period(); ++i) {
        interestEarned +=
          (calculator.initialDeposit() + i * calculator.monthlyContribution()) * (calculator.apy() / 100 / 12);
      }
      return {
        interestEarned,
        period: calculator.period(),
        initialDeposit: calculator.initialDeposit(),
        monthlyContribution: calculator.monthlyContribution() * calculator.period(),
      };
    }),
  })),
  withMethods((store) => ({
    update(data: SavingsData): void {
      patchState(store, (state) => ({ ...state, calculator: data }));
    },
  })),
);
