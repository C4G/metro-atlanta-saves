import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MainNavStore } from '@mas/frontend-shared-data-access';

export const DOCK_SWIPE_DISTANCE = 36;
const DRAG_START_DISTANCE = 6;

type DockDrag = { startY: number; pointerId: number; moving: boolean };

@Component({
  selector: 'mas-main-dock',
  imports: [MatIcon, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (mainNavStore.dockItems().length) {
      <div class="h-24" aria-hidden="true"></div>

      <nav
        id="main-dock"
        class="fixed inset-x-3 bottom-3 z-40 flex touch-none justify-around gap-0.5 rounded-xl border border-brand/25 bg-surface-raised/85 px-1 pb-1 pt-4 shadow-lg backdrop-blur-md backdrop-saturate-150 transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none"
        [class]="dockStateClass()"
        [style.transform]="dragTransform()"
        [style.opacity]="dragOpacity()"
        [inert]="mainNavStore.dockHidden()"
        [attr.aria-label]="dockLabel()"
        (pointerdown)="startDrag($event)"
        (pointermove)="moveDrag($event)"
        (pointerup)="endDrag($event)"
        (pointercancel)="cancelDrag()"
        (dragstart)="$event.preventDefault()"
      >
        <button
          #grabButton
          type="button"
          class="group absolute left-1/2 top-0 flex h-4 w-20 -translate-x-1/2 cursor-grab items-center justify-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
          aria-label="Hide navigation"
          aria-controls="main-dock"
          aria-expanded="true"
          (click)="hide()"
        >
          <span
            class="h-1 w-9 rounded-full bg-ink-muted/45 transition-all group-hover:w-11 group-hover:bg-brand/70 group-focus-visible:w-11 group-focus-visible:bg-brand/70"
          ></span>
        </button>

        @for (section of mainNavStore.dockItems(); track section.key) {
          @if (section.link) {
            <a
              class="flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg border border-transparent text-2xs font-semibold text-ink-muted transition-colors hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand aria-[current=page]:border-brand/70 aria-[current=page]:bg-surface-raised aria-[current=page]:text-brand-strong"
              [routerLink]="section.link"
              routerLinkActive
              [routerLinkActiveOptions]="{ exact: section.exact }"
              ariaCurrentWhenActive="page"
            >
              <mat-icon class="mas-icon-md" aria-hidden="true">{{ section.icon }}</mat-icon>
              <span class="max-w-full truncate">{{ section.label }}</span>
            </a>
          } @else {
            <button
              type="button"
              class="flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg border border-transparent text-2xs font-semibold text-ink-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              aria-disabled="true"
            >
              <mat-icon class="mas-icon-md" aria-hidden="true">{{ section.icon }}</mat-icon>
              <span class="max-w-full truncate">{{ section.label }}</span>
            </button>
          }
        }
      </nav>

      <button
        #restoreButton
        type="button"
        class="fixed bottom-4 left-1/2 z-40 flex min-h-11 -translate-x-1/2 items-center gap-2 rounded-xl border border-brand/25 bg-surface-raised/85 pl-3.5 pr-2.5 text-xs font-bold text-brand-strong shadow-lg backdrop-blur-md backdrop-saturate-150 transition-[transform,opacity] duration-300 ease-out hover:border-brand/70 hover:bg-surface-raised focus:outline-none focus-visible:ring-2 focus-visible:ring-brand motion-reduce:transition-none"
        [class]="restoreStateClass()"
        [inert]="!mainNavStore.dockHidden()"
        [attr.aria-label]="restoreLabel()"
        aria-controls="main-dock"
        aria-expanded="false"
        (click)="show()"
      >
        <mat-icon class="mas-icon-sm" aria-hidden="true">{{ mainNavStore.currentDockItem()?.icon ?? 'menu' }}</mat-icon>
        <span>{{ mainNavStore.currentDockItem()?.label ?? 'Menu' }}</span>
        <span class="h-5 w-px bg-brand/25" aria-hidden="true"></span>
        <mat-icon class="mas-icon-sm" aria-hidden="true">expand_less</mat-icon>
      </button>
    }
  `,
  host: { class: 'block md:hidden' },
})
export class MainDockComponent {
  readonly mainNavStore = inject(MainNavStore);
  private readonly injector = inject(Injector);
  private readonly grabButton = viewChild<ElementRef<HTMLButtonElement>>('grabButton');
  private readonly restoreButton = viewChild<ElementRef<HTMLButtonElement>>('restoreButton');
  private drag: DockDrag | null = null;

  readonly dragOffset = signal<number | null>(null);
  readonly dragTransform = computed(() => {
    const offset = this.dragOffset();
    return offset === null ? null : `translateY(${offset}px)`;
  });
  readonly dragOpacity = computed(() => {
    const offset = this.dragOffset();
    return offset === null ? null : Math.max(0.4, 1 - offset / 160);
  });
  readonly dockStateClass = computed(() => {
    if (this.dragOffset() !== null) return 'transition-none';
    return this.mainNavStore.dockHidden() ? 'invisible translate-y-[calc(100%+1.5rem)] opacity-0' : '';
  });
  readonly restoreStateClass = computed(() =>
    this.mainNavStore.dockHidden() ? '' : 'invisible translate-y-4 scale-95 opacity-0',
  );
  readonly dockLabel = computed(() =>
    this.mainNavStore.programPages().length > 1 ? 'Program pages' : 'Main sections',
  );
  readonly restoreLabel = computed(() => {
    const section = this.mainNavStore.currentDockItem();
    return section ? `Show navigation, current page ${section.label}` : 'Show navigation';
  });

  hide() {
    this.mainNavStore.hideDock();
    this.focusAfterRender(this.restoreButton);
  }

  show() {
    this.mainNavStore.showDock();
    this.focusAfterRender(this.grabButton);
  }

  startDrag(event: PointerEvent) {
    this.drag = { startY: event.clientY, pointerId: event.pointerId, moving: false };
  }

  moveDrag(event: PointerEvent) {
    if (!this.drag) return;
    const offset = Math.max(0, event.clientY - this.drag.startY);
    if (!this.drag.moving && offset > DRAG_START_DISTANCE) {
      this.drag.moving = true;
      (event.currentTarget as HTMLElement).setPointerCapture?.(this.drag.pointerId);
    }
    if (this.drag.moving) this.dragOffset.set(offset);
  }

  endDrag(event: PointerEvent) {
    const drag = this.drag;
    this.cancelDrag();
    if (drag?.moving && event.clientY - drag.startY > DOCK_SWIPE_DISTANCE) this.hide();
  }

  cancelDrag() {
    this.drag = null;
    this.dragOffset.set(null);
  }

  private focusAfterRender(target: () => ElementRef<HTMLElement> | undefined) {
    afterNextRender(() => target()?.nativeElement.focus({ preventScroll: true }), { injector: this.injector });
  }
}
