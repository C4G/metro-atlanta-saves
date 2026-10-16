import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MonthlyProgressStore } from './monthly-progress.store';

describe('MonthlyProgressStore', () => {
  let store: InstanceType<typeof MonthlyProgressStore>;
  let http: HttpTestingController;
  const entry = {
    id: 'month-3-entry',
    name: 'Month 3',
    userId: 'participant-1',
    programId: 'program-1',
    savedMoney: null,
    creditScore: null,
    application: null,
    createdAt: '2026-10-01',
    updatedAt: '2026-10-01',
    images: [],
  };
  const load = () => {
    store.load('program-1');
    http.expectOne('/api/checkpoints/my/program/program-1').flush({
      checkpointNames: ['Month 10', 'Month 3', 'Month 1'].map((name) => ({ name, type: 'Savings', sequence: 999 })),
      checkpoints: [entry],
    });
  };
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MonthlyProgressStore,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatSnackBar, useValue: { open: jest.fn() } },
      ],
    });
    store = TestBed.inject(MonthlyProgressStore);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });

  it('shows all configured months in natural order, including blank and missing entries', () => {
    load();
    expect(store.months().map((month) => month.name)).toEqual(['Month 1', 'Month 3', 'Month 10']);
    expect(store.months().every((month) => !month.hasProgress)).toBe(true);
    expect(store.months()[1].checkpoint?.id).toBe('month-3-entry');
  });

  it('saves zero as valid progress, updates the existing card, and ignores duplicate submissions', () => {
    load();
    const onSaved = jest.fn();
    const submission = { name: 'Month 3', savedMoney: 0, creditScore: null, application: '', onSaved };
    store.save(submission);
    store.save(submission);
    const request = http.expectOne('/api/checkpoints/my/program/program-1/month/Month%203');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ savedMoney: 0, creditScore: null, application: '' });
    request.flush({ ...entry, savedMoney: 0 });
    expect(store.months()[1].hasProgress).toBe(true);
    expect(store.checkpoints()).toHaveLength(1);
    expect(store.saving()).toBe(false);
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it('leaves existing progress intact on save failure and allows retry', () => {
    load();
    const submission = { name: 'Month 3', savedMoney: 200, creditScore: null, application: '', onSaved: jest.fn() };
    store.save(submission);
    http
      .expectOne('/api/checkpoints/my/program/program-1/month/Month%203')
      .flush({}, { status: 500, statusText: 'Failed' });
    expect(store.saveError()).toBeTruthy();
    expect(store.saving()).toBe(false);
    expect(store.months()[1].hasProgress).toBe(false);
    expect(submission.onSaved).not.toHaveBeenCalled();
    store.save(submission);
    http.expectOne('/api/checkpoints/my/program/program-1/month/Month%203').flush({ ...entry, savedMoney: 200 });
    expect(store.months()[1].hasProgress).toBe(true);
  });
});
