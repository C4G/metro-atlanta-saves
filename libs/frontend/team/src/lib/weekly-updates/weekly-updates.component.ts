import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatAnchor } from '@angular/material/button';

@Component({
  selector: 'mas-weekly-updates',
  imports: [MatAnchor],
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
  `,
  host: {
    class: 'block',
  },
})
export default class WeeklyUpdatesComponent {}
