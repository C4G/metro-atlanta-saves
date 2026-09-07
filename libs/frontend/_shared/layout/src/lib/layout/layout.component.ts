import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NavComponent } from './nav/nav.component';
import { UpdateNotificationComponent } from './update-notification/update-notification.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'mas-layout',
  imports: [NavComponent, FooterComponent, UpdateNotificationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header><mas-nav /></header>
    <main id="main-content" class="app-main mt-14 flex-1 sm:mt-16" tabindex="-1">
      <ng-content />
    </main>
    <mas-footer class="app-footer" />
    <mas-update-notification />
  `,
  host: {
    class: 'flex min-h-dvh flex-col',
  },
})
export class LayoutComponent {}
