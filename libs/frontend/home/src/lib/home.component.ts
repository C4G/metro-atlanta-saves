import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { DescriptionStore, IntroductionStore, WhatWeAreStore } from '@mas/frontend-shared-data-access';
import { htmlToText } from '@mas/frontend-shared-util';

type FinancialFact = {
  description: string;
  statistic: string;
};

type PartnerContent = {
  description: string;
  name: string;
  shortName: string;
};

type ProgramContent = {
  description: string;
  title: string;
};

const DEFAULT_HERO_IMAGE = '/assets/background/atlanta-cohort.webp';
const DEFAULT_HERO_ALT = 'Financial Wellbeing Alliance participants pose together in front of graduation decorations';
const PROGRAM_ICONS = ['savings', 'groups', 'storefront', 'trending_up'] as const;

export const initialsFor = (name: string) => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1 && /^[A-Z0-9]{2,5}$/.test(words[0])) return words[0];
  return words
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 3);
};

@Component({
  selector: 'mas-home',
  imports: [MatIcon, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let intro = introductionStore.introduction();
    @if (intro.id !== '-1') {
      @if (intro.hidden) {
        <h1 class="sr-only">{{ intro.title }}</h1>
      } @else {
        <section class="mx-auto w-full max-w-7xl px-3 pt-4 sm:px-6 sm:pt-6 lg:px-8" aria-labelledby="home-hero-title">
          <div
            class="relative isolate flex min-h-[35rem] items-end overflow-hidden rounded-3xl border border-outline/65 bg-gray-950 text-white shadow-xl"
          >
            @if (!intro.imageHidden) {
              @if (usesDefaultHeroImage()) {
                <picture>
                  <source media="(max-width: 640px)" srcset="/assets/background/atlanta-cohort-640w.webp 640w" />
                  <source
                    media="(max-width: 1080px)"
                    srcset="
                      /assets/background/atlanta-cohort-828w.webp   828w,
                      /assets/background/atlanta-cohort-1080w.webp 1080w
                    "
                    sizes="100vw"
                  />
                  <source srcset="/assets/background/atlanta-cohort-1920w.webp 1920w" />
                  <img
                    class="absolute inset-0 -z-20 h-full w-full object-cover"
                    ngSrc="/assets/background/atlanta-cohort.webp"
                    [alt]="heroImageAlt()"
                    fill
                    priority
                    sizes="100vw"
                  />
                </picture>
              } @else {
                <img
                  class="absolute inset-0 -z-20 h-full w-full object-cover"
                  [ngSrc]="heroImageUrl()"
                  [alt]="heroImageAlt()"
                  fill
                  priority
                  sizes="100vw"
                />
              }
            }
            <div
              class="absolute inset-0 -z-10 bg-gradient-to-t from-gray-950/95 via-gray-950/75 to-gray-950/20 lg:bg-gradient-to-r lg:from-gray-950/90 lg:via-gray-950/70 lg:to-gray-950/25"
              aria-hidden="true"
            ></div>
            <div class="max-w-2xl p-5 sm:p-9 lg:p-12">
              @if (intro.eyebrow) {
                <span
                  class="inline-flex items-center gap-1.5 rounded-full border border-white/35 bg-white/10 px-2.5 py-1 text-xs font-bold text-teal-100 backdrop-blur"
                >
                  <mat-icon class="mas-icon-sm" aria-hidden="true">school</mat-icon>
                  {{ intro.eyebrow }}
                </span>
              }
              <h1
                id="home-hero-title"
                class="mt-4 text-balance font-serif text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl"
              >
                {{ heroHeading() }}
              </h1>
              @if (heroSubheading()) {
                <p class="mt-3 text-balance font-serif text-2xl font-semibold text-teal-200 sm:text-3xl">
                  {{ heroSubheading() }}
                </p>
              }
              <p class="mt-5 max-w-xl text-base leading-7 text-slate-200 sm:text-lg">{{ intro.description }}</p>
              @if (heroCtaText()) {
                <a
                  class="mt-7 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-teal-200 bg-teal-200 px-5 text-sm font-bold text-teal-950 transition-colors hover:bg-teal-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-200 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 sm:w-auto"
                  href="#programs"
                >
                  {{ heroCtaText() }}
                </a>
              }
            </div>
          </div>
        </section>
      }
    }

    @if (descriptionStore.description(); as description) {
      @if (!description.hidden) {
        <section
          id="programs"
          class="mx-auto w-full max-w-7xl scroll-mt-24 px-3 pt-10 sm:px-6 sm:pt-14 lg:px-8 lg:pt-16"
          aria-labelledby="home-programs-title"
        >
          <div class="flex max-w-2xl flex-col items-start gap-2.5">
            @if (programsEyebrow()) {
              <span [class]="chipClass">{{ programsEyebrow() }}</span>
            }
            <h2 id="home-programs-title" [class]="headingClass">{{ programsTitle() }}</h2>
            @if (programsDescription()) {
              <p class="text-base leading-7 text-ink-muted">{{ programsDescription() }}</p>
            }
          </div>
          <div class="mt-5 grid gap-3 sm:mt-7 md:grid-cols-2 md:gap-4">
            @for (program of programs(); track program.title; let index = $index) {
              @let open = expandedProgram() === index;
              <article [class]="cardClass + ' flex flex-col gap-3 rounded-2xl p-4 sm:p-5'">
                <div class="flex items-center gap-3">
                  <span [class]="tileClass" aria-hidden="true">
                    <mat-icon class="mas-icon-md">{{ program.icon }}</mat-icon>
                  </span>
                  <h3 class="text-lg font-bold leading-6 text-ink">{{ program.title }}</h3>
                </div>
                <p class="text-sm leading-6 text-ink-muted" [class.line-clamp-3]="!open" [id]="'program-text-' + index">
                  {{ program.description }}
                </p>
                <button
                  type="button"
                  class="mt-auto inline-flex min-h-8 items-center gap-0.5 self-start rounded-lg px-1 text-sm font-bold text-brand-strong underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  [attr.aria-expanded]="open"
                  [attr.aria-controls]="'program-text-' + index"
                  (click)="toggleProgram(index)"
                >
                  {{ open ? 'Show less' : 'Read more' }}
                  <mat-icon class="mas-icon-sm" aria-hidden="true">{{ open ? 'expand_less' : 'expand_more' }}</mat-icon>
                </button>
              </article>
            }
          </div>
        </section>

        <section
          class="mx-auto w-full max-w-7xl px-3 pt-10 sm:px-6 sm:pt-14 lg:px-8 lg:pt-16"
          aria-labelledby="financial-facts-title"
        >
          <div class="overflow-hidden rounded-3xl border border-outline/65 bg-surface/60">
            <div
              class="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-outline/55 px-4 pb-4 pt-5 sm:px-7 sm:pb-5 sm:pt-7"
            >
              <div class="flex max-w-2xl flex-col items-start gap-2.5">
                @if (factsEyebrow()) {
                  <span [class]="chipClass">{{ factsEyebrow() }}</span>
                }
                <h2 id="financial-facts-title" [class]="headingClass">{{ factsTitle() }}</h2>
              </div>
              @if (factsSource()) {
                <p class="flex items-center gap-1.5 text-xs font-bold text-ink-muted">
                  <mat-icon class="mas-icon-sm text-brand-strong" aria-hidden="true">info</mat-icon>
                  {{ factsSource() }}
                </p>
              }
            </div>
            <dl class="grid gap-2.5 p-3 sm:p-5 md:grid-cols-3 md:gap-3 lg:px-7 lg:pb-7">
              @for (fact of financialFacts(); track fact.statistic) {
                <div [class]="rowCardClass + ' flex flex-col gap-2.5 rounded-xl p-5'">
                  <dt
                    class="font-serif text-4xl font-semibold tracking-tight text-brand-strong tabular-nums lg:text-5xl"
                  >
                    {{ fact.statistic }}
                  </dt>
                  <dd class="text-base leading-7 text-ink-muted">{{ fact.description }}</dd>
                </div>
              }
            </dl>
          </div>
        </section>
      }
    }

    @if (whatWeAreStore.whatWeAre(); as whatWeAre) {
      @if (!whatWeAre.hidden) {
        <section
          class="mx-auto w-full max-w-7xl px-3 pb-10 pt-10 sm:px-6 sm:pb-14 sm:pt-14 lg:px-8 lg:pb-16 lg:pt-16"
          aria-labelledby="who-we-are-title"
        >
          <div class="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-12">
            <div class="flex flex-col items-start gap-5 self-start lg:sticky lg:top-24">
              <div class="flex flex-col items-start gap-2.5">
                @if (whoWeAreEyebrow()) {
                  <span [class]="chipClass">{{ whoWeAreEyebrow() }}</span>
                }
                <h2 id="who-we-are-title" [class]="headingClass">{{ whoWeAreTitle() }}</h2>
                <p class="text-base leading-7 text-ink-muted">{{ whoWeAreDescription() }}</p>
              </div>
              @if (aboutUsButtonText()) {
                <a
                  class="inline-flex min-h-11 items-center rounded-xl border border-brand/70 bg-surface-raised px-4 text-sm font-bold text-brand-strong transition-colors hover:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                  [href]="aboutUsLink()"
                >
                  {{ aboutUsButtonText() }}
                </a>
              }
            </div>
            <ul class="grid gap-3 sm:grid-cols-2" aria-label="Partner organizations">
              @for (partner of partners(); track partner.name) {
                <li
                  [class]="
                    rowCardClass + ' flex flex-col gap-2.5 rounded-xl p-4 sm:[&:last-child:nth-child(odd)]:col-span-2'
                  "
                >
                  <div class="flex items-center gap-3">
                    <span
                      class="flex h-10 min-w-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft/80 px-1.5 text-xs font-bold text-brand-strong"
                      aria-hidden="true"
                    >
                      {{ partner.initials }}
                    </span>
                    <div class="min-w-0">
                      <h3 class="text-base font-bold leading-5 text-ink">{{ partner.name }}</h3>
                      @if (partner.shortName) {
                        <p class="text-xs text-ink-muted">{{ partner.shortName }}</p>
                      }
                    </div>
                  </div>
                  <p class="text-sm leading-6 text-ink-muted">{{ partner.description }}</p>
                </li>
              }
            </ul>
          </div>
        </section>
      }
    }
  `,
  host: { class: 'block' },
})
export class HomeComponent {
  readonly descriptionStore = inject(DescriptionStore);
  readonly expandedProgram = signal<number | null>(null);
  readonly chipClass = 'rounded-full border border-brand/40 px-2.5 py-1 text-xs font-bold text-brand-strong';
  readonly headingClass = 'text-balance font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl';
  readonly cardClass =
    'border border-outline/65 bg-surface/60 transition-colors hover:border-brand/70 hover:bg-surface-raised';
  readonly rowCardClass =
    'border border-brand/25 bg-surface-raised/70 transition-colors hover:border-brand/70 hover:bg-surface-raised';
  readonly tileClass =
    'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft/80 text-brand-strong';
  readonly introductionStore = inject(IntroductionStore);
  readonly whatWeAreStore = inject(WhatWeAreStore);
  readonly heroHeading = computed(() => this.splitHeroTitle()[0]);
  readonly heroSubheading = computed(() => this.splitHeroTitle()[1]);
  readonly heroCtaText = computed(() => this.introductionStore.introduction().ctaText.trim());
  readonly heroImageUrl = computed(() => this.introductionStore.introduction().imageUrl);
  readonly heroImageAlt = computed(() => this.introductionStore.introduction().imageText || DEFAULT_HERO_ALT);
  readonly usesDefaultHeroImage = computed(() => this.heroImageUrl() === DEFAULT_HERO_IMAGE);
  readonly programsTitle = computed(() => this.descriptionStore.description()?.title ?? '');
  readonly programsEyebrow = computed(() => this.descriptionStore.description()?.eyebrow ?? '');
  readonly programsDescription = computed(() => htmlToText(this.descriptionStore.description()?.body));
  readonly programs = computed(() => {
    const content = this.parseJsonItems<ProgramContent>(this.descriptionStore.description()?.programsJson);
    return content.map((program, index) => ({ ...program, icon: PROGRAM_ICONS[index] ?? 'savings' }));
  });
  readonly factsEyebrow = computed(() => this.descriptionStore.description()?.factsEyebrow ?? '');
  readonly factsTitle = computed(() => this.descriptionStore.description()?.factsTitle ?? '');
  readonly factsSource = computed(() => this.descriptionStore.description()?.factsSource ?? '');
  readonly financialFacts = computed(() =>
    this.parseJsonItems<FinancialFact>(this.descriptionStore.description()?.factsJson),
  );
  readonly whoWeAreEyebrow = computed(() => this.whatWeAreStore.whatWeAre()?.eyebrow ?? '');
  readonly whoWeAreTitle = computed(() => this.whatWeAreStore.whatWeAre()?.title ?? '');
  readonly whoWeAreDescription = computed(() => this.whatWeAreStore.whatWeAre()?.whoWeAreDescription ?? '');
  readonly aboutUsButtonText = computed(() => this.whatWeAreStore.whatWeAre()?.buttonText ?? '');
  readonly aboutUsLink = computed(() => this.whatWeAreStore.whatWeAre()?.buttonLink ?? '');
  readonly partners = computed(() =>
    this.parseJsonItems<PartnerContent>(this.whatWeAreStore.whatWeAre()?.partnersJson).map((partner) => ({
      ...partner,
      initials: initialsFor(partner.shortName || partner.name),
    })),
  );

  constructor() {
    this.descriptionStore.getDescription();
    this.introductionStore.getIntroduction();
    this.whatWeAreStore.getWhatWeAre();
  }

  toggleProgram(index: number): void {
    this.expandedProgram.set(this.expandedProgram() === index ? null : index);
  }

  private splitHeroTitle(): readonly [string, string] {
    const title = this.introductionStore.introduction().title.trim();
    const separatorIndex = title.indexOf(':');
    if (separatorIndex === -1) return [title, ''];

    return [title.slice(0, separatorIndex).trim(), title.slice(separatorIndex + 1).trim()];
  }

  private parseJsonItems<T>(value: string | undefined): readonly T[] {
    if (!value) return [];

    try {
      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
}
