import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FooterComponent } from '@mas/frontend-shared-layout';

@Component({
  selector: 'mas-description',
  imports: [FooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col p-5">
      <h2 class="text-2xl font-bold mb-3">Project Description</h2>
      <h3 class="text-lg mb-2">Partner: United Way of Metro Atlanta</h3>
      <h3 class="text-lg mb-3">Partner Contact: Protip Biswas, Senior VP</h3>
      <p class="mb-3">
        The first step to financial stability and to wealth building is to have emergency savings. We all must save so
        we have resources to draw on when we are faced with unexpected expenses. Low income families and communities of
        color are most at risk of not having savings. Over 705 of Americans live paycheck to paycheck and over 35% would
        not be able to pay an unexpected $400 expense.
      </p>
      <p class="mb-3">
        Building Resilient Professionals encourages savings for all families. We believe that different families have
        different approaches. We need to encourage financial education and for some families we need to incentivize them
        with a match.
      </p>
      <p class="mb-3">
        The challenge for this project is: With all the great work done so far, how do we improve the UX for both the
        partner staff and the cohort members?
      </p>
    </div>
    <mas-footer />
  `,
  host: {
    class: 'block',
  },
})
export default class DescriptionComponent {}
