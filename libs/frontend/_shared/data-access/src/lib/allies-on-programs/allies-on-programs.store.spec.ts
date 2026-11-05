import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AlliesOnProgramsStore } from './allies-on-programs.store';

describe('Ally assignments', () => {
  it('saves program assignments once, supports retry after failure, and updates the roster', () => {
    const closeAll = jest.fn();
    TestBed.configureTestingModule({
      providers: [
        AlliesOnProgramsStore,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialog, useValue: { closeAll } },
        { provide: MatSnackBar, useValue: { open: jest.fn() } },
      ],
    });
    const store = TestBed.inject(AlliesOnProgramsStore);
    const http = TestBed.inject(HttpTestingController);
    store.setProgramId('program-1');
    store.addAlly({ userId: 'ally-1' });
    store.addAlly({ userId: 'ally-1' });
    expect(store.assignmentSaving()).toBe(true);
    const failed = http.expectOne('/api/allies-on-programs');
    expect(failed.request.body).toEqual({ userId: 'ally-1', programId: 'program-1' });
    failed.flush({}, { status: 500, statusText: 'Error' });
    expect(store.assignmentSaving()).toBe(false);
    expect(closeAll).not.toHaveBeenCalled();
    expect(store.allies()).toEqual([]);
    store.addAlly({ userId: 'ally-1' });
    http
      .expectOne('/api/allies-on-programs')
      .flush({ id: 'ally-1', firstName: 'Sam', lastName: 'Lee', email: 'sam@example.com', bio: null, lastLogin: null });
    expect(store.assignmentSaving()).toBe(false);
    expect(store.allies()[0].userId).toBe('ally-1');
    expect(closeAll).toHaveBeenCalledTimes(1);
    http.verify();
    TestBed.resetTestingModule();
  });
});
