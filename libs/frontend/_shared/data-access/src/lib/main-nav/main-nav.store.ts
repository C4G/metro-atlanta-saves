import { isPlatformBrowser } from '@angular/common';
import { computed, inject, PLATFORM_ID } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { AuthStore } from '@mas/frontend-shared-auth';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { filter, map } from 'rxjs';

export type MainSection = {
  key:
    | 'dashboard'
    | 'discussion'
    | 'programs'
    | 'insights'
    | 'admin'
    | 'progress'
    | 'program-insights'
    | 'participants'
    | 'review'
    | 'staff-insights'
    | 'manage';
  label: string;
  icon: string;
  link: string | null;
  exact: boolean;
};

export type MainSectionAccess = {
  signedIn: boolean;
  isStaff: boolean;
  isAdmin: boolean;
};

export type ProgramContext = {
  id: string;
  name: string;
  workspace?: boolean;
};

type MainNavState = {
  dockHidden: boolean;
  program: ProgramContext | null;
};

const initialState: MainNavState = {
  dockHidden: false,
  program: null,
};

export const DOCK_HIDDEN_STORAGE_KEY = 'mas-dock-hidden';

const EVERYONE_SECTIONS: MainSection[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard', link: '/dashboard', exact: true },
  { key: 'discussion', label: 'Discussion', icon: 'forum', link: '/discussion-boards', exact: false },
];

const STAFF_SECTIONS: MainSection[] = [
  { key: 'programs', label: 'Programs', icon: 'folder_managed', link: '/partner-staff/programs', exact: false },
];

const ADMIN_SECTIONS: MainSection[] = [
  { key: 'insights', label: 'Insights', icon: 'insights', link: null, exact: false },
  { key: 'admin', label: 'Admin', icon: 'admin_panel_settings', link: '/admin', exact: false },
];

export const mainSectionsFor = ({ signedIn, isStaff, isAdmin }: MainSectionAccess): MainSection[] => {
  if (!signedIn) return [];
  return [...EVERYONE_SECTIONS, ...(isStaff ? STAFF_SECTIONS : []), ...(isAdmin ? ADMIN_SECTIONS : [])];
};

export const staffWorkspacePagesFor = (programId: string): MainSection[] => {
  const base = `/partner-staff/programs/${programId}`;
  return [
    { key: 'review', label: 'Tasks review', icon: 'table_chart', link: `${base}/progress`, exact: false },
    { key: 'staff-insights', label: 'Insights', icon: 'insights', link: `${base}/insights`, exact: false },
    { key: 'manage', label: 'Manage program', icon: 'tune', link: `${base}/manage`, exact: false },
  ];
};

export const programPagesFor = (programId: string, isStaff: boolean): MainSection[] => {
  const base = `/program-profiles/${programId}`;
  const participants: MainSection = {
    key: 'participants',
    label: 'Participants',
    icon: 'groups',
    link: `${base}/particpants`,
    exact: false,
  };
  if (isStaff) return [participants];
  return [
    { key: 'progress', label: 'My progress', icon: 'trending_up', link: `${base}/progress`, exact: false },
    { key: 'program-insights', label: 'My insights', icon: 'insights', link: `${base}/insights`, exact: false },
    participants,
  ];
};

export type SwitcherLabel = {
  label: string;
  icon: string;
};

export const switcherLabelFor = (
  signedIn: boolean,
  program: ProgramContext | null,
  section: MainSection | null,
): SwitcherLabel | null => {
  if (!signedIn) return null;
  if (program) return { label: program.name, icon: 'school' };
  if (section) return { label: section.label, icon: section.icon };
  return { label: 'Go to', icon: 'apps' };
};

export const DOCK_LABELS: Partial<Record<MainSection['key'], string>> = {
  progress: 'Progress',
  'program-insights': 'Insights',
  review: 'Tasks',
  'staff-insights': 'Insights',
  manage: 'Manage',
};

export const sectionForUrl = (sections: MainSection[], url: string): MainSection | null => {
  const path = url.split(/[?#]/)[0];
  return (
    sections.find(
      ({ link, exact }) => !!link && (exact ? path === link : path === link || path.startsWith(`${link}/`)),
    ) ?? null
  );
};

const readDockHidden = (): boolean => {
  try {
    return localStorage.getItem(DOCK_HIDDEN_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

const writeDockHidden = (hidden: boolean) => {
  try {
    if (hidden) {
      localStorage.setItem(DOCK_HIDDEN_STORAGE_KEY, 'true');
    } else {
      localStorage.removeItem(DOCK_HIDDEN_STORAGE_KEY);
    }
  } catch {
    return;
  }
};

export const MainNavStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => {
    const authStore = inject(AuthStore);
    const router = inject(Router);
    const url = toSignal(
      router.events.pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        map((event) => event.urlAfterRedirects),
      ),
      { initialValue: router.url },
    );
    const sections = computed<MainSection[]>(() =>
      mainSectionsFor({
        signedIn: !!authStore.user(),
        isStaff: authStore.isStaff(),
        isAdmin: authStore.isAdmin(),
      }),
    );
    const programPages = computed<MainSection[]>(() => {
      const program = store.program();
      if (!program) return [];
      return program.workspace ? staffWorkspacePagesFor(program.id) : programPagesFor(program.id, authStore.isStaff());
    });
    const dockItems = computed<MainSection[]>(() =>
      programPages().length > 1
        ? programPages().map((page) => ({ ...page, label: DOCK_LABELS[page.key] ?? page.label }))
        : sections(),
    );
    const currentSection = computed<MainSection | null>(() => sectionForUrl(sections(), url()));
    return {
      sections,
      currentSection,
      programPages,
      currentProgramPage: computed<MainSection | null>(() => sectionForUrl(programPages(), url())),
      switcher: computed(() => switcherLabelFor(!!authStore.user(), store.program(), currentSection())),
      dockItems,
      currentDockItem: computed<MainSection | null>(() => sectionForUrl(dockItems(), url())),
    };
  }),
  withMethods((store, platformId = inject(PLATFORM_ID)) => {
    const setDockHidden = (dockHidden: boolean) => {
      patchState(store, { dockHidden });
      if (isPlatformBrowser(platformId)) writeDockHidden(dockHidden);
    };
    return {
      hideDock: () => setDockHidden(true),
      showDock: () => setDockHidden(false),
      enterProgram: (program: ProgramContext) => patchState(store, { program }),
      leaveProgram: () => patchState(store, { program: null }),
    };
  }),
  withHooks({
    onInit(store, platformId = inject(PLATFORM_ID)) {
      if (isPlatformBrowser(platformId)) patchState(store, { dockHidden: readDockHidden() });
    },
  }),
);
