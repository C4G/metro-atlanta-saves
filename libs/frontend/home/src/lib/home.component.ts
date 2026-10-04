import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import {
  DescriptionStore,
  IntroductionStore,
  LearningsStore,
  StoriesStore,
  WhatWeAreStore,
} from '@mas/frontend-shared-data-access';
@Component({
  selector: 'mas-home',
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let intro = introductionStore.introduction();
    @if (intro.hidden) {
      <h1 class="sr-only">{{ intro.title }}</h1>
    } @else {
      <section class="relative isolate overflow-hidden bg-gray-950 text-white">
        @if (!intro.imageHidden) {
          <img
            class="absolute inset-0 -z-20 h-full w-full object-cover"
            [src]="intro.imageUrl"
            [alt]="
              intro.imageText ||
              'Financial Wellbeing Alliance participants pose together in front of graduation decorations'
            "
          />
        }
        <div class="absolute inset-0 -z-10 bg-gradient-to-r from-gray-950 via-gray-950/75 to-gray-950/25"></div>
        <div
          class="mx-auto flex min-h-[34rem] max-w-7xl items-end px-5 py-14 sm:px-8 sm:py-20 lg:min-h-[38rem] lg:px-12"
        >
          <div class="max-w-3xl">
            <p class="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-teal-200">Building financial resilience</p>
            <h1 class="max-w-3xl font-serif text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              {{ intro.title }}
            </h1>
            <p class="mt-6 max-w-xl text-base leading-7 text-slate-200 sm:text-lg">
              Tools, guidance, and a community designed to help you build a stronger financial future.
            </p>
            <a
              class="mt-8 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-brand-on transition-colors hover:bg-brand-strong focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-gray-950"
              href="#start"
            >
              Explore the program
              <mat-icon class="landing-inline-icon">arrow_downward</mat-icon>
            </a>
          </div>
        </div>
      </section>
    }

    @if (descriptionStore.description(); as description) {
      @if (!description.hidden) {
        <section id="start" class="bg-surface px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
          <div class="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div class="flex justify-center lg:justify-start">
              <div class="flex aspect-square w-48 items-center justify-center rounded-3xl bg-brand-soft p-6 sm:w-56">
                <img
                  src="assets/Logo/brp-logo-community-no-arrow.png?v=1"
                  class="h-full w-full object-contain [filter:var(--mas-logo-filter)]"
                  width="224"
                  height="224"
                  alt="Building Resilient Professionals logo"
                />
              </div>
            </div>
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">A practical path forward</p>
              <h2 class="mt-3 font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                {{ description.title }}
              </h2>
              <div
                class="wysiwyg mt-6 max-w-2xl text-base leading-7 text-ink-muted [&_a]:font-semibold [&_a]:text-brand [&_ol]:my-8 [&_ol]:grid [&_ol]:list-none [&_ol]:gap-3 [&_ol]:p-0 [&_ol]:[counter-reset:home-step] [&_ol>li]:relative [&_ol>li]:min-h-[4.5rem] [&_ol>li]:rounded-2xl [&_ol>li]:border [&_ol>li]:border-outline [&_ol>li]:bg-surface-subtle [&_ol>li]:py-[1.1rem] [&_ol>li]:pl-[4.5rem] [&_ol>li]:pr-5 [&_ol>li]:text-ink-muted [&_ol>li]:[counter-increment:home-step] [&_ol>li]:before:absolute [&_ol>li]:before:left-4 [&_ol>li]:before:top-4 [&_ol>li]:before:grid [&_ol>li]:before:size-9 [&_ol>li]:before:place-items-center [&_ol>li]:before:rounded-full [&_ol>li]:before:bg-brand [&_ol>li]:before:text-[0.8rem] [&_ol>li]:before:font-bold [&_ol>li]:before:text-brand-on [&_ol>li]:before:content-[counter(home-step)]"
                [innerHTML]="sanitizer.bypassSecurityTrustHtml(description.body)"
              ></div>
            </div>
          </div>
        </section>
      }
    }

    @if (visibleLearnings().length) {
      <section class="bg-canvas px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div class="mx-auto max-w-5xl">
          <div class="max-w-2xl">
            <p class="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Build your knowledge</p>
            <h2 class="mt-3 font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              What the program is built for
            </h2>
            <p class="mt-4 text-base leading-7 text-ink-muted">
              Explore the reason behind the program, what it aims to change, and what participants receive.
            </p>
          </div>
          @let learning = activeLearning();
          @if (learning) {
            <article class="mt-10 overflow-hidden rounded-3xl border border-outline bg-surface">
              <div class="border-b border-outline bg-brand px-7 py-6 text-brand-on sm:px-10">
                <div class="flex items-center justify-between gap-5">
                  <div class="flex items-center gap-4">
                    <span
                      class="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-ink"
                    >
                      0{{ learningIndex() + 1 }}
                    </span>
                    <div>
                      <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-100">
                        Building resilient professionals
                      </p>
                      <h3 class="mt-1 font-serif text-3xl font-semibold">{{ learning.title }}</h3>
                    </div>
                  </div>
                  <mat-icon class="text-amber-200">{{ learningIcon() }}</mat-icon>
                </div>
              </div>
              <div class="p-7 sm:p-10">
                <div
                  class="wysiwyg max-w-3xl text-base leading-8 text-ink-muted [&_ul]:my-[1.4rem] [&_ul]:grid [&_ul]:list-none [&_ul]:gap-3 [&_ul]:p-0 [&_ul>li]:relative [&_ul>li]:pl-[1.4rem] [&_ul>li]:text-ink-muted [&_ul>li]:before:absolute [&_ul>li]:before:left-0 [&_ul>li]:before:top-[0.58rem] [&_ul>li]:before:size-2 [&_ul>li]:before:rounded-full [&_ul>li]:before:bg-brand"
                  [innerHTML]="sanitizer.bypassSecurityTrustHtml(learning.body)"
                ></div>
                <div class="mt-10 flex items-center justify-between gap-4 border-t border-outline pt-6">
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 text-sm font-bold text-ink-muted transition-colors hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand"
                    (click)="previousLearning()"
                  >
                    <mat-icon>arrow_back</mat-icon>
                    Previous
                  </button>
                  <div class="flex gap-2" aria-label="Program topic selection">
                    @for (item of visibleLearnings(); track item.id; let index = $index) {
                      <button
                        type="button"
                        class="h-2 rounded-full transition-all [&.landing-dot-inactive]:bg-outline focus:outline-none focus:ring-2 focus:ring-brand"
                        [class.w-7]="learningIndex() === index"
                        [class.bg-teal-700]="learningIndex() === index"
                        [class.w-2]="learningIndex() !== index"
                        [class.landing-dot-inactive]="learningIndex() !== index"
                        [attr.aria-label]="'Show ' + item.title"
                        (click)="showLearning(index)"
                      ></button>
                    }
                  </div>
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 text-sm font-bold text-ink-muted transition-colors hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand"
                    (click)="nextLearning()"
                  >
                    Next
                    <mat-icon>arrow_forward</mat-icon>
                  </button>
                </div>
              </div>
            </article>
          }
        </div>
      </section>
    }

    @if (visibleStories().length) {
      <section class="bg-surface px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div class="mx-auto max-w-5xl">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Community stories</p>
              <h2 class="mt-3 font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                Progress looks different for everyone
              </h2>
            </div>
            <p class="max-w-sm text-sm leading-6 text-ink-subtle">Hear from people putting their goals into action.</p>
          </div>
          @let story = activeStory();
          @if (story) {
            <article
              class="mt-10 overflow-hidden rounded-3xl bg-surface-raised text-ink md:grid md:grid-cols-[0.85fr_1.15fr]"
            >
              <img
                [src]="story.imageUrl"
                width="600"
                height="500"
                alt="{{ story.name }}'s story"
                class="h-72 w-full object-cover md:h-full"
                loading="lazy"
              />
              <div class="flex min-h-80 flex-col p-7 sm:p-10">
                <span class="font-serif text-6xl leading-none text-amber-300">“</span>
                <p class="mt-5 max-w-xl text-lg leading-8 text-ink-muted">{{ story.description }}</p>
                <div class="mt-auto flex items-end justify-between gap-5 pt-10">
                  <div>
                    <h3 class="font-serif text-xl font-semibold">{{ story.name }}</h3>
                    <p class="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-teal-300">Participant story</p>
                  </div>
                  <div class="flex gap-2">
                    <button
                      type="button"
                      class="flex h-10 w-10 items-center justify-center rounded-full border border-outline text-ink transition-colors hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand"
                      aria-label="Previous story"
                      (click)="previousStory()"
                    >
                      <mat-icon>arrow_back</mat-icon>
                    </button>
                    <button
                      type="button"
                      class="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-brand-on transition-colors hover:bg-brand-strong focus:outline-none focus:ring-2 focus:ring-brand"
                      aria-label="Next story"
                      (click)="nextStory()"
                    >
                      <mat-icon>arrow_forward</mat-icon>
                    </button>
                  </div>
                </div>
              </div>
            </article>
            <div class="mt-5 flex justify-center gap-2" aria-label="Story selection">
              @for (item of visibleStories(); track item.id; let index = $index) {
                <button
                  type="button"
                  class="h-2 rounded-full transition-all [&.landing-dot-inactive]:bg-outline focus:outline-none focus:ring-2 focus:ring-brand"
                  [class.w-7]="storyIndex() === index"
                  [class.bg-teal-700]="storyIndex() === index"
                  [class.w-2]="storyIndex() !== index"
                  [class.landing-dot-inactive]="storyIndex() !== index"
                  [attr.aria-label]="'Show story ' + (index + 1)"
                  (click)="showStory(index)"
                ></button>
              }
            </div>
          }
        </div>
      </section>
    }

    @let wwa = whatWeAreStore.whatWeAre();
    @if (wwa && !wwa.hidden) {
      <section class="bg-canvas px-5 py-16 text-ink sm:px-8 lg:px-12 lg:py-24">
        <div class="mx-auto max-w-7xl">
          <div class="max-w-2xl">
            <p class="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">The alliance</p>
            <h2 class="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Support that meets you where you are</h2>
          </div>
          <div class="mt-10 grid gap-4 md:grid-cols-2">
            <article class="rounded-2xl border border-outline bg-surface p-7">
              <mat-icon class="text-emerald-300">groups</mat-icon>
              <h3 class="mt-5 text-xl font-bold">Who we are</h3>
              <p class="mt-3 leading-7 text-ink-muted">{{ wwa.whoWeAreDescription }}</p>
            </article>
            <article class="rounded-2xl border border-outline bg-surface p-7">
              <mat-icon class="text-emerald-300">trending_up</mat-icon>
              <h3 class="mt-5 text-xl font-bold">What we do</h3>
              <p class="mt-3 leading-7 text-ink-muted">{{ wwa.whatWeDoDescription }}</p>
            </article>
          </div>
          <a
            class="mt-8 inline-flex items-center gap-2 text-sm font-bold text-emerald-300 transition-colors hover:text-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            href="/about-us"
          >
            Learn more about us
            <mat-icon class="landing-inline-icon">arrow_forward</mat-icon>
          </a>
        </div>
      </section>
    }
  `,
  styles: [
    `
      .landing-inline-icon {
        width: 1rem;
        height: 1rem;
        font-size: 1rem;
        line-height: 1rem;
      }
    `,
  ],
  host: { class: 'block bg-surface' },
})
export class HomeComponent {
  readonly descriptionStore = inject(DescriptionStore);
  readonly storiesStore = inject(StoriesStore);
  readonly introductionStore = inject(IntroductionStore);
  readonly learningsStore = inject(LearningsStore);
  readonly whatWeAreStore = inject(WhatWeAreStore);
  readonly sanitizer = inject(DomSanitizer);
  readonly visibleLearnings = computed(() =>
    this.learningsStore.sectionHidden() ? [] : this.learningsStore.learnings().filter((learning) => !learning.hidden),
  );
  readonly visibleStories = computed(() =>
    this.storiesStore.sectionHidden() ? [] : this.storiesStore.stories().filter((story) => !story.hidden),
  );
  readonly learningIndex = signal(0);
  readonly activeLearning = computed(() => {
    const learnings = this.visibleLearnings();
    return learnings[this.learningIndex() % learnings.length];
  });
  readonly storyIndex = signal(0);
  readonly activeStory = computed(() => {
    const stories = this.visibleStories();
    return stories[this.storyIndex() % stories.length];
  });
  constructor() {
    this.descriptionStore.getDescription();
    this.introductionStore.getIntroduction();
    this.storiesStore.getStories();
    this.learningsStore.getLearnings();
    this.whatWeAreStore.getWhatWeAre();
  }
  showStory(index: number): void {
    this.storyIndex.set(index);
  }
  showLearning(index: number): void {
    this.learningIndex.set(index);
  }
  previousLearning(): void {
    const length = this.visibleLearnings().length;
    if (length) this.learningIndex.update((index) => (index - 1 + length) % length);
  }
  nextLearning(): void {
    const length = this.visibleLearnings().length;
    if (length) this.learningIndex.update((index) => (index + 1) % length);
  }
  learningIcon(): string {
    return ['lightbulb', 'flag', 'school'][this.learningIndex() % 3];
  }
  previousStory(): void {
    const length = this.visibleStories().length;
    if (length) this.storyIndex.update((index) => (index - 1 + length) % length);
  }
  nextStory(): void {
    const length = this.visibleStories().length;
    if (length) this.storyIndex.update((index) => (index + 1) % length);
  }
}
