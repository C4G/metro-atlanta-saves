import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { AuthStore } from '@mas/frontend-shared-auth';
import { ProgramsStore } from '@mas/frontend-shared-data-access';

import ProgramsComponent from './programs.component';

describe('ProgramsComponent', () => {
  const programs = signal([
    {
      id: 'program-1',
      name: 'Financial Foundations',
      description: '<p>Build practical saving habits.</p>',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-06-01'),
      isTemplate: false,
    },
    {
      id: 'program-2',
      name: 'Career Growth',
      description: '<p>Plan your next professional step.</p>',
      startDate: null,
      endDate: null,
      isTemplate: true,
    },
  ]);
  const getPrograms = jest.fn();
  const searchPrograms = jest.fn();
  const open = jest.fn();

  beforeEach(() => {
    getPrograms.mockClear();
    searchPrograms.mockClear();
    open.mockClear();

    TestBed.configureTestingModule({
      imports: [ProgramsComponent],
      providers: [
        provideRouter([]),
        { provide: AuthStore, useValue: { user: signal({ partnerId: 'partner-1' }) } },
        {
          provide: ProgramsStore,
          useValue: {
            cloneProgram: jest.fn(),
            deleteProgram: jest.fn(),
            getPrograms,
            programs,
            searchPrograms,
          },
        },
        { provide: MatDialog, useValue: { open } },
      ],
    });
  });

  it('loads programs for the signed-in partner and presents accessible cards', () => {
    const fixture = TestBed.createComponent(ProgramsComponent);
    fixture.detectChanges();

    expect(getPrograms).toHaveBeenCalledWith('partner-1');
    expect(fixture.componentInstance.programCards()).toHaveLength(2);
    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Programs');
    expect(fixture.nativeElement.querySelectorAll('article')).toHaveLength(2);
  });

  it('requests filtered programs from the server', () => {
    const fixture = TestBed.createComponent(ProgramsComponent);
    const input = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    input.value = ' saving habits ';
    input.dispatchEvent(new Event('input'));

    expect(fixture.componentInstance.searchQuery()).toBe(' saving habits ');
    expect(searchPrograms).toHaveBeenCalledWith({ partnerId: 'partner-1', search: ' saving habits ' });
  });

  it('opens the create flow with responsive dialog dimensions', () => {
    const fixture = TestBed.createComponent(ProgramsComponent);
    fixture.componentInstance.openCreateDialog();

    expect(open).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ maxWidth: 'calc(100vw - 2rem)', width: '44rem' }),
    );
  });
});
