import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TaskReviewStore } from './task-review.store';

describe('TaskReviewStore monthly progress', () => {
  let store: InstanceType<typeof TaskReviewStore>;
  let http: HttpTestingController;
  const completedAt = '2026-10-16T12:00:00.000Z';
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1);
  const data = {
    startDate: startDate.toISOString(),
    months: [1, 2, 3].map((number) => ({ name: `Month ${number}`, number })),
    requirements: [
      { id: 'budget', name: 'Budget', dueAt: null, month: 1, educationalContentId: null },
      { id: 'statement', name: 'Upload statement', dueAt: null, month: 2, educationalContentId: null },
      { id: 'coach', name: 'Meet your coach', dueAt: null, month: 2, educationalContentId: null },
      { id: 'anytime', name: 'Survey', dueAt: null, month: null, educationalContentId: null },
    ],
    participants: [
      {
        id: 'person-1',
        firstName: 'Jordan',
        lastName: 'Lee',
        email: 'j@example.com',
        requirementStatus: ['coach'],
        completions: [
          { requirementId: 'budget', completedAt, verifiedAt: completedAt, verifiedBy: null },
          { requirementId: 'statement', completedAt, verifiedAt: null, verifiedBy: null },
        ],
        checkpoints: [
          {
            id: 'entry-2',
            name: 'Month 2',
            savedMoney: 40,
            creditScore: null,
            application: null,
            updatedAt: completedAt,
            images: [
              {
                id: 'img-1',
                name: 'receipt.pdf',
                type: 'application/pdf',
                imageVerified: false,
                createdAt: completedAt,
              },
            ],
          },
        ],
      },
      {
        id: 'person-2',
        firstName: 'Avery',
        lastName: 'Johnson',
        email: 'a@example.com',
        requirementStatus: [],
        completions: [],
        checkpoints: [],
      },
    ],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [TaskReviewStore, provideHttpClient(), provideHttpClientTesting()] });
    store = TestBed.inject(TaskReviewStore);
    http = TestBed.inject(HttpTestingController);
    store.load('program-1');
    http.expectOne('/api/users-on-programs/program/program-1/task-review').flush(data);
  });
  const jordan = () => {
    const row = store.participantRows().find(({ id }) => id === 'person-1');
    if (!row) throw new Error('Jordan Lee is missing');
    return row;
  };
  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });

  it('groups each participant month with its tasks, reviews and documents', () => {
    const month = jordan().months.get(2);
    expect(month?.tasks.map((task) => task.name)).toEqual(['Upload statement', 'Meet your coach']);
    expect(month?.completeCount).toBe(2);
    expect(month?.awaitingReview).toBe(1);
    expect(month?.tasks[1]).toEqual(expect.objectContaining({ isComplete: true, isLegacy: true, completion: null }));
    expect(month?.documents.map((document) => document.name)).toEqual(['receipt.pdf']);
    expect(month?.checkpoint?.savedMoney).toBe(40);
    expect(store.awaitingReviewTotal()).toBe(1);
    expect(store.unscheduledCount()).toBe(1);
  });

  it('works out the current month from the start date and summarises each month', () => {
    expect(store.currentMonth()).toBe(2);
    expect(
      store
        .monthSummaries()
        .map(({ state, percentComplete, awaitingReview }) => ({ state, percentComplete, awaitingReview })),
    ).toEqual([
      { state: 'done', percentComplete: 50, awaitingReview: 0 },
      { state: 'now', percentComplete: 50, awaitingReview: 1 },
      { state: 'upcoming', percentComplete: 0, awaitingReview: 0 },
    ]);
    expect(jordan().months.get(3)?.isUpcoming).toBe(true);
  });

  it('reviews the current month by default and filters its roster', () => {
    expect(store.focusedMonth()).toBe(2);
    expect(store.roster().map(({ name, status, statusLabel }) => ({ name, status, statusLabel }))).toEqual([
      { name: 'Avery Johnson', status: 'open', statusLabel: 'Not finished' },
      { name: 'Jordan Lee', status: 'review', statusLabel: '1 to review' },
    ]);
    expect(store.rosterFilters().map(({ value, count }) => [value, count])).toEqual([
      ['all', 2],
      ['review', 1],
      ['open', 1],
      ['done', 0],
    ]);
    store.setRosterFilter('open');
    expect(store.filteredRoster().map(({ id }) => id)).toEqual(['person-2']);
    expect(store.selectedMonth()?.id).toBe('person-2');
    expect(store.finishedCount()).toBe(1);
  });

  it('moves between months without leaving the program', () => {
    store.stepMonth(1);
    expect(store.focusedMonth()).toBe(3);
    expect(store.isLastMonth()).toBe(true);
    store.stepMonth(1);
    expect(store.focusedMonth()).toBe(3);
    store.focusOn(null);
    expect(store.focusedMonth()).toBe(2);
    store.stepMonth(-1);
    expect(store.isFirstMonth()).toBe(true);
    expect(store.roster().find(({ id }) => id === 'person-1')).toEqual(
      expect.objectContaining({ month: 1, status: 'done', reviewedCount: 1 }),
    );
  });

  it('jumps to the next participant waiting for review, clearing a filter that hides them', () => {
    store.select('person-2');
    store.setRosterFilter('open');
    expect(store.nextToReview()?.id).toBe('person-1');
    store.selectNextToReview();
    expect(store.selectedMonth()?.id).toBe('person-1');
    expect(store.rosterFilter()).toBe('all');
    expect(store.nextToReview()).toBeNull();
  });

  it('summarises every month in the grid and opens a month from it', () => {
    expect(
      store.programGrid().map(({ name, percentComplete, openMonths, cells }) => ({
        name,
        percentComplete,
        openMonths,
        months: cells.map(({ month }) => month),
      })),
    ).toEqual([
      { name: 'Avery Johnson', percentComplete: 0, openMonths: 2, months: [1, 2, 3] },
      { name: 'Jordan Lee', percentComplete: 100, openMonths: 0, months: [1, 2, 3] },
    ]);
    store.setView('grid');
    store.setRosterFilter('review');
    store.openMonth('person-2', 1);
    expect(store.view()).toBe('month');
    expect(store.focusedMonth()).toBe(1);
    expect(store.rosterFilter()).toBe('all');
    expect(store.selectedMonth()?.id).toBe('person-2');
  });

  it('saves the monthly plan and updates months and task assignments in place', () => {
    const onSaved = jest.fn();
    const plan = {
      months: 4,
      assignments: [{ requirementId: 'anytime', month: 4 }],
      newTasks: [],
      removedRequirementIds: [],
    };
    store.savePlan({ ...plan, onSaved });
    const request = http.expectOne('/api/programs/program-1/monthly-plan');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(plan);
    request.flush({ months: 4, assignments: plan.assignments, created: [], removedRequirementIds: [] });
    expect(onSaved).toHaveBeenCalled();
    expect(store.months().map((month) => month.number)).toEqual([1, 2, 3, 4]);
    expect(store.unscheduledCount()).toBe(0);
  });

  it('adds created tasks, applies edits and drops removed tasks after saving', () => {
    store.savePlan({
      months: 3,
      assignments: [{ requirementId: 'budget', month: 1, name: 'Budget review', dueAt: '2026-11-02T04:59:00.000Z' }],
      newTasks: [{ name: 'Credit check', month: 3, dueAt: null, educationalContentId: null }],
      removedRequirementIds: ['coach'],
      onSaved: jest.fn(),
    });
    const created = { id: 'credit', name: 'Credit check', dueAt: null, month: 3, educationalContentId: null };
    http
      .expectOne('/api/programs/program-1/monthly-plan')
      .flush({ months: 3, assignments: [], created: [created], removedRequirementIds: ['coach'] });
    const requirements = store.data()?.requirements ?? [];
    expect(requirements.map(({ id }) => id)).toEqual(['budget', 'statement', 'anytime', 'credit']);
    expect(requirements[0]).toEqual(
      expect.objectContaining({ name: 'Budget review', dueAt: new Date('2026-11-02T04:59:00.000Z') }),
    );
  });

  it('totals savings and tasks done for each participant across the program', () => {
    expect(store.participantTotals().get('person-1')).toEqual({ saved: 40, tasksDone: 3, taskTotal: 4 });
    expect(store.participantTotals().get('person-2')).toEqual({ saved: 0, tasksDone: 0, taskTotal: 4 });
  });

  it('explains when removed months still hold tasks', () => {
    const onSaved = jest.fn();
    store.savePlan({ months: 1, assignments: [], newTasks: [], removedRequirementIds: [], onSaved });
    http.expectOne('/api/programs/program-1/monthly-plan').flush({}, { status: 409, statusText: 'Conflict' });
    expect(onSaved).not.toHaveBeenCalled();
    expect(store.planError()).toContain('months you removed');
    expect(store.planSaving()).toBe(false);
  });

  it('uploads receipts into a participant month, creating the month entry first', () => {
    const file = new File(['x'], 'receipt.png', { type: 'image/png' });
    store.uploadReceipts({ userId: 'person-2', month: 1, files: [file] });
    expect(store.uploading()).toBe('person-2:1');
    http.expectOne('/api/checkpoints/program/program-1/user/person-2/month/Month%201/receipt-checkpoint').flush({
      id: 'entry-1',
      name: 'Month 1',
      savedMoney: null,
      creditScore: null,
      application: null,
      updatedAt: completedAt,
      images: [],
    });
    const upload = http.expectOne((request) => request.url === '/api/images');
    expect(upload.request.params.get('checkpointId')).toBe('entry-1');
    upload.flush([
      { id: 'img-9', name: 'receipt.png', type: 'image/png', imageVerified: false, createdAt: completedAt, path: 'x' },
    ]);
    const avery = store.participantRows().find(({ id }) => id === 'person-2');
    expect(avery?.months.get(1)?.documents).toEqual([
      { id: 'img-9', name: 'receipt.png', type: 'image/png', imageVerified: false, createdAt: completedAt },
    ]);
    expect(store.uploading()).toBeNull();
  });

  it('lists participants by first name, then last name, ignoring case', () => {
    store.load('program-1');
    http.expectOne('/api/users-on-programs/program/program-1/task-review').flush({
      ...data,
      participants: [
        { ...data.participants[1], id: 'c', firstName: 'carlos', lastName: 'Mendez' },
        { ...data.participants[1], id: 'b', firstName: 'Avery', lastName: 'Zane' },
        { ...data.participants[1], id: 'a', firstName: 'Avery', lastName: 'Johnson' },
      ],
    });
    expect(store.roster().map(({ name }) => name)).toEqual(['Avery Johnson', 'Avery Zane', 'carlos Mendez']);
    expect(store.programGrid().map(({ id }) => id)).toEqual(['a', 'b', 'c']);
  });
});
