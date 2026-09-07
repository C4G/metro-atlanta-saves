import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { ConfirmDialogComponent } from '@mas/frontend-shared-components';
import { PartnersStore } from '@mas/frontend-shared-data-access';
import { type Partner } from '@mas/prisma-client/browser';
import { AddPartnerComponent } from './ui/add-partner/add-partner.component';

type PartnerLink = { label: string; shortLabel: string; href: string };

@Component({
  selector: 'mas-partners',
  imports: [MatDialogModule, MatIcon, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="min-h-dvh bg-[#f8fafc] px-4 py-6 sm:px-6 lg:px-8">
      <section class="mx-auto max-w-7xl">
        <nav class="mb-5 flex items-center gap-2 text-xs font-medium text-gray-400" aria-label="Breadcrumb">
          <a
            class="rounded text-gray-500 transition-colors hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            routerLink="/admin"
          >
            Admin Settings
          </a>
          <span aria-hidden="true">/</span>
          <span class="text-gray-600">Partners</span>
        </nav>

        <header class="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-600">Community network</p>
            <h1 class="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">Partners</h1>
            <p class="mt-2 max-w-xl text-sm leading-6 text-gray-500">
              Keep your partner organizations, contact channels, and program connections in one clear directory.
            </p>
          </div>
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
            (click)="openModal()"
          >
            <mat-icon class="!h-[18px] !w-[18px] !text-[18px] !leading-[18px]">add</mat-icon>
            New partner
          </button>
        </header>

        <section class="mb-7 grid gap-3 sm:grid-cols-3" aria-label="Partner overview">
          <div class="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
            <div class="flex items-center justify-between">
              <p class="text-xs font-medium text-gray-500">Total partners</p>
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <mat-icon class="!h-[17px] !w-[17px] !text-[17px] !leading-[17px]">groups</mat-icon>
              </div>
            </div>
            <p class="mt-3 text-2xl font-bold tracking-tight text-gray-950">{{ partnersStore.partners().length }}</p>
          </div>
          <div class="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
            <div class="flex items-center justify-between">
              <p class="text-xs font-medium text-gray-500">With a website</p>
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <mat-icon class="!h-[17px] !w-[17px] !text-[17px] !leading-[17px]">language</mat-icon>
              </div>
            </div>
            <p class="mt-3 text-2xl font-bold tracking-tight text-gray-950">{{ partnersWithWebsite() }}</p>
          </div>
          <div class="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
            <div class="flex items-center justify-between">
              <p class="text-xs font-medium text-gray-500">Socially connected</p>
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                <mat-icon class="!h-[17px] !w-[17px] !text-[17px] !leading-[17px]">share</mat-icon>
              </div>
            </div>
            <p class="mt-3 text-2xl font-bold tracking-tight text-gray-950">{{ partnersWithSocialLinks() }}</p>
          </div>
        </section>

        <section class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div
            class="flex flex-col gap-4 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h2 class="text-sm font-bold text-gray-900">Partner directory</h2>
              <p class="mt-0.5 text-xs text-gray-500">
                {{ filteredPartners().length }} of {{ partnersStore.partners().length }} organizations shown
              </p>
            </div>
            <label class="relative block w-full sm:w-72">
              <mat-icon
                class="pointer-events-none absolute left-3 top-1/2 !h-4 !w-4 -translate-y-1/2 !text-base !leading-4 text-gray-400"
              >
                search
              </mat-icon>
              <input
                type="search"
                class="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-50"
                placeholder="Search organizations or locations..."
                [value]="searchQuery()"
                (input)="setSearchQuery($event)"
              />
            </label>
          </div>

          @if (filteredPartners().length === 0) {
            <div class="flex flex-col items-center px-6 py-16 text-center">
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                <mat-icon>groups</mat-icon>
              </div>
              <h3 class="mt-4 text-sm font-bold text-gray-900">
                {{ partnersStore.partners().length === 0 ? 'No partners yet' : 'No partners found' }}
              </h3>
              <p class="mt-1 max-w-sm text-sm leading-6 text-gray-500">
                {{
                  partnersStore.partners().length === 0
                    ? 'Add your first partner organization to begin building your network.'
                    : 'Try a different search term or clear the search to view every partner.'
                }}
              </p>
              @if (partnersStore.partners().length === 0) {
                <button
                  type="button"
                  class="mt-5 rounded-xl bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
                  (click)="openModal()"
                >
                  Add partner
                </button>
              }
            </div>
          } @else {
            <div class="grid gap-px bg-gray-100 sm:grid-cols-2 xl:grid-cols-3">
              @for (partner of filteredPartners(); track partner.id) {
                <article
                  class="group flex min-h-64 flex-col bg-white p-5 transition-all duration-200 hover:bg-gray-50/70"
                >
                  <div class="flex items-start justify-between gap-4">
                    <div class="flex min-w-0 items-center gap-3">
                      <div
                        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-sm font-bold text-white shadow-sm"
                      >
                        {{ partnerInitials(partner.name) }}
                      </div>
                      <div class="min-w-0">
                        <h3 class="truncate text-[15px] font-bold text-gray-950">{{ partner.name }}</h3>
                        @if (partner.address) {
                          <p class="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-500">
                            <mat-icon class="!h-3.5 !w-3.5 !text-sm !leading-3.5 text-gray-400">location_on</mat-icon>
                            {{ partner.address }}
                          </p>
                        } @else {
                          <p class="mt-0.5 text-xs text-gray-400">Location not added</p>
                        }
                      </div>
                    </div>
                    <div
                      class="flex shrink-0 items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                    >
                      <button
                        type="button"
                        class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white hover:text-gray-900 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                        [attr.aria-label]="'Edit ' + partner.name"
                        title="Edit partner"
                        (click)="editPartner(partner)"
                      >
                        <mat-icon class="!h-4 !w-4 !text-base !leading-4">edit</mat-icon>
                      </button>
                      <button
                        type="button"
                        class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
                        [attr.aria-label]="'Delete ' + partner.name"
                        title="Delete partner"
                        (click)="confirmDelete(partner)"
                      >
                        <mat-icon class="!h-4 !w-4 !text-base !leading-4">delete</mat-icon>
                      </button>
                    </div>
                  </div>

                  <div class="mt-6 flex-1">
                    @if (partner.website) {
                      <a
                        class="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                        [href]="partner.website"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <mat-icon class="!h-3.5 !w-3.5 !text-sm !leading-3.5">language</mat-icon>
                        <span class="truncate">{{ hostname(partner.website) }}</span>
                        <mat-icon class="!h-3.5 !w-3.5 !text-sm !leading-3.5">open_in_new</mat-icon>
                      </a>
                    } @else {
                      <p class="text-xs text-gray-400">No website added</p>
                    }
                  </div>

                  <div class="mt-6 flex items-end justify-between gap-3 border-t border-gray-100 pt-4">
                    <div class="flex flex-wrap gap-1.5">
                      @for (link of socialLinks(partner); track link.label) {
                        <a
                          class="rounded-md border border-gray-200 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-500 transition-colors hover:border-gray-300 hover:bg-white hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                          [href]="link.href"
                          target="_blank"
                          rel="noopener noreferrer"
                          [attr.aria-label]="partner.name + ' on ' + link.label"
                        >
                          {{ link.shortLabel }}
                        </a>
                      }
                      @if (socialLinks(partner).length === 0) {
                        <span class="text-[11px] text-gray-400">No social links</span>
                      }
                    </div>
                    <p class="shrink-0 text-[10px] font-medium text-gray-400" [title]="formatDate(partner.updatedAt)">
                      Updated {{ relativeDate(partner.updatedAt) }}
                    </p>
                  </div>
                </article>
              }
            </div>
          }
        </section>
      </section>
    </main>
  `,
  host: {
    class: 'block',
  },
})
export default class PartnersComponent {
  private readonly dialog = inject(MatDialog);
  readonly partnersStore = inject(PartnersStore);
  readonly searchQuery = signal('');
  readonly filteredPartners = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const partners = [...this.partnersStore.partners()].sort((a, b) => a.name.localeCompare(b.name));
    if (!query) return partners;
    return partners.filter((partner) =>
      [
        partner.name,
        partner.address,
        partner.website,
        partner.facebook,
        partner.linkedIn,
        partner.tiktok,
        partner.twitter,
      ]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(query)),
    );
  });
  readonly partnersWithWebsite = computed(
    () => this.partnersStore.partners().filter((partner) => partner.website).length,
  );
  readonly partnersWithSocialLinks = computed(
    () => this.partnersStore.partners().filter((partner) => this.socialLinks(partner).length > 0).length,
  );

  constructor() {
    this.partnersStore.getPartners();
  }

  setSearchQuery(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  openModal(): void {
    this.dialog.open(AddPartnerComponent, { panelClass: 'w-full' });
  }

  editPartner(partner: Partner): void {
    this.dialog.open(AddPartnerComponent, { data: partner, panelClass: 'w-full' });
  }

  confirmDelete(partner: Partner): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Partner',
        content: `Are you sure you want to delete ${partner.name}?`,
        color: 'warn',
        onYesClick: () => this.partnersStore.deletePartner(partner.id),
      },
    });
  }

  partnerInitials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  socialLinks(partner: Partner): PartnerLink[] {
    return [
      { label: 'Facebook', shortLabel: 'f', href: partner.facebook },
      { label: 'LinkedIn', shortLabel: 'in', href: partner.linkedIn },
      { label: 'TikTok', shortLabel: 'TikTok', href: partner.tiktok },
      { label: 'X', shortLabel: 'X', href: partner.twitter },
    ].filter((link): link is PartnerLink => Boolean(link.href));
  }

  hostname(url: string): string {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  }

  formatDate(value: Date | string): string {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));
  }

  relativeDate(value: Date | string): string {
    const days = Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
    if (days <= 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 30) return `${days}d ago`;
    return this.formatDate(value);
  }
}
