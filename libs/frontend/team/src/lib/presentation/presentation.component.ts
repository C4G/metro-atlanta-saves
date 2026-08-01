import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { FooterComponent } from '@mas/frontend-shared-layout';

@Component({
  selector: 'mas-description',
  imports: [FooterComponent, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col p-5">
      <h2 class="text-2xl font-bold mb-3">Presentation Slides</h2>
      <a
        mat-raised-button
        color="primary"
        href="https://gtvault-my.sharepoint.com/:p:/g/personal/yzeytuncu3_gatech_edu/IQBwWV2ONb_VQYH_Llvf_RIHAa8aANTQOiPWauon6EMmK0k?e=gKzNTC"
        target="_blank"
        class="mr-auto"
      >
        Open
      </a>
      <a
        mat-raised-button
        color="accent"
        href="https://docs.google.com/presentation/d/1kqJnytgxZgIQKb8JKpJv6OSPvu62K6l-PW3jDluowSE/edit?usp=sharing"
        target="_blank"
        class="mr-auto mt-3"
      >
        Final Presentation Slides
      </a>
    </div>
    <mas-footer />
  `,
  host: {
    class: 'block',
  },
})
export default class PresentationComponent {}
