import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FooterComponent } from '@mas/frontend-shared-layout';

@Component({
  selector: 'mas-goal',
  imports: [FooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col p-5">
      <h2 class="text-2xl font-bold mb-3">Project Goal</h2>
      <p class="mb-3">
        The goal of this project for the Spring 2026 semester is to expand platform capabilities to support new program
        structures, enhance communication tools, and improve administrative flexibility for staff and cohort members.
      </p>
    </div>
    <mas-footer />
  `,
  host: {
    class: 'block',
  },
})
export default class GoalComponent {}
