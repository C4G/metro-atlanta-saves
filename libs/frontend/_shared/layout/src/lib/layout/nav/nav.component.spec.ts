import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { AuthStore } from '@mas/frontend-shared-auth';
import { MainNavStore, mainSectionsFor, ProgramsStore, ThemeService } from '@mas/frontend-shared-data-access';

import { PushNotificationService } from '../../services/push-notification.service';
import { NavComponent } from './nav.component';

describe('NavComponent', () => {
  const logout = jest.fn();
  const stopMimickingUser = jest.fn();
  const toggleDarkMode = jest.fn();
  const open = jest.fn();
  const getProgramsForUser = jest.fn();
  const program = signal<{ id: string; name: string } | null>(null);
  let fixture: ComponentFixture<NavComponent>;

  const mainNavStore = (isStaff: boolean) => ({
    program,
    sections: signal(mainSectionsFor({ signedIn: true, isStaff, isAdmin: false })),
    switcher: () =>
      program() ? { label: program()?.name, icon: 'school' } : { label: 'Dashboard', icon: 'dashboard' },
  });
  const programCard = (id: string, name: string, isInactive = false) => ({
    program: { id, name },
    isInactive,
  });

  const authStore = (
    overrides: { user?: unknown; isStaff?: boolean; isMimicking?: boolean; roleLabel?: string } = {},
  ) => ({
    user: signal('user' in overrides ? overrides.user : { firstName: 'Jordan', email: 'jordan@example.org' }),
    fullName: signal('Jordan Okafor'),
    initials: signal('JO'),
    roleLabel: signal(overrides.roleLabel ?? 'Participant'),
    isStaff: signal(overrides.isStaff ?? false),
    isMimicking: signal(overrides.isMimicking ?? false),
    logout,
    stopMimickingUser,
  });

  const setup = (store = authStore()) => {
    TestBed.configureTestingModule({
      imports: [NavComponent],
      providers: [
        provideRouter([]),
        { provide: AuthStore, useValue: store },
        { provide: ThemeService, useValue: { darkMode: signal(false), toggleDarkMode } },
        { provide: MatDialog, useValue: { open } },
        { provide: PushNotificationService, useValue: { subscribe: jest.fn() } },
        { provide: MainNavStore, useValue: mainNavStore(store.isStaff()) },
        {
          provide: ProgramsStore,
          useValue: {
            usersPrograms: signal([]),
            myProgramCards: signal([
              programCard('program-1', 'Financial Foundations'),
              programCard('program-2', 'Homebuyer Readiness', true),
            ]),
            getProgramsForUser,
          },
        },
      ],
    });
    fixture = TestBed.createComponent(NavComponent);
    fixture.detectChanges();
  };

  const trigger = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector('button[aria-label="Account menu, Jordan Okafor"]');
  const openMenu = () => {
    trigger().click();
    fixture.detectChanges();
    return document.querySelector<HTMLElement>('[role="menu"][aria-label="Account"]');
  };
  const items = () =>
    Array.from(document.querySelectorAll<HTMLElement>('[role="menu"] [role^="menuitem"]')).map((item) =>
      item.textContent?.replace(/\s+/g, ' ').trim(),
    );

  beforeEach(() => {
    [logout, stopMimickingUser, toggleDarkMode, open, getProgramsForUser].forEach((fn) => fn.mockClear());
    program.set(null);
  });

  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container').forEach((container) => (container.innerHTML = ''));
    TestBed.resetTestingModule();
  });

  it('groups the theme switch and the account trigger in the header', () => {
    setup();
    const theme: HTMLButtonElement = fixture.nativeElement.querySelector('button[aria-label="Use dark mode"]');

    theme.click();

    expect(toggleDarkMode).toHaveBeenCalledTimes(1);
    expect(trigger().textContent).toContain('Jordan Okafor');
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
  });

  it('offers sign in to visitors', () => {
    setup(authStore({ user: null }));

    expect(fixture.nativeElement.querySelector('a[href="/login"]').textContent.trim()).toBe('Sign in');
    expect(trigger()).toBeNull();
  });

  it('opens the account menu with the person, their role and their actions', () => {
    setup();
    const menu = openMenu();

    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    expect(menu?.textContent).toContain('jordan@example.org');
    expect(menu?.textContent).toContain('Participant');
    expect(items()).toEqual([
      expect.stringContaining('Edit profile'),
      expect.stringContaining('Notifications'),
      'logout Log out',
    ]);
  });

  it('lets staff mimic a user', () => {
    setup(authStore({ isStaff: true, roleLabel: 'Admin' }));
    openMenu();

    expect(items()).toContainEqual(expect.stringContaining('Mimic user'));
  });

  it('circles the avatar with the moving ring only while mimicking', () => {
    setup(authStore({ isStaff: true, isMimicking: true }));
    expect(trigger().querySelector('mas-mimic-ring')).not.toBeNull();
    TestBed.resetTestingModule();

    setup(authStore({ isStaff: true }));
    expect(trigger().querySelector('mas-mimic-ring')).toBeNull();
  });

  it('offers a way back while mimicking and logs out from the menu', () => {
    setup(authStore({ isStaff: true, isMimicking: true }));
    openMenu();
    const rows = Array.from(document.querySelectorAll<HTMLElement>('[role="menu"] [role="menuitem"]'));

    rows.find((row) => row.textContent?.includes('Stop mimicking'))?.click();
    expect(stopMimickingUser).toHaveBeenCalledTimes(1);

    openMenu();
    Array.from(document.querySelectorAll<HTMLElement>('[role="menu"] [role="menuitem"]'))
      .find((row) => row.textContent?.includes('Log out'))
      ?.click();
    expect(logout).toHaveBeenCalledTimes(1);
  });

  describe('program switcher', () => {
    const switcher = (): HTMLButtonElement | null =>
      fixture.nativeElement.querySelector('button[aria-controls="site-switcher"]');
    const panel = (): HTMLElement | null => fixture.nativeElement.querySelector('#site-switcher');

    it('names the current section outside a program and the program inside one', () => {
      setup();
      expect(switcher()?.textContent).toContain('Dashboard');

      program.set({ id: 'program-1', name: 'Financial Foundations' });
      fixture.detectChanges();

      expect(switcher()?.textContent).toContain('Financial Foundations');
      expect(switcher()?.getAttribute('aria-expanded')).toBe('false');
    });

    it('unfolds the header with the sections and programs, marking the current program', () => {
      program.set({ id: 'program-1', name: 'Financial Foundations' });
      setup();

      switcher()?.click();
      fixture.detectChanges();

      expect(switcher()?.getAttribute('aria-expanded')).toBe('true');
      expect(getProgramsForUser).toHaveBeenCalledTimes(1);
      const links = Array.from(panel()?.querySelectorAll('a') ?? []).map((link) =>
        link.querySelector('.truncate')?.textContent?.trim(),
      );
      expect(links).toEqual(['Dashboard', 'Discussion', 'Financial Foundations', 'Homebuyer Readiness']);
      expect(panel()?.querySelector('a[aria-current="page"]')?.textContent).toContain('Financial Foundations');
    });

    it('folds away on Escape, returning focus to the switcher, and on outside clicks', () => {
      program.set({ id: 'program-1', name: 'Financial Foundations' });
      setup();
      switcher()?.click();
      fixture.detectChanges();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      fixture.detectChanges();
      expect(panel()).toBeNull();
      expect(document.activeElement).toBe(switcher());

      switcher()?.click();
      fixture.detectChanges();
      document.body.click();
      fixture.detectChanges();
      expect(panel()).toBeNull();
    });

    it('sends staff to the staff workspace for their programs', () => {
      setup(authStore({ isStaff: true, roleLabel: 'Admin' }));
      switcher()?.click();
      fixture.detectChanges();

      expect(panel()?.querySelector('a[href*="program-1"]')?.getAttribute('href')).toBe(
        '/partner-staff/programs/program-1/progress',
      );
    });
  });
});
