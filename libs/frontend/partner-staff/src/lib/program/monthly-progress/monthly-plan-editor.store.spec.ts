import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { FrequentTasksStore, TaskReviewStore } from '@mas/frontend-shared-data-access';
import { MonthlyPlanEditorStore, monthRange, toDueAt, windowFor } from './monthly-plan-editor.store';

describe('monthly plan editor helpers', () => {
  it('finds the calendar days of a program month', () => {
    expect(monthRange(new Date(2026, 0, 15), 2)).toEqual({ min: '2026-02-15', max: '2026-03-14' });
    expect(monthRange(null, 2)).toBeNull();
  });

  it('keeps the selected month inside the six visible tabs', () => {
    expect(windowFor(3, 1, 10)).toBe(1);
    expect(windowFor(8, 1, 10)).toBe(3);
    expect(windowFor(2, 4, 10)).toBe(2);
    expect(windowFor(1, 3, 4)).toBe(1);
  });

  it('sets due dates at the end of the chosen day', () => {
    expect(toDueAt('')).toBeNull();
    expect(new Date(toDueAt('2026-11-02') ?? '').getHours()).toBe(23);
  });
});

describe('MonthlyPlanEditorStore', () => {
  let editor: InstanceType<typeof MonthlyPlanEditorStore>;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TaskReviewStore,
        FrequentTasksStore,
        MonthlyPlanEditorStore,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(FrequentTasksStore).load('program-1');
    http.expectOne('/api/programs/program-1/frequent-tasks').flush([
      { id: 'f1', name: 'Budgeting', educationalContentId: null },
      { id: 'f2', name: 'Credit check', educationalContentId: null },
    ]);
    editor = TestBed.inject(MonthlyPlanEditorStore);
    editor.start({
      months: 3,
      month: 1,
      tasks: [
        { id: 'a', name: 'Budgeting', month: 1, due: '', educationalContentId: null },
        { id: 'b', name: 'Savings', month: 3, due: '2026-12-01', educationalContentId: null },
        { id: 'c', name: 'Survey', month: null, due: '', educationalContentId: null },
      ],
    });
  });
  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });

  it('shows the selected month with starred tasks from frequently used', () => {
    expect(editor.month().tasks.map(({ name, isStarred }) => [name, isStarred])).toEqual([['Budgeting', true]]);
    expect(editor.library().map(({ name, isAdded }) => [name, isAdded])).toEqual([
      ['Budgeting', true],
      ['Credit check', false],
    ]);
    expect(editor.hasUnscheduled()).toBe(true);
  });

  it('will not shorten the program past a month that has tasks', () => {
    editor.setMonths(2);
    expect(editor.months()).toBe(3);
    expect(editor.atMinimum()).toBe(true);
  });

  it('collects new, edited, moved and removed tasks into one save', () => {
    editor.startAdding();
    editor.updateForm({ name: '  Upload statement ', due: '2026-10-20' });
    editor.submitForm();
    editor.addFromLibrary('f2');
    editor.startEditing('t1');
    editor.updateForm({ name: 'Savings goal' });
    editor.submitForm();
    editor.moveToMonth('t2', 2);
    editor.removeTask('t0');

    const { newTasks, assignments, removedRequirementIds, months } = editor.submission();
    expect(months).toBe(3);
    expect(newTasks.map(({ name, month }) => [name, month])).toEqual([
      ['Upload statement', 1],
      ['Credit check', 1],
    ]);
    expect(assignments).toEqual([
      { requirementId: 'b', month: 3, name: 'Savings goal' },
      { requirementId: 'c', month: 2 },
    ]);
    expect(removedRequirementIds).toEqual(['a']);
  });

  it('saves a starred task to the partner’s frequently used list', () => {
    editor.select(3);
    editor.toggleStar('t1');
    const request = http.expectOne('/api/programs/program-1/frequent-tasks');
    expect(request.request.body).toEqual({ name: 'Savings', educationalContentId: null });
    request.flush({ id: 'f3', name: 'Savings', educationalContentId: null });
    expect(editor.month().tasks[0].isStarred).toBe(true);
  });
});
