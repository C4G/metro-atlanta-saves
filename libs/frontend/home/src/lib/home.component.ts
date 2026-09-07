import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import {
  DescriptionStore,
  IntroductionStore,
  LearningsStore,
  StoriesStore,
  ThemeService,
  WhatWeAreStore,
} from '@mas/frontend-shared-data-access';
import { FooterComponent } from '@mas/frontend-shared-layout';

@Component({
  selector: 'mas-home',
  imports: [MatIconModule, FooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let intro = introductionStore.introduction();
    @if (intro.hidden) {
      <h1 class="sr-only">{{ intro.title }}</h1>
    } @else {
      <section class="relative isolate overflow-hidden bg-gray-950 text-white">
        @if (!intro.imageHidden) {
          <img
            class="landing-hero-image absolute inset-0 -z-20 h-full w-full object-cover"
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
              class="landing-hero-cta mt-8 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:ring-offset-2 focus:ring-offset-gray-950"
              href="#start"
            >
              Explore the program
              <mat-icon class="!h-4 !w-4 !text-base !leading-4">arrow_downward</mat-icon>
            </a>
          </div>
        </div>
      </section>
    }

    @if (descriptionStore.description(); as description) {
      @if (!description.hidden) {
        <section id="start" class="landing-introduction bg-white px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
          <div class="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div class="flex justify-center lg:justify-start">
              <div
                class="brand-logo-frame flex aspect-square w-48 items-center justify-center rounded-3xl bg-amber-50 p-6 sm:w-56"
              >
                <img
                  src="assets/Logo/brp-logo-community-no-arrow.png?v=1"
                  class="brand-logo h-full w-full object-contain"
                  width="224"
                  height="224"
                  alt="Building Resilient Professionals logo"
                />
              </div>
            </div>
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">A practical path forward</p>
              <h2 class="mt-3 font-serif text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                {{ description.title }}
              </h2>
              <div
                class="home-rich-text wysiwyg mt-6 max-w-2xl text-base leading-7 text-slate-600"
                [innerHTML]="sanitizer.bypassSecurityTrustHtml(description.body)"
              ></div>
              @if (description.buttonLink && description.buttonText) {
                <div class="mt-8 flex justify-end">
                  <a
                    class="landing-enroll-cta inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2"
                    [href]="description.buttonLink"
                  >
                    {{ description.buttonText }}
                    <mat-icon class="!h-4 !w-4 !text-base !leading-4">arrow_forward</mat-icon>
                  </a>
                </div>
              }
            </div>
          </div>
        </section>
      }
    }

    @if (visibleLearnings().length) {
      <section class="landing-learning bg-[#f3f8f5] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div class="mx-auto max-w-5xl">
          <div class="max-w-2xl">
            <p class="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Build your knowledge</p>
            <h2 class="mt-3 font-serif text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              What the program is built for
            </h2>
            <p class="mt-4 text-base leading-7 text-slate-600">
              Explore the reason behind the program, what it aims to change, and what participants receive.
            </p>
          </div>
          @let learning = activeLearning();
          @if (learning) {
            <article class="mt-10 overflow-hidden rounded-3xl border border-teal-100 bg-white shadow-sm">
              <div class="border-b border-teal-100 bg-teal-700 px-7 py-6 text-white sm:px-10">
                <div class="flex items-center justify-between gap-5">
                  <div class="flex items-center gap-4">
                    <span
                      class="flex h-10 w-10 items-center justify-center rounded-full bg-amber-300 text-sm font-bold text-slate-950"
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
                  class="learning-rich-text wysiwyg max-w-3xl text-base leading-8 text-slate-700"
                  [innerHTML]="sanitizer.bypassSecurityTrustHtml(learning.body)"
                ></div>
                <div class="mt-10 flex items-center justify-between gap-4 border-t border-slate-100 pt-6">
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 text-sm font-bold text-slate-700 transition-colors hover:text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    (click)="previousLearning()"
                  >
                    <mat-icon>arrow_back</mat-icon>
                    Previous
                  </button>
                  <div class="flex gap-2" aria-label="Program topic selection">
                    @for (item of visibleLearnings(); track item.id; let index = $index) {
                      <button
                        type="button"
                        class="h-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-teal-600"
                        [class.w-7]="learningIndex() === index"
                        [class.bg-teal-700]="learningIndex() === index"
                        [class.w-2]="learningIndex() !== index"
                        [class.bg-slate-300]="learningIndex() !== index"
                        [attr.aria-label]="'Show ' + item.title"
                        (click)="showLearning(index)"
                      ></button>
                    }
                  </div>
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 text-sm font-bold text-slate-700 transition-colors hover:text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
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
      <section class="landing-stories bg-white px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div class="mx-auto max-w-5xl">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Community stories</p>
              <h2 class="mt-3 font-serif text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                Progress looks different for everyone
              </h2>
            </div>
            <p class="max-w-sm text-sm leading-6 text-slate-500">Hear from people putting their goals into action.</p>
          </div>
          @let story = activeStory();
          @if (story) {
            <article
              class="landing-story-card mt-10 overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl md:grid md:grid-cols-[0.85fr_1.15fr]"
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
                <p class="mt-5 max-w-xl text-lg leading-8 text-slate-200">{{ story.description }}</p>
                <div class="mt-auto flex items-end justify-between gap-5 pt-10">
                  <div>
                    <h3 class="font-serif text-xl font-semibold">{{ story.name }}</h3>
                    <p class="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-teal-300">Participant story</p>
                  </div>
                  <div class="flex gap-2">
                    <button
                      type="button"
                      class="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:bg-white hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-amber-300"
                      aria-label="Previous story"
                      (click)="previousStory()"
                    >
                      <mat-icon>arrow_back</mat-icon>
                    </button>
                    <button
                      type="button"
                      class="flex h-10 w-10 items-center justify-center rounded-full bg-teal-400 text-slate-950 transition-colors hover:bg-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-200"
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
                  class="h-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-teal-600"
                  [class.w-7]="storyIndex() === index"
                  [class.bg-teal-700]="storyIndex() === index"
                  [class.w-2]="storyIndex() !== index"
                  [class.bg-slate-300]="storyIndex() !== index"
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
      <section class="landing-alliance bg-gray-950 px-5 py-16 text-white sm:px-8 lg:px-12 lg:py-24">
        <div class="mx-auto max-w-7xl">
          <div class="max-w-2xl">
            <p class="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">The alliance</p>
            <h2 class="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Support that meets you where you are</h2>
          </div>
          <div class="mt-10 grid gap-4 md:grid-cols-2">
            <article class="rounded-2xl border border-white/10 bg-white/5 p-7">
              <mat-icon class="text-emerald-300">groups</mat-icon>
              <h3 class="mt-5 text-xl font-bold">Who we are</h3>
              <p class="mt-3 leading-7 text-gray-300">{{ wwa.whoWeAreDescription }}</p>
            </article>
            <article class="rounded-2xl border border-white/10 bg-white/5 p-7">
              <mat-icon class="text-emerald-300">trending_up</mat-icon>
              <h3 class="mt-5 text-xl font-bold">What we do</h3>
              <p class="mt-3 leading-7 text-gray-300">{{ wwa.whatWeDoDescription }}</p>
            </article>
          </div>
          <a
            class="mt-8 inline-flex items-center gap-2 text-sm font-bold text-emerald-300 transition-colors hover:text-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            href="/about-us"
          >
            Learn more about us
            <mat-icon class="!h-4 !w-4 !text-base !leading-4">arrow_forward</mat-icon>
          </a>
        </div>
      </section>
    }
    @if (learningsStore.learnings() && descriptionStore.description()) {
      <mas-footer />
    }
  `,
  styles: [
    `
      .landing-hero-cta {
        background-color: #0f766e;
        color: #ecfeff;
      }
      .landing-hero-cta:hover {
        background-color: #115e59;
        color: #ecfeff;
      }
      .landing-enroll-cta {
        background-color: #ccfbf1;
        color: #134e4a;
      }
      .landing-enroll-cta:hover {
        background-color: #99f6e4;
        color: #134e4a;
      }
      :host(.landing-page--dark) {
        display: block;
        background: #0c1222;
      }
      :host(.landing-page--dark) ::ng-deep .landing-hero-image {
        filter: brightness(0.62) saturate(0.82);
      }
      :host(.landing-page--dark) ::ng-deep .landing-introduction {
        background: #0c1222 !important;
      }
      :host(.landing-page--dark) ::ng-deep .bg-white {
        background-color: #151b2e !important;
      }
      :host(.landing-page--dark) ::ng-deep .landing-learning {
        background-color: #090f1d !important;
      }
      :host(.landing-page--dark) ::ng-deep .landing-stories {
        background-color: #0b1324 !important;
      }
      :host(.landing-page--dark) ::ng-deep .bg-slate-900 {
        background-color: #1a1f3a !important;
      }
      :host(.landing-page--dark) ::ng-deep .landing-alliance {
        background-color: #090f1d !important;
      }
      :host(.landing-page--dark) ::ng-deep .landing-alliance article {
        background-color: #151b2e !important;
        border-color: rgba(255, 255, 255, 0.12) !important;
      }
      :host(.landing-page--dark) ::ng-deep .border-gray-200,
      :host(.landing-page--dark) ::ng-deep .border-slate-100,
      :host(.landing-page--dark) ::ng-deep .border-teal-100 {
        border-color: rgba(255, 255, 255, 0.12) !important;
      }
      :host(.landing-page--dark) ::ng-deep .text-slate-900,
      :host(.landing-page--dark) ::ng-deep .text-slate-950 {
        color: #f1f5f9 !important;
      }
      :host(.landing-page--dark) ::ng-deep .text-slate-700,
      :host(.landing-page--dark) ::ng-deep .text-slate-600 {
        color: #cbd5e1 !important;
      }
      :host(.landing-page--dark) ::ng-deep .text-slate-500 {
        color: #94a3b8 !important;
      }
      :host(.landing-page--dark) .landing-hero-cta,
      :host(.landing-page--dark) .landing-enroll-cta {
        background-color: #2dd4bf !important;
        color: #082f2e !important;
      }
      :host(.landing-page--dark) .landing-hero-cta:hover,
      :host(.landing-page--dark) .landing-enroll-cta:hover {
        background-color: #99f6e4 !important;
        color: #082f2e !important;
      }
      :host(.landing-page--dark) ::ng-deep .bg-amber-50 {
        background-color: rgba(251, 191, 36, 0.12) !important;
      }
      :host(.landing-page--dark) .brand-logo-frame {
        background: linear-gradient(145deg, #12334a, #0f766e) !important;
        box-shadow: 0 18px 42px rgba(3, 15, 29, 0.35);
      }
      :host(.landing-page--dark) .brand-logo {
        filter: brightness(0) saturate(100%) invert(89%) sepia(23%) saturate(731%) hue-rotate(119deg) brightness(101%)
          contrast(96%);
      }
      :host(.landing-page--dark) ::ng-deep .bg-amber-100 {
        background-color: rgba(251, 191, 36, 0.16) !important;
      }
      :host(.landing-page--dark) ::ng-deep .text-amber-800 {
        color: #fde68a !important;
      }
      :host(.landing-page--dark) ::ng-deep .bg-slate-300 {
        background-color: #475569 !important;
      }
      :host(.landing-page--dark) ::ng-deep .shadow-sm,
      :host(.landing-page--dark) ::ng-deep .shadow-xl {
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.28) !important;
      }
      :host(.landing-page--dark) ::ng-deep .home-rich-text ol > li {
        border-color: rgba(45, 212, 191, 0.2);
        background: #1a2739;
        color: #dbeafe;
      }
      :host(.landing-page--dark) ::ng-deep .learning-rich-text ul > li {
        color: #cbd5e1;
      }
      :host(.landing-page--dark) ::ng-deep .home-rich-text a {
        color: #5eead4;
      }
      :host(.landing-page--dark) ::ng-deep mas-footer footer {
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        background: #090f1d;
        color: #94a3b8;
      }
      :host(.landing-page--dark) ::ng-deep mas-footer a {
        color: #99f6e4;
      }
      :host ::ng-deep .home-rich-text ol {
        counter-reset: home-step;
        display: grid;
        gap: 0.75rem;
        margin: 2rem 0;
        padding: 0;
        list-style: none;
      }
      :host ::ng-deep .home-rich-text ol > li {
        position: relative;
        min-height: 4.5rem;
        padding: 1.1rem 1.25rem 1.1rem 4.5rem;
        border: 1px solid #dbe7e4;
        border-radius: 1rem;
        background: #f7faf9;
        color: #334155;
        counter-increment: home-step;
      }
      :host ::ng-deep .home-rich-text ol > li::before {
        content: counter(home-step);
        position: absolute;
        top: 1rem;
        left: 1rem;
        display: grid;
        width: 2.25rem;
        height: 2.25rem;
        place-items: center;
        border-radius: 9999px;
        background: #0f766e;
        color: #fff;
        font-size: 0.8rem;
        font-weight: 700;
      }
      :host ::ng-deep .learning-rich-text ul {
        display: grid;
        gap: 0.75rem;
        margin: 1.4rem 0;
        padding: 0;
        list-style: none;
      }
      :host ::ng-deep .learning-rich-text ul > li {
        position: relative;
        padding-left: 1.4rem;
        color: #334155;
      }
      :host ::ng-deep .learning-rich-text ul > li::before {
        content: '';
        position: absolute;
        top: 0.58rem;
        left: 0;
        width: 0.5rem;
        height: 0.5rem;
        border-radius: 9999px;
        background: #0f766e;
      }
      :host ::ng-deep .home-rich-text a {
        color: #0f766e;
        font-weight: 600;
      }
    `,
  ],
  host: { class: 'block landing-page', '[class.landing-page--dark]': 'themeService.darkMode()' },
})
export class HomeComponent {
  readonly descriptionStore = inject(DescriptionStore);
  readonly storiesStore = inject(StoriesStore);
  readonly introductionStore = inject(IntroductionStore);
  readonly learningsStore = inject(LearningsStore);
  readonly whatWeAreStore = inject(WhatWeAreStore);
  readonly themeService = inject(ThemeService);
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
