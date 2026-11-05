import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { AuthStore } from '@mas/frontend-shared-auth';
import { ProgramsStore, UsersOnProgramsStore } from '@mas/frontend-shared-data-access';
import { BehaviorSubject } from 'rxjs';
import ProgressComponent from './progress.component';

describe('ProgressComponent', () => {
  const setRequirementCompletion = jest.fn();
  const task = (requirementId: string, month: number | null, isCompleted: boolean) => ({
    requirementId,
    requirementName: `Task ${requirementId}`,
    month,
    isCompleted,
    dueAt: null,
    actionInstructions: null,
    isActionRequirement: false,
    completionLink: null,
  });
  const fragment = new BehaviorSubject<string | null>(null);

  const setup = () => {
    const start = new Date();
    start.setMonth(start.getMonth() - 1);
    TestBed.configureTestingModule({
      imports: [ProgressComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatSnackBar, useValue: { open: jest.fn() } },
        { provide: ActivatedRoute, useValue: { fragment } },
        { provide: AuthStore, useValue: { user: signal({ id: 'user-1' }), isAdmin: signal(false) } },
        { provide: ProgramsStore, useValue: { program: signal({ startDate: start.toISOString() }) } },
        {
          provide: UsersOnProgramsStore,
          useValue: {
            userProgramProgress: signal([
              task('a', 1, true),
              task('b', 2, false),
              task('c', 2, true),
              task('d', null, false),
            ]),
            savingRequirementIds: signal([]),
            setRequirementCompletion,
            getUserOnProgram: jest.fn(),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(ProgressComponent);
    fixture.componentRef.setInput('id', 'program-1');
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/checkpoints/my/program/program-1').flush({
      checkpointNames: ['Month 1', 'Month 2', 'Month 3'].map((name) => ({ name, type: 'Savings', sequence: 999 })),
      checkpoints: [],
    });
    http.match(() => true).forEach((request) => request.flush([]));
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    return { fixture, element };
  };
  afterEach(() => {
    setRequirementCompletion.mockReset();
    fragment.next(null);
    TestBed.resetTestingModule();
  });

  it('opens the current month with its tasks and leaves out tasks without a month', () => {
    const { element } = setup();
    expect(element.querySelector('[aria-current="step"]')?.textContent).toContain('Month 2');
    const month = element.querySelector('[aria-labelledby="month-heading-2"]');
    expect(month?.textContent).toContain('This month');
    expect(Array.from(month?.querySelectorAll('ul label') ?? []).map((item) => item.id)).toEqual(['b', 'c']);
    expect(element.textContent).not.toContain('Task d');
    expect(element.textContent).not.toContain('Earlier receipts without a month');
  });

  it('checks and unchecks tasks through the participant store', () => {
    const { element } = setup();
    element.querySelector<HTMLInputElement>('#b input')?.click();
    expect(setRequirementCompletion).toHaveBeenCalledWith({ requirementId: 'b', isCompleted: true });
    element.querySelector<HTMLInputElement>('#c input')?.click();
    expect(setRequirementCompletion).toHaveBeenLastCalledWith({ requirementId: 'c', isCompleted: false });
  });

  it('moves between months and follows calendar links to a task', () => {
    const { fixture, element } = setup();
    element.querySelector<HTMLButtonElement>('[aria-label="Previous month"]')?.click();
    fixture.detectChanges();
    expect(element.querySelector('#month-heading-1')).not.toBeNull();
    expect(element.querySelector<HTMLButtonElement>('[aria-label="Previous month"]')?.disabled).toBe(true);

    const current = Array.from(element.querySelectorAll('button')).find((item) =>
      item.textContent?.includes('Current month'),
    );
    expect(current?.disabled).toBe(false);
    current?.click();
    fixture.detectChanges();
    expect(element.querySelector('#month-heading-2')).not.toBeNull();
    expect(current?.disabled).toBe(true);
    expect(element.querySelector('[aria-label="Show earlier months"]')).not.toBeNull();
    expect(element.querySelector('[aria-label="Show later months"]')).not.toBeNull();

    element.querySelector<HTMLButtonElement>('[aria-label="Previous month"]')?.click();
    fixture.detectChanges();
    fragment.next('b');
    fixture.detectChanges();
    expect(element.querySelector('#month-heading-2')).not.toBeNull();
  });

  it('requires an amount before saving the monthly update', () => {
    const { fixture, element } = setup();
    element.querySelector<HTMLButtonElement>('[aria-labelledby="update-heading-2"] button[type="submit"]')?.click();
    fixture.detectChanges();
    expect(element.textContent).toContain('Enter an amount of 0 or more');
    TestBed.inject(HttpTestingController).expectNone((request) => request.method === 'PUT');
  });
});
