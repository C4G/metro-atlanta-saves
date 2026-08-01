import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { DomSanitizer } from '@angular/platform-browser';
import { ProgramsStore } from '@mas/frontend-shared-data-access';

@Component({
  selector: 'mas-description',
  imports: [MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="py-6">
      <div
        class="mb-4 wysiwyg"
        [innerHTML]="sanitizer.bypassSecurityTrustHtml(programsStore.program()?.description ?? '')"
      ></div>
    </div>
  `,
  host: {
    class: 'block',
  },
})
export default class DescriptionComponent {
  programsStore = inject(ProgramsStore);
  sanitizer = inject(DomSanitizer);
}
