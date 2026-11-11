import { PLATFORM_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthStore } from '@mas/frontend-shared-auth';

import {
  DOCK_HIDDEN_STORAGE_KEY,
  MainNavStore,
  mainSectionsFor,
  programPagesFor,
  sectionForUrl,
  switcherLabelFor,
} from './main-nav.store';

describe('MainNavStore', () => {
  const labels = (access: Parameters<typeof mainSectionsFor>[0]) => mainSectionsFor(access).map(({ label }) => label);

  describe('mainSectionsFor', () => {
    it('gives signed-out visitors no sections', () => {
      expect(mainSectionsFor({ signedIn: false, isStaff: true, isAdmin: true })).toEqual([]);
    });

    it.each([
      ['participants', false, false, ['Dashboard', 'Discussion']],
      ['partner staff', true, false, ['Dashboard', 'Discussion', 'Programs']],
      ['admins', true, true, ['Dashboard', 'Discussion', 'Programs', 'Insights', 'Admin']],
    ])('gives %s their sections in order', (_role, isStaff, isAdmin, expected) => {
      expect(labels({ signedIn: true, isStaff, isAdmin })).toEqual(expected);
    });

    it('keeps Insights unlinked for now', () => {
      const insights = mainSectionsFor({ signedIn: true, isStaff: true, isAdmin: true }).find(
        ({ key }) => key === 'insights',
      );

      expect(insights?.link).toBeNull();
    });
  });

  describe('sectionForUrl', () => {
    const sections = mainSectionsFor({ signedIn: true, isStaff: true, isAdmin: true });

    it.each([
      ['/dashboard', 'Dashboard'],
      ['/dashboard?view=month', 'Dashboard'],
      ['/discussion-boards/board-1', 'Discussion'],
      ['/partner-staff/programs/program-1/progress', 'Programs'],
      ['/admin/email-campaign', 'Admin'],
    ])('matches %s to %s', (url, label) => {
      expect(sectionForUrl(sections, url)?.label).toBe(label);
    });

    it.each(['/profile', '/dashboard/other', '/administrator'])('matches no section for %s', (url) => {
      expect(sectionForUrl(sections, url)).toBeNull();
    });
  });

  describe('programPagesFor', () => {
    it('gives participants their progress, insights and the roster', () => {
      expect(programPagesFor('program-1', false).map(({ label, link }) => [label, link])).toEqual([
        ['My progress', '/program-profiles/program-1/progress'],
        ['My insights', '/program-profiles/program-1/insights'],
        ['Participants', '/program-profiles/program-1/particpants'],
      ]);
    });

    it('only gives staff the roster', () => {
      expect(programPagesFor('program-1', true).map(({ label }) => label)).toEqual(['Participants']);
    });
  });

  describe('switcherLabelFor', () => {
    const dashboard = mainSectionsFor({ signedIn: true, isStaff: false, isAdmin: false })[0];

    it('hides the switcher from visitors', () => {
      expect(switcherLabelFor(false, null, dashboard)).toBeNull();
    });

    it('names the open program first, then the section, then a plain fallback', () => {
      expect(switcherLabelFor(true, { id: 'p', name: 'Pilot' }, dashboard)).toEqual({ label: 'Pilot', icon: 'school' });
      expect(switcherLabelFor(true, null, dashboard)).toEqual({ label: 'Dashboard', icon: 'dashboard' });
      expect(switcherLabelFor(true, null, null)).toEqual({ label: 'Go to', icon: 'apps' });
    });
  });

  describe('dock visibility', () => {
    const setup = (isStaff = false) => {
      TestBed.configureTestingModule({
        providers: [
          provideRouter([]),
          { provide: PLATFORM_ID, useValue: 'browser' },
          {
            provide: AuthStore,
            useValue: { user: signal({ id: 'user-1' }), isStaff: signal(isStaff), isAdmin: signal(false) },
          },
        ],
      });
      return TestBed.inject(MainNavStore);
    };

    afterEach(() => {
      localStorage.clear();
      TestBed.resetTestingModule();
    });

    it('starts visible and remembers when it is hidden', () => {
      const store = setup();
      expect(store.dockHidden()).toBe(false);

      store.hideDock();

      expect(store.dockHidden()).toBe(true);
      expect(localStorage.getItem(DOCK_HIDDEN_STORAGE_KEY)).toBe('true');
    });

    it('restores the hidden dock on the next visit and clears it when shown', () => {
      localStorage.setItem(DOCK_HIDDEN_STORAGE_KEY, 'true');
      const store = setup();
      expect(store.dockHidden()).toBe(true);

      store.showDock();

      expect(store.dockHidden()).toBe(false);
      expect(localStorage.getItem(DOCK_HIDDEN_STORAGE_KEY)).toBeNull();
    });

    it('projects the signed-in sections', () => {
      expect(
        setup()
          .sections()
          .map(({ label }) => label),
      ).toEqual(['Dashboard', 'Discussion']);
    });

    it('swaps the dock to the program pages inside a participant program and back when leaving', () => {
      const store = setup();
      store.enterProgram({ id: 'program-1', name: 'Pilot' });

      expect(store.switcher()).toEqual({ label: 'Pilot', icon: 'school' });
      expect(store.dockItems().map(({ label }) => label)).toEqual(['Progress', 'Insights', 'Participants']);

      store.leaveProgram();

      expect(store.switcher()).toEqual({ label: 'Go to', icon: 'apps' });
      expect(store.dockItems().map(({ label }) => label)).toEqual(['Dashboard', 'Discussion']);
    });

    it('keeps the main sections in the dock for staff inside a program', () => {
      const store = setup(true);
      store.enterProgram({ id: 'program-1', name: 'Pilot' });

      expect(store.switcher()?.label).toBe('Pilot');
      expect(store.programPages().map(({ label }) => label)).toEqual(['Participants']);
      expect(store.dockItems().map(({ label }) => label)).toEqual(['Dashboard', 'Discussion', 'Programs']);
    });

    it('gives staff the workspace pages and dock inside a program they run', () => {
      const store = setup(true);
      store.enterProgram({ id: 'program-1', name: 'Pilot', workspace: true });

      expect(store.programPages().map(({ label, link }) => [label, link])).toEqual([
        ['Tasks review', '/partner-staff/programs/program-1/progress'],
        ['Insights', '/partner-staff/programs/program-1/insights'],
        ['Manage program', '/partner-staff/programs/program-1/manage'],
      ]);
      expect(store.dockItems().map(({ label }) => label)).toEqual(['Tasks', 'Insights', 'Manage']);
    });
  });
});
