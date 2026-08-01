import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { NavComponent } from './nav/nav.component';
import { MatDrawerMode, MatSidenavModule } from '@angular/material/sidenav';
import { SidenavComponent } from './sidenav/sidenav.component';
import { UpdateNotificationComponent } from './update-notification/update-notification.component';
import { BreadcrumbComponent } from './breadcrumb/breadcrumb.component';

import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

const MOBILE_MEDIA = '(max-width: 600px)';

@Component({
  selector: 'mas-layout',
  imports: [NavComponent, MatSidenavModule, SidenavComponent, UpdateNotificationComponent, BreadcrumbComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mas-nav (openNav)="drawer.toggle()" />
    <mat-sidenav-container autosize class="mt-14 sm:mt-16">
      <mat-sidenav
        #drawer
        [fixedInViewport]="true"
        [fixedTopGap]="sidenavMode() === 'over' ? 56 : 64"
        [mode]="sidenavMode()"
        class="sidenav"
      >
        <mas-sidenav class="p-4" />
      </mat-sidenav>
      <main>
        <mas-breadcrumb />
        <ng-content />
      </main>
    </mat-sidenav-container>
    <mas-update-notification />
  `,
  host: {
    class: 'block',
  },
})
export class LayoutComponent {
  private breakpointObserver = inject(BreakpointObserver);
  isSidenavOpen = signal(false);
  sidenavMode = toSignal(
    this.breakpointObserver
      .observe(MOBILE_MEDIA)
      .pipe(map<BreakpointState, MatDrawerMode>((mobileState) => (mobileState.matches ? 'over' : 'side'))),
    { initialValue: 'over' },
  );
}
