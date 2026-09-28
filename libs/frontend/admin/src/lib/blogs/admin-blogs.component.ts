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
    <main class="admin-content-shell blog-workspace">
      <header class="workspace-header">
        <div>
          <p class="eyebrow">Content & guidance</p>
          <h1>Blogs</h1>
          <p class="workspace-header__description">
            Share clear, practical ideas with the BRP community. Draft a new article or keep existing guidance current.
          </p>
        </div>
        <button mat-raised-button color="primary" class="create-button" (click)="openModal()">
          <mat-icon>add</mat-icon>
          New article
        </button>
      </header>

      <section class="content-toolbar" aria-label="Blog controls">
        <label class="search-field">
          <mat-icon aria-hidden="true">search</mat-icon>
          <input
            [ngModel]="searchTerm()"
            (ngModelChange)="searchTerm.set($event)"
            placeholder="Search articles"
            aria-label="Search articles"
          />
        </label>
        <p>{{ visibleBlogs().length }} of {{ blogsStore.blogs().length }} articles</p>
      </section>

      @if (visibleBlogs().length) {
        <section class="article-list" aria-label="Blog articles">
          @for (blog of visibleBlogs(); track blog.id) {
            <article class="article-row">
              <div class="article-row__marker" aria-hidden="true"><mat-icon>article</mat-icon></div>
              <div class="article-row__content">
                <div class="article-row__title-line">
                  <h2>{{ blog.title }}</h2>
                  <span class="status-chip">Published</span>
                </div>
                @if (blog.subTitle) {
                  <p class="article-row__subtitle">{{ blog.subTitle }}</p>
                }
                <div
                  class="article-row__preview rich-content"
                  [innerHTML]="sanitizer.bypassSecurityTrustHtml(blog.body)"
                ></div>
                <p class="article-row__meta">
                  Updated {{ blog.updatedAt | date: 'MMM d, y' }}
                  <span aria-hidden="true">·</span>
                  <span class="article-row__slug">/{{ blog.slug }}</span>
                </p>
              </div>
              <div class="article-row__actions">
                <button mat-icon-button matTooltip="Edit article" aria-label="Edit article" (click)="openEdit(blog)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button
                  mat-icon-button
                  matTooltip="Delete article"
                  aria-label="Delete article"
                  class="delete-action"
                  (click)="openConfirm(blog)"
                >
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </article>
          }
        </section>
      } @else {
        <section class="empty-state">
          <mat-icon aria-hidden="true">edit_note</mat-icon>
          @if (blogsStore.blogs().length) {
            <h2>No articles match that search.</h2>
            <p>Try a different title, subtitle, or URL keyword.</p>
            <button mat-button (click)="searchTerm.set('')">Clear search</button>
          } @else {
            <h2>Your publishing space is ready.</h2>
            <p>Start with a helpful update, story, or financial wellbeing resource.</p>
            <button mat-raised-button color="primary" (click)="openModal()">Create your first article</button>
          }
        </section>
      }
    </main>
  `,
  styles: `
    :host {
      display: block;
    }
    .blog-workspace {
      max-width: 74rem;
      margin: 0 auto;
      padding: clamp(1.25rem, 3vw, 2.5rem);
    }
    .workspace-header {
      display: flex;
      align-items: end;
      justify-content: space-between;
      gap: 1.5rem;
      padding-bottom: 2rem;
    }
    .eyebrow {
      margin: 0 0 0.5rem;
      color: var(--primary);
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.11em;
      text-transform: uppercase;
    }
    h1,
    h2 {
      color: var(--text-primary, inherit);
      letter-spacing: -0.03em;
    }
    h1 {
      margin: 0;
      font-size: clamp(2rem, 4vw, 2.75rem);
      font-weight: 750;
    }
    .workspace-header__description {
      max-width: 42rem;
      margin: 0.75rem 0 0;
      color: var(--text-secondary, inherit);
      line-height: 1.6;
    }
    .create-button {
      flex: 0 0 auto;
      min-height: 2.9rem;
      padding-inline: 1.1rem;
      border-radius: 0.8rem;
    }
    .content-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.85rem 0 1.15rem;
      border-top: 1px solid color-mix(in srgb, var(--text-primary, currentColor) 10%, transparent);
    }
    .content-toolbar > p {
      margin: 0;
      color: var(--text-secondary, inherit);
      font-size: 0.85rem;
      white-space: nowrap;
    }
    .search-field {
      display: flex;
      width: min(100%, 25rem);
      align-items: center;
      gap: 0.65rem;
      padding: 0.1rem 0.85rem;
      border: 1px solid color-mix(in srgb, var(--text-primary, currentColor) 14%, transparent);
      border-radius: 0.75rem;
      background: var(--surface-card, transparent);
    }
    .search-field:focus-within {
      border-color: color-mix(in srgb, var(--primary) 70%, transparent);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 16%, transparent);
    }
    .search-field mat-icon {
      width: 1.15rem;
      height: 1.15rem;
      color: var(--text-secondary, inherit);
      font-size: 1.15rem;
    }
    .search-field input {
      width: 100%;
      min-height: 2.6rem;
      border: 0;
      outline: 0;
      background: transparent;
      color: inherit;
      font: inherit;
    }
    .article-list {
      overflow: hidden;
      border: 1px solid color-mix(in srgb, var(--text-primary, currentColor) 12%, transparent);
      border-radius: 1rem;
      background: var(--surface-card, transparent);
    }
    .article-row {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      gap: 1rem;
      padding: 1.35rem 1.25rem;
      border-bottom: 1px solid color-mix(in srgb, var(--text-primary, currentColor) 9%, transparent);
      transition: background-color 180ms ease;
    }
    .article-row:last-child {
      border-bottom: 0;
    }
    .article-row:hover {
      background: color-mix(in srgb, var(--primary) 6%, transparent);
    }
    .article-row__marker {
      display: grid;
      width: 2.35rem;
      height: 2.35rem;
      place-items: center;
      border-radius: 0.7rem;
      background: color-mix(in srgb, var(--primary) 14%, transparent);
      color: var(--primary);
    }
    .article-row__marker mat-icon {
      width: 1.25rem;
      height: 1.25rem;
      font-size: 1.25rem;
    }
    .article-row__title-line {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }
    .article-row h2 {
      margin: 0;
      overflow: hidden;
      font-size: 1.08rem;
      line-height: 1.3;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .status-chip {
      padding: 0.2rem 0.45rem;
      border-radius: 999px;
      background: color-mix(in srgb, var(--primary) 14%, transparent);
      color: var(--primary);
      font-size: 0.68rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .article-row__subtitle {
      margin: 0.3rem 0 0;
      color: var(--text-secondary, inherit);
      line-height: 1.45;
    }
    .article-row__preview {
      display: -webkit-box;
      max-width: 52rem;
      margin-top: 0.5rem;
      overflow: hidden;
      color: var(--text-secondary, inherit);
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 1;
      font-size: 0.9rem;
      line-height: 1.45;
    }
    .article-row__meta {
      margin: 0.65rem 0 0;
      color: var(--text-secondary, inherit);
      font-size: 0.78rem;
    }
    .article-row__meta span {
      padding-inline: 0.25rem;
    }
    .article-row__slug {
      overflow-wrap: anywhere;
    }
    .article-row__actions {
      display: flex;
      align-self: center;
      gap: 0.15rem;
    }
    .article-row__actions button {
      color: var(--text-secondary, inherit);
    }
    .article-row__actions .delete-action:hover {
      color: var(--mat-sys-error, #ba1a1a);
      background: color-mix(in srgb, var(--mat-sys-error, #ba1a1a) 10%, transparent);
    }
    .empty-state {
      display: grid;
      min-height: 20rem;
      place-content: center;
      padding: 2rem;
      border: 1px dashed color-mix(in srgb, var(--primary) 38%, transparent);
      border-radius: 1rem;
      text-align: center;
    }
    .empty-state mat-icon {
      width: 2.25rem;
      height: 2.25rem;
      margin: 0 auto 0.85rem;
      color: var(--primary);
      font-size: 2.25rem;
    }
    .empty-state h2 {
      margin: 0;
      font-size: 1.2rem;
    }
    .empty-state p {
      max-width: 28rem;
      margin: 0.5rem auto 1rem;
      color: var(--text-secondary, inherit);
      line-height: 1.5;
    }
    @media (max-width: 40rem) {
      .workspace-header {
        align-items: stretch;
        flex-direction: column;
      }
      .create-button {
        width: 100%;
      }
      .content-toolbar {
        align-items: stretch;
        flex-direction: column;
      }
      .content-toolbar > p {
        white-space: normal;
      }
      .search-field {
        width: 100%;
      }
      .article-row {
        grid-template-columns: auto minmax(0, 1fr);
        padding: 1.15rem 1rem;
      }
      .article-row__actions {
        grid-column: 2;
        justify-content: start;
      }
      .article-row h2 {
        white-space: normal;
      }
    }
  `,
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
