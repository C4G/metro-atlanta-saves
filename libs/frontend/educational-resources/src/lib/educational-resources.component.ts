import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { EducationalCategoryStore, EducationalContentStore } from '@mas/frontend-shared-data-access';
import { FooterComponent } from '@mas/frontend-shared-layout';

@Component({
  selector: 'mas-educational-resources',
  imports: [MatButtonModule, MatCardModule, FooterComponent, MatCheckboxModule, MatChipsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-6 max-w-5xl mx-auto p-6 color-accent mb-6" color="accent">
      <h1 class="text-4xl font-bold text-center">Educational Resources</h1>
      <div class="flex flex-col sm:flex-row mt-12 gap-2 sm:gap-6">
        <div class="w-full sm:w-1/4 p-2">
          <h1 class="mb-2">Select Categories</h1>
          <div class="flex sm:flex-col">
            @for (category of educationalCategoryStore.categoryList(); track category.id) {
              <mat-checkbox (click)="toggleFilter(category.id)" [checked]="selectedFilters.includes(category.id)">
                {{ category.category }}
              </mat-checkbox>
            }
          </div>
        </div>
        <div class="w-full sm:w-3/4 p-4">
          <div class="grid grid-cols-1 gap-6">
            @for (resource of educationalContentStore.contentList(); track resource.id) {
              <mat-card
                class="rounded-lg shadow-md overflow-hidden flex flex-col gap-2 p-4 !border-t-4"
                style="border-color: var(--primary)"
              >
                <div class="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div class="sm:w-3/4 sm:pr-4 gap-4">
                    <h3 class="text-xl truncate font-bold mb-2">{{ resource.title }}</h3>
                    <p class="text-md opacity-80 line-clamp-5 overflow-hidden whitespace-normal mb-4">
                      {{ resource.description }}
                    </p>
                    @for (category of resource.categories; track category) {
                      <mat-chip-option color="accent" class="mb-2 mr-2 !opacity-100" disabled>
                        <p class="opacity-80 text-sm">{{ category }}</p>
                      </mat-chip-option>
                    }
                    <br />
                    <a
                      mat-button
                      color="primary"
                      [href]="resource.link ? resource.link : resource.file"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="mt-auto mr-right"
                    >
                      Read More
                    </a>
                  </div>
                  <div class="sm:w-1/4 sm:pl-4 hidden sm:block">
                    <img
                      [src]="resource.image ?? 'assets/Logo/BRP_Logo.webp'"
                      alt="Resource Image"
                      class="object-cover h-full w-full mb-4 rounded"
                    />
                  </div>
                </div>
              </mat-card>
            }
          </div>
        </div>
      </div>
    </div>
    <mas-footer />
  `,
  host: {
    class: 'block',
  },
})
export class EducationalResourcesComponent {
  selectedFilters: string[] = [];
  educationalContentStore = inject(EducationalContentStore);
  educationalCategoryStore = inject(EducationalCategoryStore);

  constructor() {
    this.educationalContentStore.getContentList([]);
  }

  toggleFilter(filter: string): void {
    if (this.selectedFilters.includes(filter)) {
      this.selectedFilters = this.selectedFilters.filter((f) => f !== filter);
    } else {
      this.selectedFilters.push(filter);
    }

    this.educationalContentStore.getContentList(this.selectedFilters);
  }
}
