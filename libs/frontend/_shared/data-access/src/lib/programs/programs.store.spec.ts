import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';
import {
  directoryMeta,
  directorySectionFor,
  joinedProgramStatus,
  matchesDirectoryQuery,
  ProgramsStore,
  upcomingProgramStatus,
} from './programs.store';

describe('ProgramsStore inline editing', () => {
  const closeAll = jest.fn();
  let store: InstanceType<typeof ProgramsStore>;
  let http: HttpTestingController;
  beforeEach(() => {
    jest.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        ProgramsStore,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: MatDialog, useValue: { closeAll } },
        { provide: MatSnackBar, useValue: { open: jest.fn() } },
      ],
    });
    store = TestBed.inject(ProgramsStore);
    http = TestBed.inject(HttpTestingController);
    store.getProgram('program-1');
    http
      .expectOne('/api/programs/program-1')
      .flush({ id: 'program-1', name: 'Pilot', checkpointNames: [{ name: 'Month 1' }] });
  });
  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });

  it('refreshes the open program without closing dialogs or sending UI options to the API', () => {
    store.patchProgram({ id: 'program-1', name: 'Updated', keepOpen: true });
    store.patchProgram({ id: 'program-1', name: 'Duplicate', keepOpen: true });
    expect(store.programSaving()).toBe(true);
    const request = http.expectOne('/api/programs/program-1');
    expect(request.request.body).toEqual({ id: 'program-1', name: 'Updated' });
    request.flush({ id: 'program-1', name: 'Updated', checkpointNames: [{ name: 'Month 1' }] });
    expect(store.program()?.name).toBe('Updated');
    expect(store.programSaving()).toBe(false);
    expect(closeAll).not.toHaveBeenCalled();
  });

  it('preserves the saved program after an error and permits retry', () => {
    store.patchProgram({ id: 'program-1', name: 'Updated', keepOpen: true });
    http.expectOne('/api/programs/program-1').flush({}, { status: 500, statusText: 'Server error' });
    expect(store.program()?.name).toBe('Pilot');
    expect(store.programSaving()).toBe(false);
    store.patchProgram({ id: 'program-1', name: 'Updated', keepOpen: true });
    http.expectOne('/api/programs/program-1').flush({ id: 'program-1', name: 'Updated' });
    expect(store.program()?.name).toBe('Updated');
  });

  it('retains the existing close-on-save behavior for dialog editing', () => {
    store.patchProgram({ id: 'program-1', name: 'Updated' });
    http.expectOne('/api/programs/program-1').flush({ id: 'program-1', name: 'Updated' });
    expect(closeAll).toHaveBeenCalledTimes(1);
  });
});

