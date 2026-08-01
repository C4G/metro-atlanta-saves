import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import {
  DescriptionStore,
  IntroductionStore,
  LearningsStore,
  StoriesStore,
  WhatWeAreStore,
} from '@mas/frontend-shared-data-access';
import { FooterComponent, HeroComponent } from '@mas/frontend-shared-layout';

@Component({
  selector: 'mas-home',
  imports: [MatButtonModule, HeroComponent, MatCardModule, MatIconModule, FooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let intro = introductionStore.introduction();
    @if (!$any(intro).hidden) {
      @if ($any(intro).imageHidden) {
        <section class="flex items-center justify-center h-48 bg-gray-900 text-white">
          <h1 class="text-4xl font-bold text-center px-4">{{ intro.title }}</h1>
        </section>
      } @else {
        <mas-hero
          [data]="{
            heading: intro.title,
            imgSrc: intro.imageUrl,
            imgAlt: intro.imageText ?? 'Atlanta Cohort Graduates',
            imgSrcset: '640w, 828w, 1080w, 1920w',
            imgSizes: '100vw',
          }"
        />
      }
    }
    @defer {
      @if (!$any(descriptionStore.description())?.hidden) {
        <section class="px-8 py-10 md:px-16 md:py-10 lg:px-32 lg:py-16">
          <img
            [src]="descriptionStore.description()?.logoUrl || 'assets/Logo/BRP_Logo.webp'"
            class="mx-auto"
            width="406"
            height="219"
            alt="Building Resilient Professionals Logo"
          />
          @if (descriptionStore.description(); as description) {
            <h2 class="text-lg font-semibold mt-4 text-center">{{ description.title }}</h2>
            <div class="wysiwyg" [innerHTML]="sanitizer.bypassSecurityTrustHtml(description.body)"></div>
            <div class="text-center mt-12">
              @if (description.buttonLink && description.buttonText) {
                <a mat-raised-button color="primary" [href]="description.buttonLink" class="mr-auto">
                  {{ description.buttonText }}
                </a>
              }
            </div>
          }
        </section>
      }
      @if (visibleLearnings().length) {
        <section class="bg-gray-800 py-10">
          <h2 class="text-4xl font-bold text-center mb-16 text-white">LEARN MORE</h2>
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 gap-8">
            @for (learning of visibleLearnings(); track learning.id) {
              <mat-card class="shadow-md rounded-lg overflow-hidden p-4">
                <h3 class="text-2xl font-semibold mb-4 text-center lg:text-center">{{ learning.title }}</h3>
                <div [innerHTML]="sanitizer.bypassSecurityTrustHtml(learning.body)" class="wysiwyg"></div>
              </mat-card>
            }
          </div>
        </section>
      }

      @if (visibleStories().length) {
        <section class="bg-gray-800 py-10">
          <h2 class="text-4xl font-bold text-center mb-16 text-white">STORIES</h2>
          <h3 class="text-2xl font-bold text-center mb-6 text-white">Hear from participants!</h3>
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 gap-8">
            @for (story of visibleStories(); track story.name) {
              <mat-card class="lg:!grid lg:!grid-cols-2" appearance="outlined">
                <img
                  mat-card-image
                  [src]="story.imageUrl"
                  width="300"
                  height="100%"
                  alt="Testimonial Image"
                  class="object-cover w-full lg:h-full h-96"
                  loading="lazy"
                />
                <div class="p-6">
                  <h3 class="text-xl font-semibold mb-4 text-center lg:text-left">
                    {{ story.name }}
                  </h3>
                  <p>{{ story.description }}</p>
                </div>
              </mat-card>
            }
          </div>
        </section>
      }

      @let wwa = whatWeAreStore.whatWeAre();
      @if (wwa && !$any(wwa).hidden) {
        <section class="py-20">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-16">
              <div class="flex flex-col">
                <div class="h-full flex flex-col">
                  <div class="p-6 flex-grow">
                    <h3 class="text-xl font-semibold mb-4">WHO WE ARE</h3>
                    <p>{{ wwa.whoWeAreDescription }}</p>
                  </div>
                  <div class="text-center mt-auto">
                    <a mat-raised-button color="primary" href="/about-us" class="mt-4">About Us</a>
                  </div>
                </div>
              </div>
              <div class="flex flex-col">
                <div class="h-full flex flex-col">
                  <div class="p-6 flex-grow">
                    <h3 class="text-xl font-semibold mb-4">WHAT WE DO</h3>
                    <p>{{ wwa.whatWeDoDescription }}</p>
                  </div>
                  <div class="text-center mt-auto">
                    <a mat-raised-button color="primary" href="/about-us" class="mt-4">About Us</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      }

      @if (learningsStore.learnings() && descriptionStore.description()) {
        <mas-footer />
      }
    }
  `,
  host: {
    class: 'block',
  },
})
export class HomeComponent {
  descriptionStore = inject(DescriptionStore);
  storiesStore = inject(StoriesStore);
  introductionStore = inject(IntroductionStore);
  learningsStore = inject(LearningsStore);
  whatWeAreStore = inject(WhatWeAreStore);
  sanitizer = inject(DomSanitizer);

  visibleLearnings = computed(() =>
    this.learningsStore.sectionHidden() ? [] : this.learningsStore.learnings().filter((l) => !l.hidden),
  );
  visibleStories = computed(() =>
    this.storiesStore.sectionHidden() ? [] : this.storiesStore.stories().filter((s) => !s.hidden),
  );

  constructor() {
    this.descriptionStore.getDescription();
    this.introductionStore.getIntroduction();
    this.storiesStore.getStories();
    this.learningsStore.getLearnings();
    this.whatWeAreStore.getWhatWeAre();
  }
}
