import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { FooterComponent, HeroComponent } from '@mas/frontend-shared-layout';
import { CohortsStore } from '@mas/frontend-shared-data-access';

@Component({
  selector: 'mas-about-us',
  imports: [HeroComponent, MatButtonModule, MatCardModule, MatIconModule, FooterComponent, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mas-hero
      [data]="{
        heading: 'About us',
        imgSrc: '/assets/background/atlanta-cohort.webp',
        imgAlt: 'Financial Wellbeing Alliance participants pose together in front of graduation decorations',
        imgSrcset: '640w, 828w, 1080w, 1920w',
        imgSizes: '100vw',
      }"
    />
    @defer {
      <section class="px-8 py-10 md:px-16 md:py-20 lg:px-32 lg:py-16">
        <h2 class="text-4xl font-bold text-center">WHO WE ARE</h2>
        <p class="text-lg mt-16">
          Building Resilient Professionals is a coalition of champions and agencies who can lead discussions and engage
          others. Our coalition includes the following agencies:
        </p>
        <p class="text-lg font-bold mt-4">Frontline Housing, Inc.</p>
        <p class="text-lg">
          Frontline Housing Inc. is a 501(c)(3) nonprofit organization that aims to make the experience of homelessness
          rare, brief and non-recurring. They meet individuals where they are through regular outreach events in
          Atlanta.
        </p>
        <p class="text-lg font-bold mt-4">Single Parent Alliance and Resource Center (SPARC)</p>
        <p class="text-lg">
          SPARC’s mission is to empower and equip single parents with the necessary tools, resources and support to
          enable them to create a healthy home environment and nurture their children into productive and successful
          adults.
        </p>

        <p class="text-lg font-bold mt-4">United Way of Greater Atlanta</p>
        <p class="text-lg">
          United Way of Greater Atlanta invests in more than 200 programs in 13 counties through the United Way Child
          Well-Being Impact Fund. They also bring together people and resources to tackle complex community issues and
          drive sustainable positive change to help the community thrive.
        </p>
      </section>
      <section class="bg-gray-800 py-20">
        <h2 class="text-4xl font-bold text-center mb-16 text-white">OUR COHORTS</h2>
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-8">
            @for (cohort of cohortsStore.cohorts(); track cohort.name) {
              <mat-card class="rounded-lg shadow-md overflow-hidden flex flex-col gap-4">
                <img
                  [ngSrc]="cohort.imageUrl"
                  [alt]="cohort.name"
                  class="w-full h-80 object-cover"
                  height="320"
                  width="320"
                />
                <div class="p-4">
                  <h3 class="text-xl font-bold mb-2">{{ cohort.name }}</h3>
                  <p>
                    {{ cohort.description }}
                  </p>
                </div>
              </mat-card>
            }
          </div>
        </div>
      </section>
      <mas-footer />
    }
  `,
  host: {
    class: 'block',
  },
})
export class AboutUsComponent {
  cohortsStore = inject(CohortsStore);

  constructor() {
    this.cohortsStore.getCohorts();
  }
}
