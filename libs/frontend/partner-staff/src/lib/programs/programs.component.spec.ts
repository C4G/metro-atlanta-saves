import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { AuthStore } from '@mas/frontend-shared-auth';
import { ProgramsStore } from '@mas/frontend-shared-data-access';

import ProgramsComponent from './programs.component';

describe('ProgramsComponent', () => {
  const program = (id: string, name: string, isTemplate = false) => ({
    id,
    name,
    description: `<p>${name} description</p>`,
    isTemplate,
    startDate: null,
    endDate: null,
  });
  const card = (
    entry: ReturnType<typeof program>,
    label: string,
    flags: { isInactive?: boolean; isTemplate?: boolean } = {},
  ) => ({
    program: entry,
    label,
    meta: 'Jan 1, 2026 – Jun 1, 2026',
    isInactive: flags.isInactive ?? false,
    isTemplate: flags.isTemplate ?? false,
  });
  const group = (key: string, title: string, cards: ReturnType<typeof card>[], query = '') => ({
    key,
    title,
    emptyText: `No ${title.toLowerCase()}.`,
    query,
    total: cards.length,
    cards,
  });
  const directoryGroups = signal([
    group('active', 'Active programs', [card(program('program-1', 'Financial Foundations'), 'Active')]),
    group('upcoming', 'Upcoming programs', []),
    group('inactive', 'Inactive programs', [
      card(program('program-3', 'Homebuyer Basics'), 'Archived', { isInactive: true }),
    ]),
    group('template', 'Templates', [
      card(program('program-2', 'Career Growth', true), 'Template', { isTemplate: true }),
    ]),
  ]);
  const getPrograms = jest.fn();
  const setDirectoryQuery = jest.fn();
  const clearDirectoryQueries = jest.fn();
  const open = jest.fn();

  beforeEach(() => {
    [getPrograms, setDirectoryQuery, clearDirectoryQueries, open].forEach((fn) => fn.mockClear());

    TestBed.configureTestingModule({
      imports: [ProgramsComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthStore,
          useValue: { user: signal({ partnerId: 'partner-1' }), isStaff: signal(true), isAdmin: signal(false) },
        },
        {
          provide: ProgramsStore,
          useValue: {
            cloneProgram: jest.fn(),
            deleteProgram: jest.fn(),
            clearDirectoryQueries,
            directoryGroups,
            getPrograms,
            setDirectoryQuery,
          },
        },
        { provide: MatDialog, useValue: { open } },
      ],
    });
  });

  const panels = (fixture: { nativeElement: HTMLElement }) =>
    Array.from(fixture.nativeElement.querySelectorAll<HTMLElement>('mas-section-panel'));

  it('loads the partner programs into active, upcoming, inactive and template panels', () => {
    const fixture = TestBed.createComponent(ProgramsComponent);
    fixture.detectChanges();

    expect(clearDirectoryQueries).toHaveBeenCalledTimes(1);
    expect(getPrograms).toHaveBeenCalledWith('partner-1');
    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Programs');
    expect(panels(fixture).map((panel) => panel.querySelector('h2')?.textContent?.trim())).toEqual([
      'Active programs',
      'Upcoming programs',
      'Inactive programs',
      'Templates',
    ]);
    expect(panels(fixture)[1].textContent).toContain('No upcoming programs.');
  });

  it('puts New program only in the active panel and a search in every panel', () => {
    const fixture = TestBed.createComponent(ProgramsComponent);
    fixture.detectChanges();

    expect(panels(fixture).map((panel) => panel.querySelectorAll('input[type="search"]').length)).toEqual([1, 1, 1, 1]);
    expect(panels(fixture).map((panel) => !!panel.querySelector('button[aria-label="New program"]'))).toEqual([
      true,
      false,
      false,
      false,
    ]);
    expect(panels(fixture)[2].querySelector('input')?.getAttribute('placeholder')).toBe('Search inactive programs');
  });

  it('searches the panel being typed in', () => {
    const fixture = TestBed.createComponent(ProgramsComponent);
    fixture.detectChanges();
    const input = panels(fixture)[3].querySelector('input') as HTMLInputElement;
    input.value = 'career';
    input.dispatchEvent(new Event('input'));

    expect(setDirectoryQuery).toHaveBeenCalledWith('template', 'career');
  });

  it('opens programs from their cards and offers Clone only on templates', () => {
    const fixture = TestBed.createComponent(ProgramsComponent);
    fixture.detectChanges();
    const [active, , inactive, templates] = panels(fixture);

    expect(active.querySelector('a')?.getAttribute('href')).toBe('/partner-staff/programs/program-1/progress');
    expect(active.textContent).toContain('Active');
    expect(inactive.querySelector('article')?.className).toContain('border-dashed');
    expect(templates.querySelector('button[aria-label="Clone Career Growth"]')).not.toBeNull();
    expect(active.querySelector('button[aria-label^="Clone"]')).toBeNull();
    expect(active.querySelector('button[aria-label="More actions for Financial Foundations"]')).not.toBeNull();
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
