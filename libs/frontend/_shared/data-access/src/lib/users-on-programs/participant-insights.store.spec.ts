import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProgramsStore } from '../programs/programs.store';
import { MonthlyProgressStore } from './monthly-progress.store';
import { ParticipantInsightsStore } from './participant-insights.store';
import { UsersOnProgramsStore } from './users-on-programs.store';

describe('ParticipantInsightsStore', () => {
  let store: InstanceType<typeof ParticipantInsightsStore>;
  const task = (requirementId: string, month: number, isCompleted: boolean, dueAt: string | null = null) => ({
    requirementId,
    requirementName: `Task ${requirementId}`,
    month,
    isCompleted,
    dueAt,
  });
  const entry = (month: number, savedMoney: number | null, creditScore: number | null, images: number) => ({
    id: `entry-${month}`,
    name: `Month ${month}`,
    userId: 'user-1',
    programId: 'program-1',
    savedMoney,
    creditScore,
    application: null,
    createdAt: '2026-10-01T12:00:00Z',
    updatedAt: '2026-10-11T12:00:00Z',
    images: Array.from({ length: images }, (_, index) => ({ id: `img-${month}-${index}`, imageVerified: false })),
  });

  beforeEach(() => {
    const start = new Date();
    start.setMonth(start.getMonth() - 3);
    TestBed.configureTestingModule({
      providers: [
        MonthlyProgressStore,
        ParticipantInsightsStore,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatSnackBar, useValue: { open: jest.fn() } },
        { provide: ProgramsStore, useValue: { program: signal({ startDate: start.toISOString() }) } },
        {
          provide: UsersOnProgramsStore,
          useValue: {
            userProgramProgress: signal([
              task('a', 1, true),
              task('b', 2, true),
              task('c', 4, false, '2026-11-12T23:59:00Z'),
              task('d', 4, false, '2020-01-05T23:59:00Z'),
              task('e', 4, false, '2026-12-01T23:59:00Z'),
              task('f', 5, false, '2027-01-01T23:59:00Z'),
            ]),
            percentageCompleted: signal(33),
            userProgramSavings: signal('$451.00'),
            userCreditIncrease: signal(12),
          },
        },
      ],
    });
    store = TestBed.inject(ParticipantInsightsStore);
    TestBed.inject(MonthlyProgressStore).load('program-1');
    TestBed.inject(HttpTestingController)
      .expectOne('/api/checkpoints/my/program/program-1')
      .flush({
        checkpointNames: [1, 2, 3, 4, 5].map((number) => ({
          name: `Month ${number}`,
          type: 'Savings',
          sequence: number,
        })),
        checkpoints: [entry(1, 100, 620, 1), entry(2, 140, 625, 2), entry(3, null, null, 0), entry(4, 70, 632, 2)],
      });
  });
  afterEach(() => TestBed.resetTestingModule());

  it('summarises progress, savings, credit and receipts', () => {
    expect(store.progress()).toEqual(
      expect.objectContaining({ percent: 33, completed: 2, total: 6, monthsComplete: 2, monthCount: 5 }),
    );
    expect(store.savings()).toEqual({ totalLabel: '$451.00', latestLabel: '+$70.00 in Month 4' });
    expect(store.credit()).toEqual({ change: 12, changeLabel: '+12', rangeLabel: '620 → 632' });
    expect(store.receipts()).toEqual({ count: 5, monthCount: 3 });
  });

  it('scales savings bars to the best month and follows the picked bar', () => {
    expect(
      store.savingsBars().map(({ short, hasSavings, heightPercent }) => [short, hasSavings, heightPercent]),
    ).toEqual([
      ['M1', true, 71],
      ['M2', true, 100],
      ['M3', false, 0],
      ['M4', true, 50],
      ['M5', false, 0],
    ]);
    expect(store.savingsBars().find(({ isSelected }) => isSelected)?.short).toBe('M4');
    store.focusMonth(2);
    expect(store.savingsBars().find(({ isSelected }) => isSelected)?.short).toBe('M2');
  });

  it('plots every monthly credit score, skipping months without one', () => {
    expect(store.creditChart()?.dots.map(({ number, score, x, y }) => [number, score, x, Math.round(y)])).toEqual([
      [1, 620, 40, 150],
      [2, 625, 160, 108],
      [4, 632, 280, 50],
    ]);
    expect(store.creditChart()?.line).toBe('40.0,150.0 160.0,108.3 280.0,50.0');
    expect(store.creditChart()?.dots.at(-1)?.isLatest).toBe(true);
  });

  it('marks finished months and the current one', () => {
    expect(store.monthDots().map(({ number, isComplete, isCurrent }) => [number, isComplete, isCurrent])).toEqual([
      [1, true, false],
      [2, true, false],
      [3, false, false],
      [4, false, true],
      [5, false, false],
    ]);
  });
});
