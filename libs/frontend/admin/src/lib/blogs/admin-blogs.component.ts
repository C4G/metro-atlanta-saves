import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { DomSanitizer } from '@angular/platform-browser';
import { ConfirmDialogComponent } from '@mas/frontend-shared-components';
import { BlogsStore } from '@mas/frontend-shared-data-access';
import type { Blog } from '@mas/prisma-client/browser';
import { AddBlogComponent } from './ui/add-blog/add-blog.component';

@Component({
  selector: 'mas-admin-blogs',
  imports: [DatePipe, FormsModule, MatButton, MatDialogModule, MatIcon, MatIconButton, MatTooltip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main
      class="admin-content-shell min-h-full bg-[#f6faf9] text-[#102a2c] dark:bg-[#0c1222] dark:text-slate-100 [&_.mat-mdc-tab-link]:font-bold [&_.mat-mdc-tab-link]:text-[#52666a] [&_.mat-mdc-tab-link.mdc-tab--active]:text-teal-700 dark:[&_.mat-mdc-tab-link]:text-slate-400 dark:[&_.mat-mdc-tab-link.mdc-tab--active]:text-teal-200 dark:[&_.mdc-tab-indicator__content--underline]:!border-teal-400 [&_.mat-mdc-raised-button]:!rounded-xl [&_.mat-mdc-raised-button]:!font-bold dark:[&_.mat-mdc-raised-button]:!bg-teal-400 dark:[&_.mat-mdc-raised-button]:!text-teal-950 dark:[&_.mat-mdc-slide-toggle_.mdc-label]:text-slate-300 dark:[&_.tox_.tox-editor-header]:!bg-[#151b2e] dark:[&_.tox_.tox-menubar]:!bg-[#151b2e] dark:[&_.tox_.tox-toolbar-overlord]:!bg-[#151b2e] mx-auto max-w-[74rem] p-[clamp(1.25rem,3vw,2.5rem)]"
    >
      <header class="flex flex-col items-stretch gap-6 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="mb-2 text-xs font-extrabold uppercase tracking-[0.11em] text-[var(--primary)]">
            Content & guidance
          </p>
          <h1 class="text-[clamp(2rem,4vw,2.75rem)] font-bold tracking-tight text-[var(--text-primary)]">Blogs</h1>
          <p class="mt-3 max-w-2xl leading-relaxed text-[var(--text-secondary)]">
            Share clear, practical ideas with the BRP community. Draft a new article or keep existing guidance current.
          </p>
        </div>
        <button
          mat-raised-button
          color="primary"
          class="!min-h-11 !w-full !shrink-0 !rounded-xl !px-4 sm:!w-auto"
          (click)="openModal()"
        >
          <mat-icon>add</mat-icon>
          New article
        </button>
      </header>

      <section
        class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        aria-label="Blog controls"
      >
        <label
          class="flex min-h-11 w-full max-w-md items-center gap-2 rounded-xl border border-[color-mix(in_srgb,var(--text-primary,currentColor)_14%,transparent)] bg-[var(--surface-card)] px-3 focus-within:border-[var(--primary)]"
        >
          <mat-icon class="!text-[var(--text-secondary)]" aria-hidden="true">search</mat-icon>
          <input
            class="min-w-0 flex-1 bg-transparent text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
            [ngModel]="searchTerm()"
            (ngModelChange)="searchTerm.set($event)"
            placeholder="Search articles"
            aria-label="Search articles"
          />
        </label>
        <p class="text-sm text-[var(--text-secondary)]">
          {{ visibleBlogs().length }} of {{ blogsStore.blogs().length }} articles
        </p>
      </section>

      @if (visibleBlogs().length) {
        <section class="grid gap-3" aria-label="Blog articles">
          @for (blog of visibleBlogs(); track blog.id) {
            <article
              class="grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--text-primary,currentColor)_12%,transparent)] bg-[var(--surface-card)] p-4 transition duration-200 hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--primary)_42%,transparent)] sm:grid-cols-[auto_minmax(0,1fr)_auto]"
            >
              <div
                class="grid size-10 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--primary)_14%,transparent)] text-[var(--primary)]"
                aria-hidden="true"
              >
                <mat-icon>article</mat-icon>
              </div>
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <h2 class="text-lg font-bold tracking-tight text-[var(--text-primary)]">{{ blog.title }}</h2>
                  <span
                    class="rounded-full bg-[color-mix(in_srgb,var(--primary)_14%,transparent)] px-2 py-1 text-[0.68rem] font-extrabold uppercase tracking-wider text-[var(--primary)]"
                  >
                    Published
                  </span>
                </div>
                @if (blog.subTitle) {
                  <p class="mt-1 text-sm text-[var(--text-secondary)]">{{ blog.subTitle }}</p>
                }
                <div
                  class="rich-content mt-2 line-clamp-2 text-sm text-[var(--text-secondary)]"
                  [innerHTML]="sanitizer.bypassSecurityTrustHtml(blog.body)"
                ></div>
                <p class="mt-3 flex flex-wrap gap-1 text-xs text-[var(--text-secondary)]">
                  Updated {{ blog.updatedAt | date: 'MMM d, y' }}
                  <span aria-hidden="true">·</span>
                  <span class="font-mono">/{{ blog.slug }}</span>
                </p>
              </div>
              <div class="col-span-2 flex justify-end gap-1 sm:col-span-1">
                <button mat-icon-button matTooltip="Edit article" aria-label="Edit article" (click)="openEdit(blog)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button
                  mat-icon-button
                  matTooltip="Delete article"
                  aria-label="Delete article"
                  class="hover:!bg-red-500/10 hover:!text-red-700 dark:hover:!text-red-300"
                  (click)="openConfirm(blog)"
                >
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </article>
          }
        </section>
      } @else {
        <section
          class="grid min-h-80 place-content-center rounded-2xl border border-dashed border-[color-mix(in_srgb,var(--primary)_38%,transparent)] p-8 text-center"
        >
          <mat-icon class="!mx-auto !mb-3 !size-9 !text-4xl !text-[var(--primary)]" aria-hidden="true">
            edit_note
          </mat-icon>
          @if (blogsStore.blogs().length) {
            <h2 class="text-xl font-bold text-[var(--text-primary)]">No articles match that search.</h2>
            <p class="my-2 text-[var(--text-secondary)]">Try a different title, subtitle, or URL keyword.</p>
            <button mat-button (click)="searchTerm.set('')">Clear search</button>
          } @else {
            <h2 class="text-xl font-bold text-[var(--text-primary)]">Your publishing space is ready.</h2>
            <p class="my-2 text-[var(--text-secondary)]">
              Start with a helpful update, story, or financial wellbeing resource.
            </p>
            <button mat-raised-button color="primary" (click)="openModal()">Create your first article</button>
          }
        </section>
      }
    </main>
  `,
  host: { class: 'block' },
})
export default class AdminBlogsComponent {
  private dialog = inject(MatDialog);
  sanitizer = inject(DomSanitizer);
  blogsStore = inject(BlogsStore);
  searchTerm = signal('');
  visibleBlogs = computed(() => {
    const query = this.searchTerm().trim().toLocaleLowerCase();
    const blogs = [...this.blogsStore.blogs()].sort(
      (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
    );
    return query
      ? blogs.filter((blog) =>
          [blog.title, blog.subTitle, blog.slug].some((value) => (value ?? '').toLocaleLowerCase().includes(query)),
        )
      : blogs;
  });

  constructor() {
    this.blogsStore.getBlogs();
  }
  openModal() {
    this.dialog.open(AddBlogComponent, { panelClass: 'w-full' });
  }
  openEdit(blog: Blog) {
    this.dialog.open(AddBlogComponent, { data: blog, panelClass: 'w-full' });
  }
  openConfirm(blog: Blog) {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete article',
        content: `Are you sure you want to delete ${blog.title}?`,
        color: 'warn',
        onYesClick: () => this.blogsStore.deleteBlog(blog.id),
      },
    });
  }
}
