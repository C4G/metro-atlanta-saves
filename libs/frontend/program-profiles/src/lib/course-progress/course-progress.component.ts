import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ThemeService, UsersOnProgramsStore } from '@mas/frontend-shared-data-access';

@Component({
  selector: 'mas-course-progress',
  imports: [MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="py-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        @for (userProgram of usersOnProgramsStore.userProgramProgress(); track userProgram.requirementName) {
          <div
            class="card border-2 rounded-md p-4"
            [class.border-green-500]="userProgram.isCompleted"
            [class.border-red-500]="!userProgram.isCompleted"
          >
            <div class="card-content flex justify-between items-center">
              <div>
                <h3 class="text-lg font-bold">{{ userProgram.requirementName }}</h3>
                <p class="opacity-80 text-sm  mt-2">{{ userProgram.status }}</p>
              </div>
              @if (!userProgram.isCompleted && userProgram.completionLink) {
                <a
                  mat-button
                  color="primary"
                  [href]="userProgram.completionLink"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="ml-4"
                >
                  Complete
                </a>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  host: {
    class: 'block',
  },
})
export default class CourseProgressComponent {
  themeService = inject(ThemeService);
  usersOnProgramsStore = inject(UsersOnProgramsStore);
}
