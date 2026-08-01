import { IMAGE_LOADER, ImageLoaderConfig, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

type HeroData = {
  heading: string;
  imgSrc: string;
  imgAlt: string;
  imgSrcset?: string;
  imgSizes?: string;
};

@Component({
  selector: 'mas-hero',
  imports: [NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: IMAGE_LOADER,
      useValue: (config: ImageLoaderConfig) => {
        // Extract base path and extension
        const lastDotIndex = config.src.lastIndexOf('.');
        const basePath = config.src.substring(0, lastDotIndex);
        const extension = config.src.substring(lastDotIndex);

        // If width is specified, modify the URL to include the width
        if (config.width) {
          return `${basePath}-${config.width}w${extension}`;
        }

        // If no width specified, return original URL
        return config.src;
      },
    },
  ],
  template: `
    <section class="relative h-dvh text-center text-white">
      <h1 class="absolute block w-full z-20 mt-28 text-4xl font-bold">{{ data().heading }}</h1>
      <div class="absolute inset-0 h-full w-full bg-black opacity-40 z-10"></div>
      <img
        class="object-cover h-full w-full"
        [ngSrc]="data().imgSrc"
        [alt]="data().imgAlt"
        priority
        fill
        [ngSrcset]="data().imgSrcset ?? '640w'"
        [sizes]="data().imgSizes || '100vw'"
      />
    </section>
  `,
  host: {
    class: 'block',
  },
})
export class HeroComponent {
  data = input.required<HeroData>();
  // /assets/background/atlanta-cohort.webp
  // Atlanta Cohort Graduates
}
