import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { ProgramsStore } from '@mas/frontend-shared-data-access';
import { FooterComponent } from '@mas/frontend-shared-layout';

@Component({
  selector: 'mas-dashboard',
  imports: [CommonModule, MatCardModule, MatButtonModule, RouterLink, FooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6">
      <h1 class="text-4xl font-bold mb-4">Upcoming Programs</h1>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-12 justify-center mb-4">
        @for (program of programsStore.upcomingPrograms(); track program.id) {
          <mat-card
            class="rounded-lg shadow-md overflow-hidden flex flex-col gap-2 p-4 !border-t-4"
            style="border-color: var(--primary)"
          >
            <h3 class="text-xl truncate font-bold" [title]="program.name">{{ program.name }}</h3>
            <div class="flex gap-4 justify-between items-center text-sm">
              <span>Start Date: {{ program.startDate | date }}</span>
              <span>End Date: {{ program.endDate | date }}</span>
            </div>
            <div class="h-96 overflow-y-auto">
              <div
                class="mb-4 wysiwyg"
                [innerHTML]="sanitizer.bypassSecurityTrustHtml(program.description ?? '')"
              ></div>
            </div>
            <a mat-raised-button color="primary" [routerLink]="'/enroll/' + program.id" class="mt-auto">Enroll Now</a>
          </mat-card>
        } @empty {
          <span>No upcoming programs</span>
        }
      </div>
    </div>
    <mas-footer />
  `,
  host: {
    class: 'block',
  },
})
export class DashboardComponent {
  programsStore = inject(ProgramsStore);
  sanitizer = inject(DomSanitizer);

  constructor() {
    this.programsStore.getUpcoming();
  }
}
