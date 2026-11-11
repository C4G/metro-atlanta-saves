import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MainNavStore, mainSectionsFor } from '@mas/frontend-shared-data-access';

import { DOCK_SWIPE_DISTANCE, MainDockComponent } from './main-dock.component';

describe('MainDockComponent', () => {
  const sections = signal(mainSectionsFor({ signedIn: true, isStaff: true, isAdmin: true }));
  const dockHidden = signal(false);
  const hideDock = jest.fn(() => dockHidden.set(true));
  const showDock = jest.fn(() => dockHidden.set(false));
  let fixture: ComponentFixture<MainDockComponent>;

  const dock = (): HTMLElement => fixture.nativeElement.querySelector('nav[aria-label="Main sections"]');
  const restore = (): HTMLButtonElement => fixture.nativeElement.querySelector('button[aria-expanded="false"]');
  const pointer = (type: string, clientY: number) => {
    const event = new MouseEvent(type, { bubbles: true, clientY }) as PointerEvent;
    Object.defineProperty(event, 'pointerId', { value: 1 });
    dock().dispatchEvent(event);
  };

  beforeEach(() => {
    dockHidden.set(false);
    hideDock.mockClear();
    showDock.mockClear();
    TestBed.configureTestingModule({
      imports: [MainDockComponent],
      providers: [
        provideRouter([]),
        {
          provide: MainNavStore,
          useValue: {
            dockItems: sections,
            programPages: signal([]),
            dockHidden,
            currentDockItem: signal(sections()[0]),
            hideDock,
            showDock,
          },
        },
      ],
    });
    fixture = TestBed.createComponent(MainDockComponent);
    fixture.detectChanges();
  });

  it('shows every section for the role in the dock', () => {
    const labels = Array.from(dock().querySelectorAll('a, button:not([aria-controls])')).map((item) =>
      item.lastElementChild?.textContent?.trim(),
    );

    expect(labels).toEqual(['Dashboard', 'Discussion', 'Programs', 'Insights', 'Admin']);
  });

  it('hides the dock when the grab bar is tapped and brings it back from the chip', () => {
    fixture.nativeElement.querySelector('button[aria-label="Hide navigation"]').click();
    fixture.detectChanges();

    expect(hideDock).toHaveBeenCalledTimes(1);
    expect(dock().inert).toBe(true);
    expect(restore().inert).toBe(false);
    expect(restore().getAttribute('aria-label')).toBe('Show navigation, current page Dashboard');

    restore().click();
    fixture.detectChanges();

    expect(showDock).toHaveBeenCalledTimes(1);
    expect(dock().inert).toBe(false);
  });

  it('hides the dock after a swipe down', () => {
    pointer('pointerdown', 700);
    pointer('pointermove', 720);
    fixture.detectChanges();
    expect(dock().style.transform).toBe('translateY(20px)');

    pointer('pointerup', 700 + DOCK_SWIPE_DISTANCE + 4);

    expect(hideDock).toHaveBeenCalledTimes(1);
  });

  it('springs back after a short pull', () => {
    pointer('pointerdown', 700);
    pointer('pointermove', 712);
    pointer('pointerup', 712);
    fixture.detectChanges();

    expect(hideDock).not.toHaveBeenCalled();
    expect(dock().style.transform).toBe('');
  });
});
