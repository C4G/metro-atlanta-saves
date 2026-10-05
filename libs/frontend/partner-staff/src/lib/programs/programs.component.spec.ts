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
  const open = jest.fn();

  beforeEach(() => {
    getPrograms.mockClear();
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

  it('filters programs using normalized names and descriptions', () => {
    const fixture = TestBed.createComponent(ProgramsComponent);
    fixture.componentInstance.searchQuery.set('saving habits');
    fixture.detectChanges();

    expect(fixture.componentInstance.programCards().map((program) => program.id)).toEqual(['program-1']);
    expect(fixture.componentInstance.programCards()[0].descriptionText).toBe('Build practical saving habits.');
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
