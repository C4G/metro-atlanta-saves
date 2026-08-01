import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { FooterComponent } from '@mas/frontend-shared-layout';

@Component({
  selector: 'mas-demo',
  imports: [FooterComponent, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col p-5">
      <h2 class="text-2xl font-bold mb-3">Demo</h2>
      <a
        mat-raised-button
        color="primary"
        href="https://gtvault-my.sharepoint.com/:v:/g/personal/yzeytuncu3_gatech_edu/IQCCNWOsFVfpSJlITwbsI7-_AYmu8kn4HiS2yyi-yklOQZY?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJPbmVEcml2ZUZvckJ1c2luZXNzIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXciLCJyZWZlcnJhbFZpZXciOiJNeUZpbGVzTGlua0NvcHkifX0&e=QGxT00"
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
export default class DemoComponent {}
