import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { DescriptionStore, IntroductionStore, WhatWeAreStore } from '@mas/frontend-shared-data-access';

const DEFAULT_HERO_IMAGE = '/assets/background/atlanta-cohort.webp';
const DEFAULT_HERO_ALT = 'Financial Wellbeing Alliance participants pose together in front of graduation decorations';
const DEFAULT_PROGRAMS_TITLE = 'Explore our financial programs';
const DEFAULT_PROGRAMS_DESCRIPTION =
  'Choose a program designed to help you save, learn, connect, and build lasting financial confidence.';
const DEFAULT_WHO_WE_ARE =
  'Founded in Atlanta, the Housing and Savings Collaborative is dedicated to providing financial solutions that uplift communities and foster economic stability for those in need. We are a collaborative group of Atlanta nonprofits.';

const PROGRAMS = [
  {
    icon: 'savings',
    title: 'Financial Achievement Club',
    description:
      'Financial Achievement Clubs engage families to work as a cohort over 6-8 months. The program requires education, saving and coaching. Upon completion, families that have saved every month for 6 months and attended the required number of learning sessions earn a 1:1 savings match (up to $600) and a $100 incentive for a 30-point improvement in their credit score over the 6 months.',
  },
  {
    icon: 'groups',
    title: 'Building Resilient Professionals',
    description:
      'Building Resilient Professionals (BRP) provides participants with the opportunity to save up to $1,200 over six months through a matched savings program, while also building meaningful connections with other professionals through hybrid sessions and networking lunches. Participants receive individualized coaching and support tailored to their goals, as well as leadership development opportunities through in-person learning sessions and introductions to inspirational leaders in the field.',
  },
  {
    icon: 'storefront',
    title: 'Building Resilient Entrepreneurs',
    description:
      'The Building Resilient Entrepreneurs (BRE) initiative is crafted to assist micro-entrepreneurs and small business owners in establishing and growing their businesses while providing access to capital through matched savings incentives. BRE also offers a curated series of workshops and programming to address the accessibility challenges business owners face in accessing resources that can enhance their technical skills and business acumen.',
  },
  {
    icon: 'trending_up',
    title: 'Wealth Builders United',
    description:
      'Wealth Builders United is a 6-month program focused on teaching strategies and techniques to make investing fun and empowering. Participants will learn the basics of investing with peers and mentors, and upon graduation, they will have up to $1,000 in their brokerage account, which includes a savings match.',
  },
] as const;

const FINANCIAL_FACTS = [
  {
    statistic: '37%',
    description: 'of Americans lack enough money to cover a $400 emergency expense.',
  },
  {
    statistic: '7.41%',
    description: 'Personal saving decreased by 7.41% from February 2024 to February 2025.',
  },
  {
    statistic: '2 years',
    description: 'In the last two years, more Americans feel worse off financially than feel better off.',
  },
] as const;

const PARTNERS = [
  {
    name: 'Community Restoration Project',
    shortName: 'CRP',
    description:
      'CRP sees underserved communities as an opportunity to provide the resources necessary to influence and ensure families and individuals have the tools they need to become self-sufficient and maintain productive and successful lives.',
  },
  {
    name: 'Frontline Housing Inc.',
    shortName: 'Frontline Housing',
    description:
      'Frontline Housing Inc. is a 501(c)(3) nonprofit organization that aims to make the experience of homelessness rare, brief and non-recurring. They meet individuals where they are through regular outreach events in Atlanta.',
  },
  {
    name: 'Housing Plus Inc.',
    shortName: 'Housing Plus',
    description:
      'Housing Plus delivers equitable housing solutions, economic wellness programs, and financial assistance for low-income households.',
  },
  {
    name: 'Los Vecinos de Buford Highway',
    shortName: 'Los Vecinos',
    description:
      'Los Vecinos de Buford Highway serves as a conduit of information and social capital in an effort to bridge the gap between residents in the Buford Highway area and government, housing, schools, and non-profit organizations by providing resources such as education, advocacy, food, and community events.',
  },
  {
    name: 'Single Parent Alliance and Resource Center',
    shortName: 'SPARC',
    description:
      'SPARC’s mission is to empower and equip single parents with the necessary tools, resources and support to enable them to create a healthy home environment and nurture their children into productive and successful adults.',
  },
] as const;

