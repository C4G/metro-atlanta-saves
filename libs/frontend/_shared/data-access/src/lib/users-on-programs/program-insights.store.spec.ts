import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { creditChange, csvCell, participantStatus, ProgramInsightsStore } from './program-insights.store';
import { TaskReviewStore } from './task-review.store';

const startDate = new Date();
startDate.setMonth(startDate.getMonth() - 1);

const checkpoint = (month: number, savedMoney: number, creditScore: number | null, verified = false) => ({
  id: `entry-${month}`,
  name: `Month ${month}`,
  savedMoney,
  creditScore,
  application: null,
  updatedAt: startDate.toISOString(),
  images: [
    { id: `img-${month}`, name: 'receipt.pdf', type: 'application/pdf', imageVerified: verified, createdAt: '' },
  ],
});

const person = (id: string, firstName: string, overrides = {}) => ({
  id,
  firstName,
  lastName: 'Test',
  email: `${id}@example.com`,
  requirementStatus: [],
  completions: [],
  checkpoints: [],
  ...overrides,
});

const done = (requirementId: string) => ({ requirementId, completedAt: '', verifiedAt: null, verifiedBy: null });

const data = {
  startDate: startDate.toISOString(),
  months: [1, 2, 3].map((number) => ({ name: `Month ${number}`, number })),
  requirements: [
    { id: 'budget', name: 'Budget', dueAt: null, month: 1, educationalContentId: null },
    { id: 'statement', name: 'Statement', dueAt: null, month: 2, educationalContentId: null },
  ],
  participants: [
    person('ana', 'Ana', {
      completions: [done('budget'), done('statement')],
      checkpoints: [checkpoint(1, 100, 600, true), checkpoint(2, 50, 640)],
    }),
    person('ben', 'Ben', {
      completions: [done('statement')],
      checkpoints: [checkpoint(1, 30, 700), checkpoint(2, 0, 690)],
    }),
    person('cy', 'Cy, Jr'),
  ],
};

describe('program insights helpers', () => {
  it('measures credit change from the first to the latest score', () => {
    expect(creditChange([600, 620, 640])).toBe(40);
    expect(creditChange([700])).toBeNull();
  });

  it('sorts people into a status', () => {
    expect(participantStatus({ hasActivity: false, overdueOpen: 2 })).toBe('notStarted');
    expect(participantStatus({ hasActivity: true, overdueOpen: 1 })).toBe('behind');
    expect(participantStatus({ hasActivity: true, overdueOpen: 0 })).toBe('onTrack');
  });

  it('quotes spreadsheet cells that need it', () => {
    expect(csvCell('Cy, Jr')).toBe('"Cy, Jr"');
    expect(csvCell('Say "hi"')).toBe('"Say ""hi"""');
    expect(csvCell(12)).toBe('12');
  });
});

describe('ProgramInsightsStore', () => {
  let store: InstanceType<typeof ProgramInsightsStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TaskReviewStore,
        ProgramInsightsStore,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LOCALE_ID, useValue: 'en-US' },
      ],
    });
    TestBed.inject(TaskReviewStore).load('program-1');
    TestBed.inject(HttpTestingController).expectOne('/api/users-on-programs/program/program-1/task-review').flush(data);
    store = TestBed.inject(ProgramInsightsStore);
  });
  afterEach(() => TestBed.resetTestingModule());

  it('summarizes tasks, savings and credit in the key numbers', () => {
    expect(store.kpis().map(({ label, value }) => [label, value])).toEqual([
      ['Tasks complete', '50%'],
      ['Total saved', '$180'],
      ['Average saved', '$60'],
      ['Avg credit change', '+15'],
      ['Credit improved', '1 of 2'],
      ['Not saving yet', '1'],
    ]);
  });

  it('charts savings for months that have started and marks the current one', () => {
    const { bars, total } = store.savingsByMonth();
    expect(total).toBe('$180');
    expect(bars.map(({ value, isCurrent }) => [value, isCurrent])).toEqual([
      [130, false],
      [50, true],
      [null, false],
    ]);
  });

  it('counts who is on track, behind, or not started', () => {
    expect(store.status().groups.map(({ status, count }) => [status, count])).toEqual([
      ['onTrack', 1],
      ['behind', 1],
      ['notStarted', 1],
    ]);
    expect(store.status().receiptsLabel).toBe('1 of 4');
  });

  it('narrows savings to the chosen period', () => {
    store.setPeriod('month');
    expect(store.kpis()[1].value).toBe('$50');
  });

  it('ranks the leaderboards and sorts the table', () => {
    expect(store.boards()[0].rows.map(({ name, label }) => [name, label])).toEqual([
      ['Ana Test', '$150'],
      ['Ben Test', '$30'],
    ]);
    expect(store.boards()[1].rows.map(({ name }) => name)).toEqual(['Ana Test']);
    store.setSort('credit');
    expect(store.table().map(({ id, deltaLabel }) => [id, deltaLabel])).toEqual([
      ['ana', '+40'],
      ['ben', '-10'],
      ['cy', ''],
    ]);
  });

  it('exports the table as a spreadsheet', () => {
    store.setSort('name');
    expect(store.reportCsv().split('\n')).toEqual([
      'Participant,Saved,First credit score,Latest credit score,Credit change,Tasks done,Receipts',
      'Ana Test,150.00,600,640,40,2/2,2',
      'Ben Test,30.00,700,690,-10,1/2,2',
      '"Cy, Jr Test",0.00,,,,0/2,0',
    ]);
  });
});
