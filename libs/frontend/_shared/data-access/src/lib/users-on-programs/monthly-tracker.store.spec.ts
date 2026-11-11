import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProgramsStore } from '../programs/programs.store';
import { MonthlyProgressStore } from './monthly-progress.store';
import { UsersOnProgramsStore } from './users-on-programs.store';

describe('MonthlyProgressStore month tracker', () => {
  let store: InstanceType<typeof MonthlyProgressStore>;
  const task = (requirementId: string, month: number | null, isCompleted: boolean) => ({
    requirementId,
    requirementName: requirementId,
    month,
    isCompleted,
    dueAt: null,
  });
  const tasks = signal([
    task('budget', 1, true),
    task('statement', 2, false),
    task('coach', 2, true),
    task('survey', null, false),
    task('old', 9, false),
  ]);

  beforeEach(() => {
    const start = new Date();
    start.setMonth(start.getMonth() - 1);
    TestBed.configureTestingModule({
      providers: [
        MonthlyProgressStore,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatSnackBar, useValue: { open: jest.fn() } },
        { provide: UsersOnProgramsStore, useValue: { userProgramProgress: tasks } },
        { provide: ProgramsStore, useValue: { program: signal({ startDate: start.toISOString() }) } },
      ],
    });
    store = TestBed.inject(MonthlyProgressStore);
    store.load('program-1');
    TestBed.inject(HttpTestingController)
      .expectOne('/api/checkpoints/my/program/program-1')
      .flush({
        checkpointNames: [
          { name: 'Month 3', type: 'Savings', sequence: 3 },
          { name: 'Month 1', type: 'Savings', sequence: 999 },
          { name: 'Month 2', type: 'Savings', sequence: 999 },
        ],
        checkpoints: [
          {
            id: 'entry-1',
            name: 'Month 1',
            userId: 'user-1',
            programId: 'program-1',
            savedMoney: 25,
            creditScore: null,
            application: null,
            createdAt: '2026-10-01T12:00:00Z',
            updatedAt: '2026-10-11T12:00:00Z',
            images: [],
          },
        ],
      });
  });
  afterEach(() => TestBed.resetTestingModule());

  it('places each task on its month card and labels the months around the current one', () => {
    expect(store.currentMonth()).toBe(2);
    expect(
      store.trackerMonths().map(({ name, tasks, completeCount, percentComplete, state }) => ({
        name,
        tasks: tasks.map((item) => item.requirementId),
        completeCount,
        percentComplete,
        state,
      })),
    ).toEqual([
      { name: 'Month 1', tasks: ['budget'], completeCount: 1, percentComplete: 100, state: 'complete' },
      { name: 'Month 2', tasks: ['statement', 'coach'], completeCount: 1, percentComplete: 50, state: 'current' },
      { name: 'Month 3', tasks: [], completeCount: 0, percentComplete: 0, state: 'upcoming' },
    ]);
  });

  it('keeps unscheduled tasks and tasks from removed months in the anytime list', () => {
    expect(store.anytimeTasks().map((item) => item.requirementId)).toEqual(['survey', 'old']);
  });

  it('labels each month and its saved update for the participant', () => {
    expect(store.trackerMonths().map(({ stateLabel, updatedLabel }) => [stateLabel, updatedLabel])).toEqual([
      ['Complete', 'Updated Oct 11, 2026'],
      ['This month', null],
      ['Upcoming', null],
    ]);
    expect(store.trackerMonths()[1].ringDash).toBe(`${(Math.PI * 15).toFixed(1)} ${(2 * Math.PI * 15).toFixed(1)}`);
  });

  it('opens the current month and steps through the others', () => {
    expect(store.selectedMonth()?.name).toBe('Month 2');
    store.stepMonth(1);
    expect(store.selectedMonth()?.name).toBe('Month 3');
    expect(store.isLastMonth()).toBe(true);
    store.stepMonth(1);
    expect(store.selectedMonth()?.name).toBe('Month 3');
    store.selectMonth(1);
    expect(store.isFirstMonth()).toBe(true);
    expect(store.isCurrentMonth()).toBe(false);
    store.showCurrentMonth();
    expect(store.selectedMonth()?.name).toBe('Month 2');
    expect(store.isCurrentMonth()).toBe(true);
  });
});
