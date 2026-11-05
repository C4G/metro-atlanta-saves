import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthStore } from '@mas/frontend-shared-auth';
import { DiscussionBoardsStore, ProgramsStore } from '@mas/frontend-shared-data-access';
import { of, throwError } from 'rxjs';

import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  let boards = signal([
    {
      id: 'board-1',
      name: 'Community board',
      description: 'Connect with peers',
      memberCount: 8,
      postCount: 3,
    },
  ]);
  const usersPrograms = signal([{ id: 'program-1', name: 'Active program', description: 'In progress' }]);
  const upcomingPrograms = signal([
    { id: 'program-1', name: 'Active program', description: 'In progress', startDate: null },
    { id: 'program-2', name: 'Available program', description: 'Open now', startDate: null },
  ]);
  const getProgramsForUser = jest.fn();
  const getUpcoming = jest.fn();
  const getBoards = jest.fn(() => of([]));

  beforeEach(() => {
    getProgramsForUser.mockClear();
    getUpcoming.mockClear();
    getBoards.mockClear();
    boards = signal([
      {
        id: 'board-1',
        name: 'Community board',
        description: 'Connect with peers',
        memberCount: 8,
        postCount: 3,
      },
    ]);

    TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthStore,
          useValue: { user: signal({ firstName: 'Jordan' }), isStaff: signal(false) },
        },
        {
          provide: ProgramsStore,
          useValue: { usersPrograms, upcomingPrograms, getProgramsForUser, getUpcoming },
        },
        {
          provide: DiscussionBoardsStore,
          useValue: { boards, getBoards },
        },
      ],
    });
  });

  it('loads participant programs and discussion boards', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();

    expect(getProgramsForUser).toHaveBeenCalledTimes(1);
    expect(getUpcoming).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.welcomeHeading()).toBe('Welcome back, Jordan.');
    expect(getBoards).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.discussionBoardsStore.boards()).toHaveLength(1);
    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Welcome back, Jordan.');
  });

  it('does not offer programs in which the participant is already enrolled', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.availablePrograms().map((program) => program.id)).toEqual(['program-2']);
  });

  it.each([false, true])('links program cards to the correct view for staff=%s', (isStaff) => {
    TestBed.overrideProvider(AuthStore, {
      useValue: { user: signal({ firstName: 'Jordan' }), isStaff: signal(isStaff) },
    });
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector(
      '[aria-labelledby="my-programs-heading"] article a',
    );
    expect(!!fixture.nativeElement.querySelector('[aria-label="Dashboard overview"]')).toBe(isStaff);
    expect(link.getAttribute('href')).toBe(
      isStaff ? '/partner-staff/programs/program-1/progress' : '/program-profiles/program-1',
    );
  });

  it('shows the empty discussion state when boards cannot be loaded', () => {
    boards.set([]);
    TestBed.overrideProvider(DiscussionBoardsStore, {
      useValue: { boards, getBoards: jest.fn(() => throwError(() => new Error('Request failed'))) },
    });

    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.discussionBoardsStore.boards()).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain('No discussion boards are available yet.');
  });
});
