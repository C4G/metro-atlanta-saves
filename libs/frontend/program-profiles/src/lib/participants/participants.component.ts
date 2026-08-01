import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { UsersOnProgramsStore } from '@mas/frontend-shared-data-access';

@Component({
  selector: 'mas-participants',
  imports: [MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="py-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        @for (user of usersOnProgramsStore.users(); track user.userId) {
          <div class="border border-white border-solid">
            <div class="font-bold ml-4 mt-4">Name: {{ user.firstName }} {{ user.lastName }}</div>
            <div class="mb-4 ml-4">Bio: {{ user.bio }}</div>
          </div>
        }
      </div>
    </div>
  `,
  host: {
    class: 'block',
  },
})
export default class ParticipantsComponent {
  usersOnProgramsStore = inject(UsersOnProgramsStore);
}
