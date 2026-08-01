import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

import { DomSanitizer } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { BlogsStore } from '@mas/frontend-shared-data-access';
import { FooterComponent } from '@mas/frontend-shared-layout';

@Component({
  selector: 'mas-blogs',
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatDividerModule,
    MatTooltipModule,
    FooterComponent,
    MatMenuModule,
    RouterLink,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col px-6 max-w-5xl mx-auto p-6 color-accent mb-6" color="accent">
      <h1 class="text-4xl font-bold text-center">Latest Blogs</h1>
      <div class="mx-auto mt-12">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-12 justify-center">
          @for (blog of blogsStore.blogs(); track blog.title) {
            <mat-card
              class="rounded-lg shadow-md overflow-hidden flex flex-col gap-2 p-4 !border-t-4"
              style="border-color: var(--primary)"
            >
              <p class="opacity-80 text-sm">{{ blog.updatedAt | date }}</p>
              <h3 class="text-xl truncate font-bold" [title]="blog.title">{{ blog.title }}</h3>
              <h3 class="text-l truncate" [title]="blog.subTitle">{{ blog.subTitle }}</h3>
              <div
                class="opacity-80 h-24 overflow-hidden whitespace-normal mb-4 wysiwyg"
                [innerHTML]="sanitizer.bypassSecurityTrustHtml(blog.body)"
              ></div>
              <a mat-raised-button color="primary" [routerLink]="'/blogs/' + blog.slug" class="mt-auto">Read More</a>
            </mat-card>
          }
        </div>
      </div>
    </div>
    <mas-footer />
  `,
  host: {
    class: 'block',
  },
})
export default class BlogsComponent {
  blogsStore = inject(BlogsStore);
  sanitizer = inject(DomSanitizer);

  constructor() {
    this.blogsStore.getBlogs();
  }
}
