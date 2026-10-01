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
    <main
      class="mx-auto w-[min(100%-1.25rem,76rem)] py-[clamp(2rem,5vw,4.5rem)] pb-[clamp(3.5rem,7vw,6rem)] sm:w-[min(100%-2rem,76rem)]"
    >
      <section
        class="max-w-3xl rounded-[1.75rem] border border-[color-mix(in_srgb,var(--primary)_18%,transparent)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_11%,transparent),transparent_62%)] p-[clamp(1.75rem,4vw,3rem)]"
        aria-labelledby="blogs-heading"
      >
        <p class="mb-2.5 text-xs font-extrabold uppercase tracking-[0.11em] text-[var(--primary)]">
          Community learning
        </p>
        <h1
          id="blogs-heading"
          class="m-0 max-w-[38rem] font-[var(--heading-font,inherit)] text-[clamp(2rem,5vw,3.75rem)] font-bold leading-[1.05] tracking-[-0.045em] text-[var(--text-primary,inherit)]"
        >
          Ideas for stronger financial futures.
        </h1>
        <p class="mb-0 mt-5 max-w-[38rem] text-[1.05rem] leading-[1.7] text-[var(--text-secondary,inherit)]">
          Practical guidance, stories, and tools to help people build confidence with money—one step at a time.
        </p>
      </section>

      <section class="mt-[clamp(3rem,7vw,5.5rem)]" aria-labelledby="articles-heading">
        <div class="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p class="mb-1 text-xs font-extrabold uppercase tracking-[0.11em] text-[var(--primary)]">Explore</p>
            <h2
              id="articles-heading"
              class="m-0 font-[var(--heading-font,inherit)] text-[clamp(1.5rem,3vw,2.1rem)] tracking-[-0.03em] text-[var(--text-primary,inherit)]"
            >
              Latest from BRP
            </h2>
          </div>
          <p class="m-0 whitespace-nowrap text-sm text-[var(--text-secondary,inherit)]">
            {{ blogsStore.blogs().length }} articles
          </p>
        </div>

        @if (blogsStore.blogs().length) {
          <div class="grid grid-cols-12 gap-4">
            @for (blog of blogsStore.blogs(); track blog.id; let first = $first) {
              <article
                class="group col-span-12 flex min-h-72 flex-col rounded-[1.25rem] border border-[color-mix(in_srgb,var(--text-primary,currentColor)_12%,transparent)] bg-[var(--surface-card,var(--mat-sys-surface-container-low,transparent))] p-6 transition hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--primary)_48%,transparent)] hover:bg-[color-mix(in_srgb,var(--primary)_6%,var(--surface-card,transparent))] motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:min-h-84 sm:[&:not(.featured)]:col-span-4 sm:[&.featured]:col-span-8 sm:[&.featured]:min-h-96 sm:[&.featured]:bg-[linear-gradient(145deg,color-mix(in_srgb,var(--primary)_13%,var(--surface-card,transparent)),var(--surface-card,transparent)_62%)]"
                [class.featured]="first"
              >
                <div class="flex items-center justify-between gap-3 text-[0.78rem] font-bold">
                  <span class="uppercase tracking-[0.08em] text-[var(--primary)]">
                    {{ first ? 'Featured insight' : 'Community resource' }}
                  </span>
                  <time
                    class="font-medium text-[var(--text-secondary,inherit)]"
                    [attr.datetime]="blog.updatedAt | date: 'yyyy-MM-dd'"
                  >
                    {{ blog.updatedAt | date: 'MMM d, y' }}
                  </time>
                </div>

                <div class="mt-auto">
                  <h3
                    class="m-0 font-[var(--heading-font,inherit)] text-[1.35rem] leading-[1.2] tracking-[-0.025em] text-[var(--text-primary,inherit)]"
                    [class.!text-[clamp(1.65rem,3vw,2.4rem)]]="first"
                    [class.max-w-2xl]="first"
                  >
                    {{ blog.title }}
                  </h3>
                  @if (blog.subTitle) {
                    <p class="mb-0 mt-2.5 text-base leading-6 text-[var(--text-secondary,inherit)]">
                      {{ blog.subTitle }}
                    </p>
                  }
                  <div
                    class="mt-3.5 line-clamp-2 max-w-[44rem] overflow-hidden leading-[1.55] text-[var(--text-secondary,inherit)]"
                    [innerHTML]="sanitizer.bypassSecurityTrustHtml(blog.body)"
                  ></div>
                </div>

                <a
                  class="mt-6 flex w-fit items-center justify-between gap-3 text-[0.78rem] font-bold text-[var(--primary)] no-underline"
                  [routerLink]="'/blogs/' + blog.slug"
                >
                  Read article
                  <mat-icon
                    class="!size-[1.05rem] !text-[1.05rem] transition-transform group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                    aria-hidden="true"
                  >
                    arrow_forward
                  </mat-icon>
                </a>
              </article>
            }
          </div>
        } @else {
          <div
            class="grid min-h-60 place-content-center rounded-[1.25rem] border border-dashed border-[color-mix(in_srgb,var(--primary)_34%,transparent)] p-8 text-center"
          >
            <mat-icon class="!mx-auto !mb-3 !size-8 !text-[2rem] !text-[var(--primary)]" aria-hidden="true">
              menu_book
            </mat-icon>
            <h2 class="m-0 font-[var(--heading-font,inherit)] text-xl text-[var(--text-primary,inherit)]">
              New stories are on their way.
            </h2>
            <p class="mb-0 mt-2 text-[var(--text-secondary,inherit)]">
              Check back soon for practical insights and community updates.
            </p>
          </div>
        }
      </section>
    </main>
    <mas-footer />
  `,
  host: { class: 'flex min-h-full flex-col' },
})
export default class BlogsComponent {
  blogsStore = inject(BlogsStore);
  sanitizer = inject(DomSanitizer);

  constructor() {
    this.blogsStore.getBlogs();
  }
}
