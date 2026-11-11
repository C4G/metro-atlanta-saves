import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthStore } from '@mas/frontend-shared-auth';
import { ProgramsStore } from '@mas/frontend-shared-data-access';

import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  const usersPrograms = signal([{ id: 'program-1', name: 'Active program', description: 'In progress' }]);
  const upcomingPrograms = signal([
    { id: 'program-1', name: 'Active program', description: 'In progress', startDate: null },
    { id: 'program-2', name: 'Available program', description: 'Open now', startDate: null },
  ]);
  const card = (program: { id: string; name: string; description: string }, status: string, isInactive = false) => ({
    program,
    status,
    label: status[0].toUpperCase() + status.slice(1),
    isInactive,
    meta: '',
  });
  const myProgramCards = signal([
    card({ id: 'program-1', name: 'Active program', description: 'In progress' }, 'active'),
    card({ id: 'program-3', name: 'Past program', description: 'Finished' }, 'archived', true),
  ]);
  const explorePrograms = signal([
    card({ id: 'program-2', name: 'Available program', description: 'Open now' }, 'open'),
  ]);
  const getProgramsForUser = jest.fn();
  const getUpcoming = jest.fn();

  beforeEach(() => {
    getProgramsForUser.mockClear();
    getUpcoming.mockClear();

    TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthStore,
          useValue: { user: signal({ firstName: 'Jordan' }), isStaff: signal(false), isAdmin: signal(false) },
        },
        {
          provide: ProgramsStore,
          useValue: {
            usersPrograms,
            upcomingPrograms,
            myProgramCards,
            explorePrograms,
            getProgramsForUser,
            getUpcoming,
          },
        },
      ],
    });
  });

  it('loads participant programs under the Dashboard title', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();

    expect(getProgramsForUser).toHaveBeenCalledTimes(1);
    expect(getUpcoming).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.querySelector('h1').textContent.trim()).toBe('Dashboard');
    expect(fixture.nativeElement.textContent).not.toContain('Stay connected');
  });

  it.each([
    ['participants', false, false],
    ['partner staff', true, false],
    ['admins', true, true],
  ])('leaves section navigation to the header for %s', (_role, isStaff, isAdmin) => {
    TestBed.overrideProvider(AuthStore, {
      useValue: { user: signal({ firstName: 'Jordan' }), isStaff: signal(isStaff), isAdmin: signal(isAdmin) },
    });
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h1').textContent.trim()).toBe('Dashboard');
    expect(fixture.nativeElement.querySelector('nav[aria-label="Main sections"]')).toBeNull();
  });

  it('shows program status pills and the action for each state', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    const myPrograms = element.querySelector('[aria-labelledby="my-programs-heading"]') as HTMLElement;
    const explore = element.querySelector('[aria-labelledby="explore-programs-heading"]') as HTMLElement;

    expect(myPrograms.textContent).toContain('Active');
    expect(myPrograms.textContent).toContain('Archived');
    expect(myPrograms.querySelector('a[aria-label="View program: Past program"]')).not.toBeNull();
    expect(explore.textContent).toContain('Open');
    expect(explore.querySelector('a[aria-label="View and enroll: Available program"]')?.getAttribute('href')).toBe(
      '/enroll/program-2',
    );
    expect(explore.textContent).not.toContain('Active program');
  });

  it.each([false, true])('links program cards without overview cards for staff=%s', (isStaff) => {
    TestBed.overrideProvider(AuthStore, {
      useValue: { user: signal({ firstName: 'Jordan' }), isStaff: signal(isStaff), isAdmin: signal(false) },
    });
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    const link = element.querySelector('[aria-labelledby="my-programs-heading"] article a');

    expect(element.querySelector('[aria-label="Dashboard overview"]')).toBeNull();
    expect(element.textContent).not.toContain('Discussion boards');
    expect(link?.getAttribute('href')).toBe(
      isStaff ? '/partner-staff/programs/program-1/progress' : '/program-profiles/program-1',
    );
  });
});
