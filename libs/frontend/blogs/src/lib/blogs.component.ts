import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { DomSanitizer } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { BlogsStore } from '@mas/frontend-shared-data-access';
import { FooterComponent } from '@mas/frontend-shared-layout';

@Component({
  selector: 'mas-blogs',
  imports: [CommonModule, MatButtonModule, MatIconModule, FooterComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="blogs-page">
      <section class="blogs-hero" aria-labelledby="blogs-heading">
        <p class="eyebrow">Community learning</p>
        <h1 id="blogs-heading">Ideas for stronger financial futures.</h1>
        <p>Practical guidance, stories, and tools to help people build confidence with money—one step at a time.</p>
      </section>

      <section class="blogs-feed" aria-labelledby="articles-heading">
        <div class="feed-heading">
          <div>
            <p class="eyebrow">Explore</p>
            <h2 id="articles-heading">Latest from BRP</h2>
          </div>
          <p class="article-count">{{ blogsStore.blogs().length }} articles</p>
        </div>

        @if (blogsStore.blogs().length) {
          <div class="article-grid">
            @for (blog of blogsStore.blogs(); track blog.id; let first = $first) {
              <article class="article-card" [class.featured]="first">
                <div class="article-card__topline">
                  <span>{{ first ? 'Featured insight' : 'Community resource' }}</span>
                  <time [attr.datetime]="blog.updatedAt | date: 'yyyy-MM-dd'">
                    {{ blog.updatedAt | date: 'MMM d, y' }}
                  </time>
                </div>

                <div class="article-card__content">
                  <h3>{{ blog.title }}</h3>
                  @if (blog.subTitle) {
                    <p class="article-card__subtitle">{{ blog.subTitle }}</p>
                  }
                  <div
                    class="article-card__preview rich-content"
                    [innerHTML]="sanitizer.bypassSecurityTrustHtml(blog.body)"
                  ></div>
                </div>

                <a class="article-card__link" [routerLink]="'/blogs/' + blog.slug">
                  Read article
                  <mat-icon aria-hidden="true">arrow_forward</mat-icon>
                </a>
              </article>
            }
          </div>
        } @else {
          <div class="empty-state">
            <mat-icon aria-hidden="true">menu_book</mat-icon>
            <h2>New stories are on their way.</h2>
            <p>Check back soon for practical insights and community updates.</p>
          </div>
        }
      </section>
    </main>
    <mas-footer />
  `,
  styles: `
    :host {
      display: flex;
      min-height: 100%;
      flex-direction: column;
    }

    .blogs-page {
      width: min(100% - 2rem, 76rem);
      margin: 0 auto;
      padding: clamp(2rem, 5vw, 4.5rem) 0 clamp(3.5rem, 7vw, 6rem);
    }

    .blogs-hero {
      max-width: 48rem;
      padding: clamp(1.75rem, 4vw, 3rem);
      border: 1px solid color-mix(in srgb, var(--primary) 18%, transparent);
      border-radius: 1.75rem;
      background: linear-gradient(135deg, color-mix(in srgb, var(--primary) 11%, transparent), transparent 62%);
    }

    .eyebrow {
      margin: 0 0 0.65rem;
      color: var(--primary);
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.11em;
      text-transform: uppercase;
    }

    .blogs-hero h1,
    .feed-heading h2,
    .article-card h3,
    .empty-state h2 {
      color: var(--text-primary, inherit);
      font-family: var(--heading-font, inherit);
    }

    .blogs-hero h1 {
      max-width: 38rem;
      margin: 0;
      font-size: clamp(2rem, 5vw, 3.75rem);
      font-weight: 750;
      letter-spacing: -0.045em;
      line-height: 1.05;
    }

    .blogs-hero > p:last-child {
      max-width: 38rem;
      margin: 1.25rem 0 0;
      color: var(--text-secondary, inherit);
      font-size: 1.05rem;
      line-height: 1.7;
    }

    .blogs-feed {
      margin-top: clamp(3rem, 7vw, 5.5rem);
    }

    .feed-heading {
      display: flex;
      align-items: end;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .feed-heading .eyebrow {
      margin-bottom: 0.35rem;
    }
    .feed-heading h2 {
      margin: 0;
      font-size: clamp(1.5rem, 3vw, 2.1rem);
      letter-spacing: -0.03em;
    }
    .article-count {
      margin: 0;
      color: var(--text-secondary, inherit);
      font-size: 0.9rem;
      white-space: nowrap;
    }

    .article-grid {
      display: grid;
      grid-template-columns: repeat(12, minmax(0, 1fr));
      gap: 1rem;
    }

    .article-card {
      display: flex;
      grid-column: span 4;
      min-height: 21rem;
      flex-direction: column;
      padding: 1.5rem;
      border: 1px solid color-mix(in srgb, var(--text-primary, currentColor) 12%, transparent);
      border-radius: 1.25rem;
      background: var(--surface-card, var(--mat-sys-surface-container-low, transparent));
      transition:
        transform 180ms ease,
        border-color 180ms ease,
        background-color 180ms ease;
    }

    .article-card:hover {
      transform: translateY(-4px);
      border-color: color-mix(in srgb, var(--primary) 48%, transparent);
      background: color-mix(in srgb, var(--primary) 6%, var(--surface-card, transparent));
    }

    .article-card.featured {
      grid-column: span 8;
      min-height: 24rem;
      background: linear-gradient(
        145deg,
        color-mix(in srgb, var(--primary) 13%, var(--surface-card, transparent)),
        var(--surface-card, transparent) 62%
      );
    }

    .article-card__topline,
    .article-card__link {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      font-size: 0.78rem;
      font-weight: 700;
    }

    .article-card__topline span {
      color: var(--primary);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .article-card__topline time {
      color: var(--text-secondary, inherit);
      font-weight: 500;
    }
    .article-card__content {
      margin-top: auto;
    }
    .article-card h3 {
      margin: 0;
      font-size: 1.35rem;
      line-height: 1.2;
      letter-spacing: -0.025em;
    }
    .featured h3 {
      max-width: 42rem;
      font-size: clamp(1.65rem, 3vw, 2.4rem);
    }
    .article-card__subtitle {
      margin: 0.6rem 0 0;
      color: var(--text-secondary, inherit);
      font-size: 1rem;
      line-height: 1.5;
    }

    .article-card__preview {
      display: -webkit-box;
      max-width: 44rem;
      margin-top: 0.85rem;
      overflow: hidden;
      color: var(--text-secondary, inherit);
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      line-height: 1.55;
    }

    .article-card__link {
      width: fit-content;
      margin-top: 1.5rem;
      color: var(--primary);
      text-decoration: none;
    }
    .article-card__link mat-icon {
      width: 1.05rem;
      height: 1.05rem;
      font-size: 1.05rem;
      transition: transform 180ms ease;
    }
    .article-card:hover .article-card__link mat-icon {
      transform: translateX(0.22rem);
    }

    .empty-state {
      display: grid;
      min-height: 15rem;
      place-content: center;
      padding: 2rem;
      border: 1px dashed color-mix(in srgb, var(--primary) 34%, transparent);
      border-radius: 1.25rem;
      text-align: center;
    }
    .empty-state mat-icon {
      width: 2rem;
      height: 2rem;
      margin: 0 auto 0.75rem;
      color: var(--primary);
      font-size: 2rem;
    }
    .empty-state h2 {
      margin: 0;
      font-size: 1.2rem;
    }
    .empty-state p {
      margin: 0.5rem 0 0;
      color: var(--text-secondary, inherit);
    }

    @media (max-width: 48rem) {
      .blogs-page {
        width: min(100% - 1.25rem, 76rem);
      }
      .article-card,
      .article-card.featured {
        grid-column: span 12;
        min-height: 18rem;
      }
      .feed-heading {
        align-items: start;
        flex-direction: column;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .article-card,
      .article-card__link mat-icon {
        transition: none;
      }
      .article-card:hover,
      .article-card:hover .article-card__link mat-icon {
        transform: none;
      }
    }
  `,
})
export default class BlogsComponent {
  blogsStore = inject(BlogsStore);
  sanitizer = inject(DomSanitizer);

  constructor() {
    this.blogsStore.getBlogs();
  }
}