describe('ProgramsStore dashboard cards', () => {
  const now = new Date('2026-11-01T12:00:00Z');
  const daysFrom = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
  let store: InstanceType<typeof ProgramsStore>;
  let http: HttpTestingController;

  beforeEach(() => {
    jest.useFakeTimers({ now, doNotFake: ['queueMicrotask', 'nextTick'] });
    TestBed.configureTestingModule({
      providers: [
        ProgramsStore,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: MatDialog, useValue: { closeAll: jest.fn() } },
        { provide: MatSnackBar, useValue: { open: jest.fn() } },
      ],
    });
    store = TestBed.inject(ProgramsStore);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    http.verify();
    jest.useRealTimers();
    TestBed.resetTestingModule();
  });

  it('marks joined programs archived once they end and upcoming ones closed once they start', () => {
    expect(joinedProgramStatus({ endDate: null }, now)).toBe('active');
    expect(joinedProgramStatus({ endDate: new Date(daysFrom(1)) }, now)).toBe('active');
    expect(joinedProgramStatus({ endDate: new Date(daysFrom(-1)) }, now)).toBe('archived');
    expect(upcomingProgramStatus({ startDate: new Date(daysFrom(10)) }, now)).toBe('open');
    expect(upcomingProgramStatus({ startDate: new Date(daysFrom(-1)) }, now)).toBe('closed');
  });

  it('lists my programs with archived ones last and explore programs without the ones I joined', () => {
    store.getProgramsForUser();
    http.expectOne('/api/programs/user/programs').flush([
      { id: 'old', name: 'Fall Savings Cohort', endDate: daysFrom(-62) },
      { id: 'pilot', name: 'Pilot', endDate: daysFrom(90) },
    ]);
    store.getUpcoming();
    http.expectOne('/api/programs/upcoming').flush([
      { id: 'pilot', name: 'Pilot', startDate: daysFrom(5) },
      { id: 'spring', name: 'Spring Savings Cohort', startDate: daysFrom(92) },
    ]);

    expect(store.myProgramCards().map(({ program, label, isInactive }) => [program.id, label, isInactive])).toEqual([
      ['pilot', 'Active', false],
      ['old', 'Archived', true],
    ]);
    expect(store.myProgramCards()[1].meta).toMatch(/^Ended Aug 3[01]$/);
    expect(store.explorePrograms().map(({ program, label }) => [program.id, label])).toEqual([['spring', 'Open']]);
    expect(store.explorePrograms()[0].meta).toMatch(/^Starts Feb [12]$/);
  });

  it('sorts staff programs into active, upcoming, inactive and template sections', () => {
    const at = (days: number) => new Date(daysFrom(days));
    expect(directorySectionFor({ isTemplate: true, startDate: at(-10), endDate: at(-1) }, now)).toBe('template');
    expect(directorySectionFor({ isTemplate: false, startDate: at(-10), endDate: at(-1) }, now)).toBe('inactive');
    expect(directorySectionFor({ isTemplate: false, startDate: at(5), endDate: at(90) }, now)).toBe('upcoming');
    expect(directorySectionFor({ isTemplate: false, startDate: at(-5), endDate: at(90) }, now)).toBe('active');
    expect(directorySectionFor({ isTemplate: false, startDate: null, endDate: null }, now)).toBe('active');
  });

  it('describes program dates for each section', () => {
    const start = new Date('2027-02-01T12:00:00Z');
    const end = new Date('2027-07-31T12:00:00Z');
    expect(directoryMeta({ startDate: start, endDate: end }, 'upcoming', 'en-US')).toBe('Feb 1, 2027 – Jul 31, 2027');
    expect(directoryMeta({ startDate: start, endDate: null }, 'upcoming', 'en-US')).toBe('Starts Feb 1, 2027');
    expect(directoryMeta({ startDate: start, endDate: null }, 'active', 'en-US')).toBe('Started Feb 1, 2027');
    expect(directoryMeta({ startDate: start, endDate: end }, 'inactive', 'en-US')).toBe('Ended Jul 31, 2027');
    expect(directoryMeta({ startDate: null, endDate: null }, 'template', 'en-US')).toBe('Dates are set when cloned');
    expect(directoryMeta({ startDate: null, endDate: null }, 'active', 'en-US')).toBe('Dates to be set');
  });

  it('matches searches against the name and the description text only', () => {
    const program = { name: 'Pilot', description: '<p>Build <strong>saving</strong> habits</p>' };
    expect(matchesDirectoryQuery(program, '  ')).toBe(true);
    expect(matchesDirectoryQuery(program, 'PILOT')).toBe(true);
    expect(matchesDirectoryQuery(program, 'saving')).toBe(true);
    expect(matchesDirectoryQuery(program, 'strong')).toBe(false);
  });

  it('groups the directory and searches each section on its own', () => {
    store.getPrograms('partner-1');
    http.expectOne('/api/programs/partner/partner-1').flush([
      {
        id: 'pilot',
        name: 'Pilot',
        description: 'Monthly tracking',
        isTemplate: false,
        startDate: daysFrom(-30),
        endDate: daysFrom(90),
      },
      {
        id: 'coach',
        name: 'Coaching',
        description: '',
        isTemplate: false,
        startDate: daysFrom(-60),
        endDate: daysFrom(30),
      },
      {
        id: 'spring',
        name: 'Spring Savings Cohort',
        description: '',
        isTemplate: false,
        startDate: daysFrom(92),
        endDate: null,
      },
      {
        id: 'old',
        name: 'Homebuyer Basics',
        description: '',
        isTemplate: false,
        startDate: daysFrom(-200),
        endDate: daysFrom(-70),
      },
      { id: 'default', name: 'DEFAULT', description: '', isTemplate: true, startDate: null, endDate: null },
    ]);

    const summary = () =>
      store.directoryGroups().map(({ key, total, cards }) => [key, total, cards.map(({ program }) => program.id)]);
    expect(summary()).toEqual([
      ['active', 2, ['coach', 'pilot']],
      ['upcoming', 1, ['spring']],
      ['inactive', 1, ['old']],
      ['template', 1, ['default']],
    ]);
    expect(store.directoryGroups()[2].cards[0]).toEqual(
      expect.objectContaining({ label: 'Archived', isInactive: true, isTemplate: false }),
    );

    store.setDirectoryQuery('active', 'monthly');
    expect(summary()[0]).toEqual(['active', 2, ['pilot']]);
    expect(summary()[1]).toEqual(['upcoming', 1, ['spring']]);
    expect(store.directoryGroups()[0].query).toBe('monthly');

    store.clearDirectoryQueries();
    expect(summary()[0]).toEqual(['active', 2, ['coach', 'pilot']]);
  });
});
