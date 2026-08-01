import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FooterComponent } from '@mas/frontend-shared-layout';
import { MembersStore } from './members.store';

@Component({
  selector: 'mas-members',
  imports: [FooterComponent],
  providers: [MembersStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-4 p-5">
      <h2 class="text-2xl font-bold mb-4">Team Members</h2>
      <p>
        This page lists the Computing for Good team members for the Spring 2026 semester. Together, we bring a unique,
        dynamic blend of experience and knowledge driven to provide Building Resilient Professionals with the best user
        experience on this website.
        <br />
        We meet with the United Way of Greater Atlanta staff on Tuesdays at 3:30pm EST and with each other once a week
        on Tuesdays at 10pm EST. In our meetings, we discuss our progress and roadblocks, plan future projects, and
        communicate with each other and the United Way staff.
        <br />
      </p>
      @for (member of membersStore.members(); track member.name) {
        <div class="flex flex-col sm:flex-row">
          <img
            class="rounded-full mr-4 h-28 self-center sm:self-start"
            [src]="member.img"
            [alt]="member.name"
            width="112"
            height="112"
          />
          <div class="flex flex-col">
            <h2 class="text-lg font-bold mb-2">{{ member.name }}</h2>
            <p class="mb-2">Experience: {{ member.experience }}</p>
            <div class="flex">
              <span class="block text-lg font-bold mr-4">Roles:</span>
              <ul class="block ml-4">
                @for (role of member.roles; track role) {
                  <li>{{ role }}</li>
                }
              </ul>
            </div>
          </div>
        </div>
      }
    </div>
    <mas-footer />
  `,
  host: {
    class: 'block',
  },
})
export default class MembersComponent {
  membersStore = inject(MembersStore);
}
