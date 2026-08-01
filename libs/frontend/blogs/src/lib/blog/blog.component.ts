import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  effect,
  inject,
  input,
  OnDestroy,
  signal,
  untracked,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { BlogsStore } from '@mas/frontend-shared-data-access';
import { FooterComponent } from '@mas/frontend-shared-layout';

@Component({
  selector: 'mas-blog',
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
    <div class="px-6 max-w-5xl mx-auto p-6 color-accent mb-6" color="accent">
      <a mat-button class="mb-4" aria-label="Back" title="Back" routerLink="../">
        <mat-icon>arrow_back_ios</mat-icon>
        Back
      </a>
      <div class="flex flex-col">
        <h1 class="text-4xl font-bold">{{ blogsStore.blog()?.title }}</h1>
        <h3 class="text-xl mt-2 mb-4">{{ blogsStore.blog()?.subTitle }}</h3>
        <mat-divider />
        <div class="mt-2 mb-2 flex items-center">
          <p>Posted On: {{ blogsStore.blog()?.updatedAt | date: 'mediumDate' }}</p>
          <button mat-icon-button [matMenuTriggerFor]="shareMenu" aria-label="Share" class="ml-auto">
            <mat-icon>share</mat-icon>
          </button>
          <mat-menu #shareMenu="matMenu">
            <a mat-menu-item [href]="facebookShareUrl()" target="_blank" aria-label="Share on Facebook">Facebook</a>
            <a mat-menu-item [href]="twitterShareUrl()" target="_blank" aria-label="Share on Twitter">Twitter</a>
            <button mat-menu-item (click)="copyLink()" aria-label="Copy Link">Copy Link</button>
          </mat-menu>
        </div>
        <mat-divider />
        @if (blogsStore.blog()?.body; as body) {
          <div class="mt-8 wysiwyg" [innerHTML]="sanitizer.bypassSecurityTrustHtml(body)"></div>
        }
      </div>
    </div>
    <mas-footer />
  `,
  host: {
    class: 'block',
  },
})
export default class BlogComponent implements OnDestroy {
  slug = input.required<string>();
  private document = inject(DOCUMENT);
  private snackBar = inject(MatSnackBar);
  sanitizer = inject(DomSanitizer);
  blogsStore = inject(BlogsStore);
  facebookShareUrl = signal(
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this.document.location.href)}`,
  );
  twitterShareUrl = signal(`https://twitter.com/intent/tweet?url=${encodeURIComponent(this.document.location.href)}`);

  blogEffect = effect(() => {
    const slug = this.slug();

    untracked(() => {
      this.blogsStore.getBlog(slug);
    });
  });

  ngOnDestroy() {
    this.blogsStore.clearBlog();
  }
  copyLink() {
    const url = window.location.href;

    navigator.clipboard
      .writeText(url)
      .then(() => {
        this.snackBar.open('Link copied to clipboard', 'Close', {
          duration: 2000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: 'success',
        });
      })
      .catch(() => {
        this.snackBar.open('Failed to copy to clipboard', 'Close', {
          duration: 2000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: 'error',
        });
      });
  }
}
