import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { FooterComponent } from '@mas/frontend-shared-layout';

@Component({
  selector: 'mas-project-peer-evaluations',
  imports: [FooterComponent, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col max-w-5xl mx-auto items-center p-6">
      <h2 class="text-2xl font-bold mb-3">Project Peer Evaluations</h2>
      <div class="h-[calc(100dvh-9.75rem)] w-full">
        <iframe
          src="https://docs.google.com/forms/d/e/1FAIpQLSdTBikAkuv7J_7P2GvTRo31jEk01P4_IxXHZlijFZqKjmETow/viewform?embedded=true"
          width="100%"
          height="100%"
          frameborder="0"
        ></iframe>
      </div>
    </div>
    <mas-footer />
  `,
  host: {
    class: 'block',
  },
})
export default class ProjectPeerEvaluationsComponent {}
