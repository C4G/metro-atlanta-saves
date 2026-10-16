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
        @for (userProgram of usersOnProgramsStore.userProgramProgress(); track userProgram.requirementId) {
          <!-- Requirement UUID is the calendar deep-link target in this single routed view. -->
          <div
            [id]="userProgram.requirementId"
            class="card border-2 rounded-md p-4 h-full flex flex-col"
            [class.border-green-500]="userProgram.isCompleted"
            [class.border-red-500]="!userProgram.isCompleted"
          >
            <div class="card-content">
              <div>
                <h3 class="text-lg font-bold">{{ userProgram.requirementName }}</h3>
                <p class="opacity-80 text-sm  mt-2">{{ userProgram.status }}</p>
                @if (userProgram.actionInstructions) {
                  <p class="opacity-80 text-sm mt-2 whitespace-pre-line">{{ userProgram.actionInstructions }}</p>
                }
                @if (userProgram.dueAt) {
                  <p class="opacity-80 text-sm mt-2">Due: {{ formatDueAt(userProgram.dueAt) }}</p>
                }
              </div>
            </div>
            <div class="card-actions mt-auto pt-3 flex flex-wrap items-center justify-end gap-2">
              @if (!userProgram.isCompleted && userProgram.completionLink) {
                <a
                  mat-button
                  color="primary"
                  class="whitespace-nowrap"
                  [href]="userProgram.completionLink"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open Content
                </a>
              }
              @if (!userProgram.isCompleted && userProgram.isActionRequirement) {
                <button
                  mat-button
                  color="primary"
                  class="whitespace-nowrap"
                  type="button"
                  (click)="usersOnProgramsStore.completeRequirement(userProgram.requirementId)"
                >
                  Mark Complete
                </button>
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

  private dueDateFormatter = new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  formatDueAt(value: Date | string): string {
    return this.dueDateFormatter.format(new Date(value));
  }
}
