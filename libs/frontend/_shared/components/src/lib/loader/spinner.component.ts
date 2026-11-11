import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'mas-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      aria-hidden="true"
      class="block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-[spin_1.6s_linear_infinite]"
    ></span>
  `,
  host: { class: 'inline-flex shrink-0' },
})
export class SpinnerComponent {}
