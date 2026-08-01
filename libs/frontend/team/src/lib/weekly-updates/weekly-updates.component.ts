import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { FooterComponent } from '@mas/frontend-shared-layout';

@Component({
  selector: 'mas-weekly-updates',
  imports: [FooterComponent, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col p-5">
      <h2 class="text-2xl font-bold mb-3">Weekly Update</h2>
      <a
        mat-raised-button
        color="primary"
        href="https://github.gatech.edu/orgs/cs-6150-computing-for-good/projects/6"
        target="_blank"
        class="mr-auto"
      >
        Click to Open
      </a>
    </div>
    <mas-footer />
  `,
  host: {
    class: 'block',
  },
})
export default class WeeklyUpdatesComponent {}
