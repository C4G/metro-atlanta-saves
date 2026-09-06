import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { FooterComponent } from '@mas/frontend-shared-layout';

type AdminSection = {
  title: string;
  description: string;
  route: string;
  /** Full Tailwind border-l-* class — must be a literal string for JIT scanning. */
  borderColor: string;
  /** Material icon name. */
  icon: string;
};

@Component({
  selector: 'mas-admin-settings',
  standalone: true,
  imports: [RouterLink, NgClass, MatIcon, FooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-dvh flex-col">
      <section class="flex-1 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 w-full">
        <!-- Header -->
        <header class="mb-8 hidden sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Admin Settings</h1>
            <p class="mt-1 text-sm text-gray-600">Select a section to manage platform content and configuration.</p>
          </div>
        </header>
        <header class="mb-6 sm:hidden">
          <h1 class="text-3xl font-bold text-gray-900">Admin Settings</h1>
          <p class="mt-1 text-sm text-gray-600">Select a section to manage platform content and configuration.</p>
        </header>

        <hr class="mb-8 border-gray-200" />

        <!-- Card grid -->
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          @for (section of sections; track section.title) {
            <div
              class="flex flex-col rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all duration-200 border-l-4 overflow-hidden"
              [ngClass]="section.borderColor"
            >
              <!-- Card body -->
              <div class="flex-1 px-5 pt-5 pb-4">
                <div class="flex items-center gap-3 mb-3">
                  <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600 shrink-0">
                    <mat-icon class="!text-[20px] !w-5 !h-5 !leading-5">{{ section.icon }}</mat-icon>
                  </div>
                  <h3 class="text-[15px] font-bold text-gray-900 leading-snug tracking-tight">{{ section.title }}</h3>
                </div>
                <p class="text-[13px] leading-relaxed text-gray-500">{{ section.description }}</p>
              </div>

              <!-- Card footer -->
              <div class="flex items-center border-t border-gray-100 bg-gray-50/60 px-5 py-3">
                <a
                  class="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-center text-xs font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
                  [routerLink]="section.route"
                >
                  Open
                </a>
              </div>
            </div>
          }
        </div>
      </section>
      <mas-footer />
    </div>
  `,
})
export default class AdminSettingsComponent {
  // Full Tailwind class literals listed here so the JIT scanner picks them up:
  // border-l-orange-500 border-l-sky-500 border-l-emerald-500 border-l-violet-500
  // border-l-rose-500 border-l-blue-500 border-l-amber-500 border-l-teal-500
  // border-l-indigo-500 border-l-red-500

  readonly sections: AdminSection[] = [
    {
      title: 'Users',
      description: 'Manage users, assign roles, and control platform access across programs.',
      route: '/admin/users',
      borderColor: 'border-l-blue-500',
      icon: 'manage_accounts',
    },
    {
      title: 'Partners',
      description: 'Add, edit, and manage partner organizations linked to savings programs.',
      route: '/admin/partners',
      borderColor: 'border-l-emerald-500',
      icon: 'handshake',
    },
    {
      title: 'Blogs',
      description: 'Create and publish blog posts to educate and engage platform users.',
      route: '/admin/blogs',
      borderColor: 'border-l-violet-500',
      icon: 'article',
    },
    {
      title: 'Education Management',
      description: 'Manage educational content and categories for program participants.',
      route: '/admin/education-management',
      borderColor: 'border-l-orange-500',
      icon: 'school',
    },
    {
      title: 'Home Management',
      description: 'Update stories, learnings, descriptions, and the introduction on the home page.',
      route: '/admin/home-management',
      borderColor: 'border-l-sky-500',
      icon: 'home',
    },
    {
      title: 'About Us Management',
      description: 'Manage cohorts and content displayed on the About Us page.',
      route: '/admin/about-us-management',
      borderColor: 'border-l-amber-500',
      icon: 'groups',
    },
    {
      title: 'User Guide',
      description: 'Manage the user guide content available to platform participants.',
      route: '/admin/user-guide',
      borderColor: 'border-l-rose-500',
      icon: 'menu_book',
    },
    {
      title: 'Checkpoint Names',
      description: 'Configure checkpoint names used to track progress across savings programs.',
      route: '/admin/checkpoint-names',
      borderColor: 'border-l-indigo-500',
      icon: 'checklist',
    },
    {
      title: 'Email Campaign',
      description: 'Send targeted email campaigns to all enrolled program participants.',
      route: '/admin/email-blast',
      borderColor: 'border-l-teal-500',
      icon: 'campaign',
    },
    {
      title: 'Peer Evaluation Guide',
      description: 'Manage peer evaluation guides used in program assessments and reviews.',
      route: '/admin/peer-evaluation-guide',
      borderColor: 'border-l-red-500',
      icon: 'fact_check',
    },
  ];
}
