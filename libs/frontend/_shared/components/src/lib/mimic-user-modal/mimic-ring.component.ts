import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'mas-mimic-ring',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-content />
  `,
  host: {
    class:
      "relative isolate inline-flex shrink-0 overflow-hidden rounded-[0.625rem] bg-danger/30 p-0.5 before:absolute before:-inset-[60%] before:-z-10 before:animate-[spin_1.6s_linear_infinite] before:bg-[conic-gradient(transparent_0_62%,rgb(var(--mas-warn-ink))_82%,rgb(var(--mas-danger))_96%,transparent_100%)] before:content-[''] motion-reduce:before:animate-none",
  },
})
export class MimicRingComponent {}
