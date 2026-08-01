import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { PeerEvaluationGuideStore } from '@mas/frontend-shared-data-access';

@Component({
  selector: 'mas-peer-evaluation-guide',
  host: {
    class: 'block p-6',
  },
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (peerEvaluationGuideStore.peerEvaluationGuide(); as guide) {
      <div class="wysiwyg" [innerHTML]="sanitizer.bypassSecurityTrustHtml(guide.body)"></div>
    }
  `,
})
export default class PeerEvaluationGuideComponent {
  peerEvaluationGuideStore = inject(PeerEvaluationGuideStore);
  sanitizer = inject(DomSanitizer);

  constructor() {
    this.peerEvaluationGuideStore.getPeerEvaluationGuide();
  }
}
