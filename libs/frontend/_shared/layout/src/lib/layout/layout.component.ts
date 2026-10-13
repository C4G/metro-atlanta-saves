import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NavComponent } from './nav/nav.component';
import { UpdateNotificationComponent } from './update-notification/update-notification.component';
import { BreadcrumbComponent } from './breadcrumb/breadcrumb.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'mas-layout',
  imports: [BreadcrumbComponent, FooterComponent, NavComponent, UpdateNotificationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header><mas-nav /></header>
    <main id="main-content" class="mt-14 flex-1 sm:mt-16" tabindex="-1">
      <mas-breadcrumb />
      <ng-content />
    </main>
    <mas-footer />
    <mas-update-notification />
  `,
  host: {
    class: 'flex min-h-dvh flex-col bg-canvas text-ink',
  },
})
export class LayoutComponent {}