@Component({
  selector: 'mas-home',
  imports: [MatIcon, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let intro = introductionStore.introduction();
    @if (intro.hidden) {
      <h1 class="sr-only">{{ intro.title }}</h1>
    } @else {
      <section class="relative isolate overflow-hidden bg-gray-950 text-white">
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
        <div class="absolute inset-0 -z-10 bg-gradient-to-r from-gray-950 via-gray-950/80 to-gray-950/35"></div>
        <div
          class="mx-auto flex min-h-[36rem] max-w-7xl items-end px-5 py-14 sm:px-8 sm:py-20 lg:min-h-[40rem] lg:px-12"
        >
          <div class="max-w-3xl">
            <p class="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-teal-200">{{ intro.eyebrow }}</p>
            <h1 class="max-w-3xl font-serif text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              {{ heroHeading() }}
            </h1>
            @if (heroSubheading()) {
              <p class="mt-4 font-serif text-2xl font-medium text-teal-100 sm:text-3xl">
                {{ heroSubheading() }}
              </p>
            }
            <p class="mt-6 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
              {{ intro.description }}
            </p>
            <a
              class="mt-8 inline-flex items-center rounded-xl bg-brand px-5 py-3 text-sm font-bold text-brand-on transition-colors hover:bg-brand-strong focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-gray-950"
              href="#programs"
            >
              {{ heroCtaText() }}
            </a>
          </div>
        </div>
      </section>
    }

    @if (!descriptionStore.description()?.hidden) {
      <section id="programs" class="bg-surface px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div class="mx-auto max-w-7xl">
          <div class="max-w-3xl">
            <p class="text-xs font-bold uppercase tracking-[0.18em] text-brand">{{ programsEyebrow() }}</p>
            <h2 class="mt-3 font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {{ programsTitle() }}
            </h2>
            <p class="mt-4 text-base leading-7 text-ink-muted">{{ programsDescription() }}</p>
          </div>

          <div class="mt-10 grid gap-5 md:grid-cols-2">
            @for (program of programs(); track program.title) {
              <article
                class="group flex h-full flex-col rounded-3xl border border-outline bg-surface-raised p-7 transition-colors hover:border-brand hover:bg-brand-soft/30 sm:p-8"
              >
                <span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand-strong">
                  <mat-icon>{{ program.icon }}</mat-icon>
                </span>
                <h3 class="mt-6 font-serif text-2xl font-semibold text-ink">{{ program.title }}</h3>
                <p class="mt-4 text-sm leading-7 text-ink-muted sm:text-base">{{ program.description }}</p>
              </article>
            }
          </div>
        </div>
      </section>
    }

    <section class="bg-canvas px-5 py-16 sm:px-8 lg:px-12 lg:py-24" aria-labelledby="financial-facts-title">
      <div class="mx-auto max-w-7xl">
        <div class="max-w-3xl">
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-brand">{{ factsEyebrow() }}</p>
          <h2
            id="financial-facts-title"
            class="mt-3 font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl"
          >
            {{ factsTitle() }}
          </h2>
          <p class="mt-4 text-sm leading-6 text-ink-subtle">{{ factsSource() }}</p>
        </div>
        <dl class="mt-10 grid gap-5 md:grid-cols-3">
          @for (fact of financialFacts(); track fact.statistic) {
            <div class="rounded-3xl border border-outline bg-surface p-7 sm:p-8">
              <dt class="font-serif text-4xl font-semibold tracking-tight text-brand-strong">{{ fact.statistic }}</dt>
              <dd class="mt-4 text-base leading-7 text-ink-muted">{{ fact.description }}</dd>
            </div>
          }
        </dl>
      </div>
    </section>

    @if (!whatWeAreStore.whatWeAre()?.hidden) {
      <section class="bg-surface px-5 py-16 sm:px-8 lg:px-12 lg:py-24" aria-labelledby="who-we-are-title">
        <div class="mx-auto max-w-7xl">
          <div class="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
            <div class="max-w-xl">
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-brand">{{ whoWeAreEyebrow() }}</p>
              <h2
                id="who-we-are-title"
                class="mt-3 font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl"
              >
                {{ whoWeAreTitle() }}
              </h2>
              <p class="mt-5 text-base leading-7 text-ink-muted">{{ whoWeAreDescription() }}</p>
              <a
                class="mt-7 inline-flex items-center rounded-xl border border-outline bg-surface-raised px-5 py-3 text-sm font-bold text-ink transition-colors hover:border-brand hover:bg-brand-soft/30 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-surface"
                [href]="aboutUsLink()"
              >
                {{ aboutUsButtonText() }}
              </a>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              @for (partner of partners(); track partner.name) {
                <article
                  class="rounded-2xl border border-outline bg-surface-raised p-6 transition-colors hover:border-brand hover:bg-brand-soft/30 sm:last:col-span-2"
                >
                  <p class="text-xs font-bold uppercase tracking-[0.14em] text-brand">{{ partner.shortName }}</p>
                  <h3 class="mt-2 text-lg font-bold text-ink">{{ partner.name }}</h3>
                  <p class="mt-3 text-sm leading-6 text-ink-muted">{{ partner.description }}</p>
                </article>
              }
            </div>
          </div>
        </div>
      </section>
    }
  `,
  host: { class: 'block bg-surface' },
})
export class HomeComponent {
  readonly descriptionStore = inject(DescriptionStore);
  readonly introductionStore = inject(IntroductionStore);
  readonly whatWeAreStore = inject(WhatWeAreStore);
  readonly heroHeading = computed(() => this.splitHeroTitle()[0]);
  readonly heroSubheading = computed(() => this.splitHeroTitle()[1]);
  readonly heroCtaText = computed(
    () => this.introductionStore.introduction().ctaText?.trim() || 'Explore our programs',
  );
  readonly heroImageUrl = computed(() => this.introductionStore.introduction().imageUrl || DEFAULT_HERO_IMAGE);
  readonly heroImageAlt = computed(() => this.introductionStore.introduction().imageText || DEFAULT_HERO_ALT);
  readonly usesDefaultHeroImage = computed(() => this.heroImageUrl() === DEFAULT_HERO_IMAGE);
  readonly programsTitle = computed(() => this.descriptionStore.description()?.title || DEFAULT_PROGRAMS_TITLE);
  readonly programsEyebrow = computed(() => this.descriptionStore.description()?.eyebrow || 'What we do');
  readonly programsDescription = computed(
    () => this.toPlainText(this.descriptionStore.description()?.body) || DEFAULT_PROGRAMS_DESCRIPTION,
  );
  readonly programs = computed(() => {
    const content = this.parseJsonItems(this.descriptionStore.description()?.programsJson, PROGRAMS);
    return content.map((program, index) => ({ ...program, icon: PROGRAMS[index]?.icon ?? 'savings' }));
  });
  readonly factsEyebrow = computed(() => this.descriptionStore.description()?.factsEyebrow || 'Did you know');
  readonly factsTitle = computed(
    () => this.descriptionStore.description()?.factsTitle || 'Many households are navigating financial uncertainty',
  );
  readonly factsSource = computed(
    () => this.descriptionStore.description()?.factsSource || 'According to the Federal Reserve',
  );
  readonly financialFacts = computed(() =>
    this.parseJsonItems(this.descriptionStore.description()?.factsJson, FINANCIAL_FACTS),
  );
  readonly whoWeAreEyebrow = computed(() => this.whatWeAreStore.whatWeAre()?.eyebrow || 'Who we are');
  readonly whoWeAreTitle = computed(
    () => this.whatWeAreStore.whatWeAre()?.title || 'Atlanta nonprofits working together',
  );
  readonly whoWeAreDescription = computed(
    () => this.whatWeAreStore.whatWeAre()?.whoWeAreDescription || DEFAULT_WHO_WE_ARE,
  );
  readonly aboutUsButtonText = computed(() => this.whatWeAreStore.whatWeAre()?.buttonText || 'Learn more about us');
  readonly aboutUsLink = computed(() => this.whatWeAreStore.whatWeAre()?.buttonLink || '/about-us');
  readonly partners = computed(() => this.parseJsonItems(this.whatWeAreStore.whatWeAre()?.partnersJson, PARTNERS));

  constructor() {
    this.descriptionStore.getDescription();
    this.introductionStore.getIntroduction();
    this.whatWeAreStore.getWhatWeAre();
  }

  private splitHeroTitle(): readonly [string, string] {
    const title = this.introductionStore.introduction().title.trim();
    const separatorIndex = title.indexOf(':');
    if (separatorIndex === -1) return [title, ''];

    return [title.slice(0, separatorIndex).trim(), title.slice(separatorIndex + 1).trim()];
  }

  private parseJsonItems<T>(value: string | undefined, fallback: readonly T[]): readonly T[] {
    if (!value) return fallback;

    try {
      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed) && parsed.length ? (parsed as T[]) : fallback;
    } catch {
      return fallback;
    }
  }

  private toPlainText(value: string | undefined): string {
    return (
      value
        ?.replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim() ?? ''
    );
  }
}
