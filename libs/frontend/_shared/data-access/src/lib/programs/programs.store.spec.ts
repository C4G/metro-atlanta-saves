import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';
import { ProgramsStore } from './programs.store';

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
