import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UsersOnProgramsStore } from '@mas/frontend-shared-data-access';
import { RequirementsStore } from '../requirements/requirements.store';
import CohortPercentageCompletionComponent from './cohort-percentage-completion.component';

describe('Program insights', () => {
  const users = signal([
    {
      userId: 'person-1',
      firstName: 'Jordan',
      lastName: 'Taylor',
      totalAmountSaved: 100,
      totalAmountPaidOut: 25,
      completedRequirementIds: ['one', 'one', 'old'],
    },
    {
      userId: 'person-2',
      firstName: 'Casey',
      lastName: 'Lee',
      totalAmountSaved: 200,
      totalAmountPaidOut: 50,
      completedRequirementIds: ['one', 'two'],
    },
  ]);
  const loading = signal(false);
  const failed = signal(false);
  const getUsers = jest.fn();
  const getRequirements = jest.fn();
  let fixture: ComponentFixture<CohortPercentageCompletionComponent>;
  beforeEach(() => {
    loading.set(false);
    failed.set(false);
    jest.clearAllMocks();
    TestBed.configureTestingModule({
      imports: [CohortPercentageCompletionComponent],
      providers: [
        {
          provide: UsersOnProgramsStore,
          useValue: {
            users,
            usersLoading: loading,
            usersLoadFailed: failed,
            setProgramId: jest.fn(),
            getUsers,
            downloadExcel: jest.fn(),
          },
        },
        {
          provide: RequirementsStore,
          useValue: {
            requirements: signal([{ id: 'one' }, { id: 'two' }]),
            loading: signal(false),
            loadFailed: signal(false),
            setProgramId: jest.fn(),
            getRequirements,
          },
        },
      ],
    });
    fixture = TestBed.createComponent(CohortPercentageCompletionComponent);
    fixture.componentRef.setInput('id', 'program-1');
    fixture.detectChanges();
  });
  afterEach(() => TestBed.resetTestingModule());
  it('totals all participants and calculates average completion without duplicate or removed requirements', () => {
    expect(fixture.componentInstance.totalSaved()).toBe(300);
    expect(fixture.componentInstance.totalPaidOut()).toBe(75);
    expect(fixture.componentInstance.completion()).toBe(75);
    expect(fixture.nativeElement.textContent).toContain('$300.00');
  });
  it('switches the breakdown to savings', () => {
    const button = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>).find(
      (item) => item.textContent?.trim() === 'Savings',
    );
    button?.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.metric()).toBe('savings');
    expect(fixture.componentInstance.people().map((person) => person.savingsPercent)).toEqual([50, 100]);
  });
  it('distinguishes loading and failed requests from real zero totals', () => {
    loading.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Loading program insights');
    expect(fixture.nativeElement.querySelector('article')).toBeNull();
    loading.set(false);
    failed.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
    fixture.nativeElement.querySelector('[role="alert"] button').click();
    expect(getUsers).toHaveBeenCalledTimes(2);
    expect(getRequirements).toHaveBeenCalledTimes(2);
  });
});
