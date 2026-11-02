import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MainDockComponent } from '@mas/frontend-shared-components';
import { NavComponent } from './nav/nav.component';
import { UpdateNotificationComponent } from './update-notification/update-notification.component';
import { BreadcrumbComponent } from './breadcrumb/breadcrumb.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'mas-layout',
  imports: [BreadcrumbComponent, FooterComponent, MainDockComponent, NavComponent, UpdateNotificationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div aria-hidden="true" class="pointer-events-none fixed inset-0 -z-10 bg-page-glow"></div>
    <header><mas-nav /></header>
    <main id="main-content" class="mt-16 flex-1 sm:mt-20" tabindex="-1">
      <mas-breadcrumb />
      <ng-content />
    </main>
    <mas-footer />
    <mas-main-dock />
    <mas-update-notification />
  `,
  host: {
    class: 'relative isolate flex min-h-dvh flex-col bg-canvas text-ink',
  },
})
export class LayoutComponent {}
