import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { ProgramsStore } from '@mas/frontend-shared-data-access';
import { AddProgramComponent } from '../../programs/ui/add-program/add-program.component';

import { SpinnerComponent } from '@mas/frontend-shared-components';

@Component({
  selector: 'mas-edit-program',
  imports: [SpinnerComponent, AddProgramComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="min-w-0" aria-label="Edit program">
      @if (programsStore.program(); as program) {
        @if (program.id === id()) {
          <mas-add-program [program]="program" [inline]="true" />
        } @else {
          <p class="text-sm text-ink-muted flex items-center gap-2" role="status">
            <mas-spinner class="text-brand" />
            <span class="sr-only">Loading program details</span>
          </p>
        }
      } @else {
        <p class="text-sm text-ink-muted flex items-center gap-2" role="status">
          <mas-spinner class="text-brand" />
          <span class="sr-only">Loading program details</span>
        </p>
      }
    </section>
  `,
  host: { class: 'block' },
})
export default class EditProgramComponent {
  readonly id = input.required<string>();
  readonly programsStore = inject(ProgramsStore);
}
