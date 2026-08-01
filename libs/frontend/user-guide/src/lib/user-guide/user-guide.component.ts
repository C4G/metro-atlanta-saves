import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { UserGuideStore } from '@mas/frontend-shared-data-access';

@Component({
  selector: 'mas-user-guide',
  host: {
    class: 'block p-6',
  },
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (userGuideStore.userGuide(); as guide) {
      <div class="wysiwyg" [innerHTML]="sanitizer.bypassSecurityTrustHtml(guide.body)"></div>
    }
  `,
})
export default class UserGuideComponent {
  userGuideStore = inject(UserGuideStore);
  sanitizer = inject(DomSanitizer);

  constructor() {
    this.userGuideStore.getUserGuide();
  }
}
