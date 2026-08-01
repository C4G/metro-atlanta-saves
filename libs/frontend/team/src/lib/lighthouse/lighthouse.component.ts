import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FooterComponent } from '@mas/frontend-shared-layout';

@Component({
  selector: 'mas-lighthouse',
  imports: [FooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col p-5">
      <h2 class="text-2xl font-bold mb-3">Lighthouse Report</h2>
      <img src="assets/lighthouse/2026-03-08 192215.png" alt="Lighthouse Report from 2026-03-08" width="350" />
    </div>
    <mas-footer />
  `,
  host: {
    class: 'block',
  },
})
export default class LighthouseComponent {}
