import { HttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthStore } from '@mas/frontend-shared-auth';
import { ProgramsStore } from '@mas/frontend-shared-data-access';
import { of } from 'rxjs';

import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  const usersPrograms = signal([{ id: 'program-1', name: 'Active program', description: 'In progress' }]);
  const upcomingPrograms = signal([
    { id: 'program-1', name: 'Active program', description: 'In progress', startDate: null },
    { id: 'program-2', name: 'Available program', description: 'Open now', startDate: null },
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
          useValue: { user: signal({ firstName: 'Jordan' }) },
        },
        {
          provide: ProgramsStore,
          useValue: { usersPrograms, upcomingPrograms, getProgramsForUser, getUpcoming },
        },
        {
          provide: HttpClient,
          useValue: {
            get: jest.fn(() =>
              of([
                {
                  id: 'board-1',
                  name: 'Community board',
                  description: 'Connect with peers',
                  memberCount: 8,
                  postCount: 3,
                },
              ]),
            ),
          },
        },
      ],
    });
  });

  it('loads participant programs and discussion boards', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();

    expect(getProgramsForUser).toHaveBeenCalledTimes(1);
    expect(getUpcoming).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.firstName()).toBe('Jordan');
    expect(fixture.componentInstance.boards()).toHaveLength(1);
    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Welcome back, Jordan.');
  });

  it('does not offer programs in which the participant is already enrolled', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.availablePrograms().map((program) => program.id)).toEqual(['program-2']);
  });
});
