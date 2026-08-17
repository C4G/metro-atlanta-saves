import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { lastValueFrom } from 'rxjs';
import { AuthStore } from '@mas/frontend-shared-auth';
import { FooterComponent, PushNotificationService } from '@mas/frontend-shared-layout';
import { RichTextEditorComponent } from './rich-text-editor.component';

type DiscussionUser = {
  id: string;
  firstName: string;
  lastName: string;
  role: 'Administrator' | 'Partner_Staff' | null;
  email: string;
  profilePicture: string | null;
};

type DiscussionComment = {
  id: string;
  body: string;
  createdAt: string;
  upvotes: number;
  downvotes: number;
  author: DiscussionUser;
  replies: DiscussionComment[];
};

type DiscussionTag = {
  id: string;
  name: string;
  color: string;
};

type DiscussionPost = {
  id: string;
  title: string;
  body: string;
  isAnnouncement: boolean;
  isPinned: boolean;
  createdAt: string;
  author: DiscussionUser;
  tags: DiscussionTag[];
  comments: DiscussionComment[];
  boardId?: string;
};

type BoardInfo = {
  id: string;
  name: string;
  description: string | null;
  programId: string | null;
  cohortId: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  memberCount: number;
  postCount: number;
};

type BoardMember = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isAdmin?: boolean;
};

type ManagementTab = 'general' | 'members' | 'tags';

@Component({
  selector: 'mas-discussion-board-forum',
  standalone: true,
  imports: [CommonModule, NgClass, NgTemplateOutlet, RouterLink, FooterComponent, RichTextEditorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      ::ng-deep .rich-content :is(h1, h2, h3, h4, h5, h6) {
        font-weight: 700;
        line-height: 1.3;
      }
      ::ng-deep .rich-content h1 {
        font-size: 1.5rem;
        margin: 0.75rem 0 0.4rem;
      }
      ::ng-deep .rich-content h2 {
        font-size: 1.25rem;
        margin: 0.75rem 0 0.4rem;
      }
      ::ng-deep .rich-content h3 {
        font-size: 1.1rem;
        margin: 0.6rem 0 0.35rem;
      }
      ::ng-deep .rich-content p {
        margin: 0.35rem 0;
        min-height: 1em;
      }
      ::ng-deep .rich-content p:empty {
        min-height: 1.65em;
      }
      ::ng-deep .rich-content p:first-child {
        margin-top: 0;
      }
      ::ng-deep .rich-content p:last-child {
        margin-bottom: 0;
      }
      ::ng-deep .rich-content ul {
        list-style-type: disc;
        padding-left: 1.5rem;
        margin: 0.35rem 0;
      }
      ::ng-deep .rich-content ol {
        list-style-type: decimal;
        padding-left: 1.5rem;
        margin: 0.35rem 0;
      }
      ::ng-deep .rich-content li {
        margin: 0.15rem 0;
      }
      ::ng-deep .rich-content a {
        color: #2563eb;
        text-decoration: underline;
        text-underline-offset: 2px;
      }
      ::ng-deep .rich-content a:hover {
        color: #1d4ed8;
      }
      ::ng-deep .rich-content strong {
        font-weight: 600;
      }
      ::ng-deep .rich-content em {
        font-style: italic;
      }
      ::ng-deep .rich-content u {
        text-decoration: underline;
        text-underline-offset: 2px;
      }
      ::ng-deep .rich-content img {
        max-width: 100%;
        height: auto;
        border-radius: 8px;
        display: block;
        margin: 0.5rem 0;
      }
    `,
  ],
  template: `
    @if (loading()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-75">
        <div class="flex flex-col items-center gap-3">
          <div class="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
          <p class="text-sm font-medium text-gray-600">Loading board...</p>
        </div>
      </div>
    }

    <div class="flex min-h-dvh flex-col">
      <section class="flex-1 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 w-full">
        <!-- Breadcrumb -->
        <div class="mb-5 flex items-center gap-1.5 text-xs text-gray-400">
          <a routerLink="/discussion-boards" class="font-medium text-gray-500 hover:text-blue-600 transition-colors">
            Discussion Boards
          </a>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
          @if (board(); as boardInfo) {
            <span class="font-semibold text-gray-700">{{ boardInfo.name }}</span>
          }
        </div>

        <header class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div class="flex-1 min-w-0">
            @if (board(); as boardInfo) {
              <h1 class="text-2xl font-bold tracking-tight text-gray-900 leading-tight">{{ boardInfo.name }}</h1>
              @if (boardInfo.description) {
                <p class="mt-1 text-sm text-gray-500 leading-relaxed">{{ boardInfo.description }}</p>
              }
              <div class="mt-2 flex items-center gap-3">
                <span class="inline-flex items-center gap-1.5 text-xs text-gray-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span class="font-semibold text-gray-700">{{ boardInfo.memberCount }}</span>
                  members
                </span>
                <span class="text-gray-300">|</span>
                <span class="inline-flex items-center gap-1.5 text-xs text-gray-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span class="font-semibold text-gray-700">{{ boardInfo.postCount }}</span>
                  posts
                </span>
              </div>
            }
          </div>
          <div class="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap w-full sm:w-auto">
            @if (isAdmin() || isBoardAdmin()) {
              <button
                type="button"
                class="flex-1 sm:flex-none justify-center inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
                (click)="openManagementModal('general')"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"
                  />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Manage
              </button>
            }
            <button
              type="button"
              class="flex-1 sm:flex-none justify-center inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
              (click)="openCreatePost()"
              [disabled]="!isLoggedIn()"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
              New Post
            </button>
          </div>
        </header>

        @if (!isLoggedIn()) {
          <div class="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Please
            <a routerLink="/login" class="underline">log in</a>
            to create posts and comments.
          </div>
        }

        @if (errorMessage(); as error) {
          <div class="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{{ error }}</div>
        }

        <div class="grid gap-4 lg:grid-cols-[24rem_1fr] auto-rows-max lg:auto-rows-1fr">
          <aside
            class="lg:flex lg:flex-col rounded-xl border border-gray-100 bg-white shadow-sm min-h-[70dvh] lg:h-full"
            [class.hidden]="sidebarCollapsed()"
            [class.flex]="!sidebarCollapsed()"
            [class.flex-col]="!sidebarCollapsed()"
          >
            <div class="border-b border-gray-100">
              <!-- Pill Tabs -->
              <div class="flex gap-1 p-3">
                <button
                  type="button"
                  class="flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors"
                  [class.bg-gray-900]="postType() === 'announcements'"
                  [class.text-white]="postType() === 'announcements'"
                  [class.text-gray-500]="postType() !== 'announcements'"
                  [class.hover:bg-gray-100]="postType() !== 'announcements'"
                  (click)="selectAnnouncements()"
                >
                  Announcements
                </button>
                <button
                  type="button"
                  class="flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors"
                  [class.bg-gray-900]="postType() === 'threads'"
                  [class.text-white]="postType() === 'threads'"
                  [class.text-gray-500]="postType() !== 'threads'"
                  [class.hover:bg-gray-100]="postType() !== 'threads'"
                  (click)="selectThreads()"
                >
                  Threads
                </button>
              </div>
              <!-- Search + Filter -->
              <div class="px-3 pb-3 space-y-2">
                <label for="discussion-search" class="sr-only">Search posts</label>
                <div class="relative">
                  <svg
                    class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    xmlns="http://www.w3.org/2000/svg"
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                  <input
                    id="discussion-search"
                    type="text"
                    class="w-full rounded-lg border border-gray-200 pl-8 pr-3 py-2 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                    placeholder="Search posts..."
                    [value]="searchQuery()"
                    (input)="setSearch($event)"
                  />
                </div>
                <button
                  type="button"
                  class="w-full flex items-center justify-between px-3 py-2 text-[12px] font-semibold text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
                  (click)="showFilterPanel.set(!showFilterPanel())"
                >
                  <span class="uppercase tracking-wide">Filter by category</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="transition-transform"
                    [class.rotate-180]="showFilterPanel()"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                @if (showFilterPanel()) {
                  <div class="relative">
                    <select
                      id="tag-filter"
                      class="w-full appearance-none rounded-lg border border-gray-200 px-3 py-2 pr-8 text-[13px] text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                      [value]="selectedTagFilter() || ''"
                      (change)="setTagFilter($event)"
                    >
                      <option value="">All Categories</option>
                      @for (tag of availableTags(); track tag.id) {
                        <option [value]="tag.id">{{ tag.name }}</option>
                      }
                    </select>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                }
              </div>
            </div>

            <div class="flex-1 overflow-auto">
              @if (!filteredPosts().length && !loading()) {
                @if (tabPostsEmpty() && !searchQuery().trim() && !selectedTagFilter()) {
                  <!-- Truly empty board -->
                  <div class="flex flex-col items-center justify-center py-16 px-6 text-center">
                    <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
                      <svg
                        class="text-blue-400"
                        xmlns="http://www.w3.org/2000/svg"
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <p class="text-sm font-semibold text-gray-500">This board is empty</p>
                    <p class="text-[11px] text-gray-400 mt-1 leading-relaxed max-w-[180px]">
                      Be the first to start a discussion. Share a question or idea!
                    </p>
                  </div>
                } @else {
                  <!-- No results for current search/filter -->
                  <div class="flex flex-col items-center justify-center py-14 px-6 text-center">
                    <svg
                      class="text-gray-200 mb-3"
                      xmlns="http://www.w3.org/2000/svg"
                      width="36"
                      height="36"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <p class="text-sm font-semibold text-gray-400">No posts found</p>
                    <p class="text-[11px] text-gray-300 mt-0.5">Try a different search or filter</p>
                  </div>
                }
              } @else if (!loading()) {
                @for (post of filteredPosts(); track post.id; let i = $index) {
                  @if (post.isPinned && (i === 0 || !filteredPosts()[i - 1].isPinned)) {
                    <div class="relative flex items-center px-4 py-1.5">
                      <div class="flex-1 border-t border-dashed border-gray-200"></div>
                      <span class="mx-2 text-[9px] font-bold uppercase tracking-widest text-gray-300">pinned</span>
                      <div class="flex-1 border-t border-dashed border-gray-200"></div>
                    </div>
                  }
                  <button
                    type="button"
                    class="relative w-full border-b border-gray-100 text-left transition-colors px-3 py-3"
                    [class.bg-blue-50]="activeView() === 'thread' && selectedPostId() === post.id"
                    [class.hover:bg-blue-50]="!(activeView() === 'thread' && selectedPostId() === post.id)"
                    (click)="selectPost(post.id, post.isAnnouncement)"
                  >
                    @if (activeView() === 'thread' && selectedPostId() === post.id) {
                      <span class="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full bg-blue-500"></span>
                    }
                    <!-- Title row -->
                    <div class="flex items-start justify-between gap-2">
                      <p
                        class="line-clamp-2 text-[13px] font-semibold leading-snug"
                        [class.text-blue-900]="activeView() === 'thread' && selectedPostId() === post.id"
                        [class.text-gray-900]="!(activeView() === 'thread' && selectedPostId() === post.id)"
                      >
                        {{ post.title }}
                      </p>
                      @if (post.isPinned) {
                        <span
                          class="mt-0.5 shrink-0 inline-flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="8"
                            height="8"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          >
                            <path d="M12 17v5" />
                            <path
                              d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"
                            />
                          </svg>
                          pinned
                        </span>
                      }
                    </div>
                    <!-- Meta row -->
                    <div class="mt-2 flex items-center gap-1.5 text-[11px] text-gray-400">
                      @if (post.tags.length > 0) {
                        @for (tag of post.tags; track tag.id) {
                          <span
                            class="inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold"
                            [ngClass]="getTagColorClass(tag)"
                          >
                            {{ tag.name }}
                          </span>
                        }
                        <span class="text-gray-300 shrink-0">·</span>
                      }
                      <span class="font-medium text-gray-500 truncate max-w-[110px] hover:underline cursor-pointer">
                        {{ fullName(post.author) }}
                      </span>
                      <span class="text-gray-300 shrink-0">·</span>
                      <span class="shrink-0">{{ formatTimeAgo(post.createdAt) }}</span>
                      <span class="ml-auto inline-flex items-center gap-1 shrink-0">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="11"
                          height="11"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <path
                            d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"
                          />
                          <path d="M8 12h.01" />
                          <path d="M12 12h.01" />
                          <path d="M16 12h.01" />
                        </svg>
                        <span class="tabular-nums">{{ post.comments.length }}</span>
                      </span>
                    </div>
                  </button>
                  @if (post.isPinned && (i + 1 >= filteredPosts().length || !filteredPosts()[i + 1].isPinned)) {
                    <div class="relative flex items-center px-4 py-1.5">
                      <div class="flex-1 border-t border-dashed border-gray-200"></div>
                      <span class="mx-2 text-[9px] font-bold uppercase tracking-widest text-gray-300">discussions</span>
                      <div class="flex-1 border-t border-dashed border-gray-200"></div>
                    </div>
                  }
                }
              }
            </div>
          </aside>

          <article
            class="lg:flex lg:flex-col rounded-xl border border-gray-100 bg-white shadow-sm min-h-[70dvh] lg:h-full"
            [class.hidden]="!sidebarCollapsed()"
            [class.flex]="sidebarCollapsed()"
            [class.flex-col]="sidebarCollapsed()"
          >
            <!-- Back to posts — mobile only, shown when sidebar is collapsed -->
            @if (sidebarCollapsed()) {
              <div class="lg:hidden flex items-center gap-2 border-b border-gray-100 px-4 py-2.5">
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  (click)="sidebarCollapsed.set(false)"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                  All posts
                </button>
              </div>
            }
            @if (activeView() === 'new') {
              <div class="border-b border-gray-100 px-5 py-5 flex items-start justify-between gap-4">
                <div>
                  <p class="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">New Post</p>
                  <h2 class="text-lg font-bold text-gray-900 leading-tight">Create a Thread</h2>
                </div>
                <button
                  type="button"
                  class="h-8 w-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors shrink-0 mt-0.5"
                  (click)="cancelCreatePost()"
                  title="Cancel"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>

              <div class="flex-1 overflow-auto px-5 py-5 space-y-5">
                <!-- Title -->
                <div>
                  <label class="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">
                    Post Title
                    <span class="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    class="w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 disabled:bg-gray-50 disabled:text-gray-400 transition"
                    [class.border-gray-200]="!(showPostErrors() && !newPostTitle().trim())"
                    [class.border-red-400]="showPostErrors() && !newPostTitle().trim()"
                    [class.ring-red-100]="showPostErrors() && !newPostTitle().trim()"
                    placeholder="What's this thread about?"
                    [value]="newPostTitle()"
                    (input)="setNewPostTitle($event); showPostErrors.set(false)"
                    [disabled]="creatingPost() || !isLoggedIn()"
                  />
                  @if (showPostErrors() && !newPostTitle().trim()) {
                    <p class="mt-1.5 text-[11px] text-red-500 font-medium">Post title is required.</p>
                  }
                </div>

                <!-- Body -->
                <div>
                  <label class="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">
                    Post Body
                    <span class="text-red-400">*</span>
                  </label>
                  <div
                    class="rounded-lg transition"
                    [class.ring-1]="showPostErrors() && isBodyEmpty(newPostBody())"
                    [class.ring-red-400]="showPostErrors() && isBodyEmpty(newPostBody())"
                  >
                    <mas-rich-text-editor
                      [value]="newPostBody()"
                      (valueChange)="newPostBody.set($event); showPostErrors.set(false)"
                      placeholder="Share your thoughts in detail..."
                      [disabled]="creatingPost() || !isLoggedIn()"
                      minHeight="160px"
                    />
                  </div>
                  @if (showPostErrors() && isBodyEmpty(newPostBody())) {
                    <p class="mt-1.5 text-[11px] text-red-500 font-medium">Post body is required.</p>
                  }
                </div>

                <!-- Announcement toggle (admin or board admin) -->
                @if (canPostAnnouncement()) {
                  <div class="flex items-center gap-3 rounded-lg bg-gray-50 border border-gray-200 px-4 py-3">
                    <input
                      type="checkbox"
                      id="announcement-toggle"
                      class="rounded border-gray-300 text-blue-600 focus:ring-blue-100"
                      [checked]="creatingAnnouncement()"
                      (change)="toggleCreatingAnnouncement()"
                      [disabled]="creatingPost()"
                    />
                    <div class="flex-1">
                      <label for="announcement-toggle" class="text-sm font-semibold text-gray-700 cursor-pointer">
                        Post as Announcement
                      </label>
                      <p class="text-[11px] text-gray-400 mt-0.5">
                        Announcements appear in the announcements tab of the sidebar
                      </p>
                    </div>
                    <span
                      class="text-[9px] font-bold uppercase tracking-widest text-gray-400 bg-gray-200 rounded px-1.5 py-0.5"
                    >
                      Admin
                    </span>
                  </div>
                  <!-- Email notification sub-option -->
                  @if (creatingAnnouncement()) {
                    <div class="flex items-center gap-3 rounded-lg bg-gray-50 border border-gray-200 px-4 py-3">
                      <input
                        type="checkbox"
                        id="email-notification-toggle"
                        class="rounded border-gray-300 text-blue-600 focus:ring-blue-100"
                        [checked]="sendEmailNotification()"
                        (change)="toggleSendEmailNotification()"
                        [disabled]="creatingPost()"
                      />
                      <div class="flex-1">
                        <label
                          for="email-notification-toggle"
                          class="text-sm font-semibold text-gray-700 cursor-pointer"
                        >
                          Send email notification
                        </label>
                        <p class="text-[11px] text-gray-400 mt-0.5">Emails all board members about this announcement</p>
                      </div>
                      <span
                        class="text-[9px] font-bold uppercase tracking-widest text-gray-400 bg-gray-200 rounded px-1.5 py-0.5 shrink-0"
                      >
                        Admin
                      </span>
                    </div>

                    <!-- Email template preview (shown when email notification is enabled) -->
                    @if (sendEmailNotification()) {
                      <div class="rounded-lg border border-blue-200 bg-blue-50 overflow-hidden">
                        <!-- Preview header -->
                        <div class="flex items-center gap-2 px-4 py-2 bg-blue-100 border-b border-blue-200">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-3.5 w-3.5 text-blue-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                          <span class="text-[10px] font-bold uppercase tracking-widest text-blue-700">
                            Email Preview
                          </span>
                          <span class="ml-auto text-[9px] text-blue-400 font-medium">Sent to all board members</span>
                        </div>

                        <div class="px-4 py-3 space-y-3">
                          <!-- Subject -->
                          <div>
                            <p class="text-[9px] font-bold uppercase tracking-widest text-blue-400 mb-0.5">Subject</p>
                            <p class="text-sm font-semibold text-gray-800">{{ newPostTitle() || '(no title yet)' }}</p>
                          </div>

                          <!-- Body (read-only preview, mirrors post body in real time) -->
                          <div>
                            <p class="text-[9px] font-bold uppercase tracking-widest text-blue-400 mb-1">Message</p>
                            <div
                              class="rounded-md bg-white border border-blue-200 px-3 py-2.5 min-h-[100px] text-sm text-gray-700 overflow-auto prose prose-sm max-w-none"
                              [innerHTML]="emailPreviewBody"
                            ></div>
                          </div>

                          <!-- Post link callout -->
                          <div class="flex items-center gap-2 rounded-md bg-white border border-blue-200 px-3 py-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              class="h-3.5 w-3.5 text-blue-500 shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                              />
                            </svg>
                            <div class="flex-1 min-w-0">
                              <p class="text-[11px] font-semibold text-gray-700">
                                Direct link to this post included automatically
                              </p>
                              <p class="text-[10px] text-gray-400 truncate">
                                {{ postPreviewUrl() }}
                              </p>
                            </div>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              class="h-4 w-4 text-green-500 shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2.5"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    }
                  }
                }

                <!-- Category -->
                <div class="pt-3 border-t border-gray-100">
                  <label class="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">
                    Category
                    <span class="text-red-400">*</span>
                  </label>
                  <div class="flex flex-wrap gap-2">
                    @for (tag of availableTags(); track tag.id) {
                      <button
                        type="button"
                        class="px-3 py-1.5 text-[12px] font-semibold rounded-lg transition-all"
                        [class.ring-2]="selectedTagIds().includes(tag.id)"
                        [class.ring-offset-2]="selectedTagIds().includes(tag.id)"
                        [class.ring-blue-600]="selectedTagIds().includes(tag.id) && tag.color === 'blue'"
                        [class.ring-green-600]="selectedTagIds().includes(tag.id) && tag.color === 'green'"
                        [class.ring-red-600]="selectedTagIds().includes(tag.id) && tag.color === 'red'"
                        [class.ring-orange-600]="selectedTagIds().includes(tag.id) && tag.color === 'orange'"
                        [class.ring-purple-600]="selectedTagIds().includes(tag.id) && tag.color === 'purple'"
                        [class.ring-yellow-600]="selectedTagIds().includes(tag.id) && tag.color === 'yellow'"
                        [ngClass]="getTagColorClass(tag)"
                        [disabled]="creatingPost() || !isLoggedIn()"
                        (click)="selectTag(tag.id); showPostErrors.set(false)"
                      >
                        {{ tag.name }}
                      </button>
                    }
                  </div>
                  @if (showPostErrors() && selectedTagIds().length === 0) {
                    <p class="mt-1.5 text-[11px] text-red-500 font-medium">Category is required.</p>
                  }
                </div>

                <!-- Action buttons -->
                <div class="flex gap-3 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    class="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    (click)="cancelCreatePost()"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    class="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                    (click)="createPost()"
                    [disabled]="creatingPost() || !isLoggedIn()"
                  >
                    {{ creatingPost() ? 'Posting...' : 'Post' }}
                  </button>
                </div>
              </div>
            } @else if (selectedPost(); as post) {
              <div class="border-b border-gray-100 px-5 py-5">
                <div class="flex items-start gap-3">
                  <div class="flex-1 min-w-0">
                    <h2 class="text-lg font-bold leading-snug text-gray-900">
                      @if (editingPostId() === post.id) {
                        <input
                          type="text"
                          class="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-lg font-bold text-gray-900 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                          [value]="editPostTitle()"
                          (input)="setEditPostTitle($event)"
                          placeholder="Post title"
                        />
                      } @else {
                        {{ post.title }}
                      }
                    </h2>
                    <div class="mt-2 flex flex-wrap items-center gap-1.5">
                      @if (post.author.profilePicture) {
                        <img
                          [src]="post.author.profilePicture"
                          [alt]="fullName(post.author)"
                          class="rounded-full object-cover flex-shrink-0"
                          style="width: 20px; height: 20px;"
                        />
                      } @else {
                        <div
                          class="flex items-center justify-center rounded-full bg-blue-500 text-[9px] font-bold text-white flex-shrink-0"
                          style="width: 20px; height: 20px;"
                        >
                          {{ post.author.firstName.charAt(0) }}{{ post.author.lastName.charAt(0) }}
                        </div>
                      }
                      <span class="text-xs font-semibold text-gray-700 hover:underline cursor-pointer">
                        {{ fullName(post.author) }}
                      </span>
                      <span class="text-xs text-gray-300">·</span>
                      <span class="text-xs text-gray-400">{{ formatTimeAgo(post.createdAt) }} ago</span>
                      @if (post.tags.length > 0) {
                        <span class="text-xs text-gray-200">·</span>
                        @for (tag of post.tags; track tag.id) {
                          <span
                            class="inline-block rounded px-2 py-0.5 text-[10px] font-semibold"
                            [ngClass]="getTagColorClass(tag)"
                          >
                            {{ tag.name }}
                          </span>
                        }
                      }
                      @if (post.isPinned) {
                        <span class="text-xs text-gray-200">·</span>
                        <span class="inline-flex items-center text-blue-500" title="Pinned">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          >
                            <path d="M12 17v5" />
                            <path
                              d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"
                            />
                          </svg>
                        </span>
                      }
                    </div>
                  </div>
                  <!-- Actions: grouped box [Edit] [Delete] | [Pin] -->
                  @if (isAdmin() || isBoardAdmin() || currentUser()?.id === post.author.id) {
                    <div class="flex items-center gap-0.5 shrink-0 rounded-xl border border-gray-200 bg-gray-50/80 p-1">
                      @if (isAdmin() || isBoardAdmin() || currentUser()?.id === post.author.id) {
                        <!-- Edit button -->
                        <button
                          type="button"
                          class="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-white hover:text-blue-600 transition-colors"
                          [class.bg-blue-50]="editingPostId() === post.id"
                          [class.text-blue-600]="editingPostId() === post.id"
                          (click)="editingPostId() === post.id ? cancelPostEdit() : startEditPost(post)"
                          [title]="editingPostId() === post.id ? 'Cancel editing' : 'Edit post'"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          >
                            <path
                              d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"
                            />
                            <path d="m15 5 4 4" />
                          </svg>
                        </button>
                        <!-- Delete -->
                        <button
                          type="button"
                          class="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-white hover:text-red-500 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                          (click)="deletePost(post.id)"
                          [disabled]="deletingPostId() === post.id"
                          title="Delete post"
                        >
                          @if (deletingPostId() === post.id) {
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              class="animate-spin"
                            >
                              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                            </svg>
                          } @else {
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            >
                              <path d="M10 11v6" />
                              <path d="M14 11v6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                              <path d="M3 6h18" />
                              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          }
                        </button>
                      }
                      @if (isAdmin() || isBoardAdmin()) {
                        <!-- Divider -->
                        <div class="w-px h-4 bg-gray-200 mx-0.5"></div>
                        <!-- Pin — to the right of delete -->
                        <button
                          type="button"
                          class="flex h-7 w-7 items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                          [class.text-blue-600]="post.isPinned"
                          [class.bg-blue-100]="post.isPinned"
                          [class.text-gray-400]="!post.isPinned"
                          [class.hover:bg-white]="!post.isPinned"
                          [class.hover:text-gray-600]="!post.isPinned"
                          (click)="togglePin(post.id)"
                          [disabled]="pinningPostId() === post.id"
                          [title]="post.isPinned ? 'Unpin post' : 'Pin post'"
                        >
                          @if (pinningPostId() === post.id) {
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              class="animate-spin"
                            >
                              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                            </svg>
                          } @else {
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            >
                              <path d="M12 17v5" />
                              <path
                                d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"
                              />
                            </svg>
                          }
                        </button>
                      }
                    </div>
                  }
                </div>
              </div>

              <div #threadContent class="flex-1 overflow-auto">
                @if (editingPostId() === post.id) {
                  <div class="px-5 py-4 border-b border-gray-200 space-y-4">
                    <mas-rich-text-editor
                      [value]="editPostBody()"
                      (valueChange)="editPostBody.set($event)"
                      placeholder="Post body..."
                      minHeight="120px"
                    />

                    <!-- Category -->
                    @if (availableTags().length > 0) {
                      <div class="pt-3 border-t border-gray-100">
                        <label class="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">
                          Category
                          <span class="text-red-400">*</span>
                        </label>
                        <div class="flex flex-wrap gap-2">
                          @for (tag of availableTags(); track tag.id) {
                            <button
                              type="button"
                              class="px-3 py-1.5 text-[12px] font-semibold rounded-lg transition-all"
                              [class.ring-2]="editPostTagIds().includes(tag.id)"
                              [class.ring-offset-2]="editPostTagIds().includes(tag.id)"
                              [class.ring-blue-600]="editPostTagIds().includes(tag.id) && tag.color === 'blue'"
                              [class.ring-green-600]="editPostTagIds().includes(tag.id) && tag.color === 'green'"
                              [class.ring-red-600]="editPostTagIds().includes(tag.id) && tag.color === 'red'"
                              [class.ring-orange-600]="editPostTagIds().includes(tag.id) && tag.color === 'orange'"
                              [class.ring-purple-600]="editPostTagIds().includes(tag.id) && tag.color === 'purple'"
                              [class.ring-yellow-600]="editPostTagIds().includes(tag.id) && tag.color === 'yellow'"
                              [ngClass]="getTagColorClass(tag)"
                              [disabled]="savingPostEdit()"
                              (click)="toggleEditPostTag(tag.id)"
                            >
                              {{ tag.name }}
                            </button>
                          }
                        </div>
                      </div>
                    }

                    <div class="flex items-center gap-2 justify-end pt-3 border-t border-gray-100">
                      <button
                        type="button"
                        class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                        (click)="cancelPostEdit()"
                        [disabled]="savingPostEdit()"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
                        (click)="savePostEdit(post.id)"
                        [disabled]="savingPostEdit() || !editPostTitle().trim() || isBodyEmpty(editPostBody())"
                      >
                        {{ savingPostEdit() ? 'Saving...' : 'Save changes' }}
                      </button>
                    </div>
                  </div>
                } @else {
                  <div class="border-b border-gray-200 px-5 py-4">
                    <div class="rich-content text-sm leading-6 text-gray-800" [innerHTML]="post.body"></div>
                  </div>
                }

                <div class="px-5 py-4">
                  <!-- Comment form on top (repo style) -->
                  <div class="mb-6">
                    <h2 class="text-base font-semibold text-zinc-900 mb-3">Join the conversation</h2>
                    @if (isLoggedIn()) {
                      <div class="rounded-lg border border-gray-200 bg-white overflow-hidden">
                        <mas-rich-text-editor
                          [value]="newCommentBody()"
                          (valueChange)="newCommentBody.set($event)"
                          placeholder="Add a comment..."
                          [disabled]="creatingComment()"
                          minHeight="96px"
                          [noBorder]="true"
                        />
                        <div class="flex justify-end px-3 py-2 border-t border-gray-100 bg-gray-50/60">
                          <button
                            type="button"
                            class="rounded-md h-8 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 transition-colors inline-flex items-center gap-1.5"
                            (click)="createComment(post.id)"
                            [disabled]="creatingComment() || isBodyEmpty(newCommentBody())"
                          >
                            {{ creatingComment() ? 'Posting...' : 'Add comment' }}
                          </button>
                        </div>
                      </div>
                    } @else {
                      <p class="text-sm text-zinc-500">
                        Please
                        <a routerLink="/login" class="underline text-blue-600">log in</a>
                        to comment.
                      </p>
                    }
                  </div>

                  @if (!post.comments.length) {
                    <p class="mb-4 text-sm text-gray-500">No comments yet.</p>
                  }

                  <div class="space-y-3">
                    @for (comment of post.comments; track comment.id) {
                      <ng-container
                        *ngTemplateOutlet="commentTemplate; context: { $implicit: comment, post: post, depth: 0 }"
                      />
                    }
                  </div>

                  <!-- Comment Template -->
                  <ng-template #commentTemplate let-comment let-post="post" let-depth="depth">
                    <div class="w-full">
                      <!-- Two-column: thread column always reserves space, enabling smooth connector lines through collapsed items -->
                      <div class="flex w-full gap-2">
                        <!-- Thread column: always present but contents hidden when collapsed -->
                        <div class="flex flex-col items-center flex-shrink-0 w-[34px]">
                          @if (!collapsedComments().has(comment.id)) {
                            @if (comment.author.profilePicture) {
                              <img
                                [src]="comment.author.profilePicture"
                                [alt]="fullName(comment.author)"
                                class="rounded-full object-cover flex-shrink-0"
                                style="width: 34px; height: 34px;"
                              />
                            } @else {
                              <div
                                class="flex items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white flex-shrink-0"
                                style="width: 34px; height: 34px;"
                              >
                                {{ comment.author.firstName.charAt(0) }}{{ comment.author.lastName.charAt(0) }}
                              </div>
                            }
                            @if (comment.replies.length > 0) {
                              <div
                                class="flex-1 w-px bg-zinc-300 hover:bg-zinc-400 cursor-pointer"
                                (click)="toggleCollapsed(comment.id)"
                              ></div>
                            }
                          }
                        </div>
                        <!-- Content column -->
                        @if (collapsedComments().has(comment.id)) {
                          <!-- Collapsed button: -ml-8 -mt-1 reaches back over the empty thread column -->
                          <button
                            type="button"
                            class="flex items-center gap-2 py-2 mb-6 text-xs text-zinc-500 hover:text-zinc-800 font-medium"
                            style="margin-left: -2rem; margin-top: -0.25rem;"
                            (click)="toggleCollapsed(comment.id)"
                          >
                            <span
                              class="flex items-center justify-center w-4 h-4 text-[9px] rounded-full border border-zinc-300 text-zinc-400 bg-white flex-shrink-0"
                            >
                              +
                            </span>
                            <span class="hover:underline cursor-pointer">{{ fullName(comment.author) }}</span>
                            @if (comment.replies.length > 0) {
                              <span class="opacity-60">[+{{ comment.replies.length }} replies]</span>
                            }
                          </button>
                        } @else {
                          <div class="flex-1 min-w-0 pb-3">
                            <div class="flex items-center gap-2" style="margin-top: 6px;">
                              <span class="text-xs font-semibold text-gray-900 hover:underline cursor-pointer">
                                {{ fullName(comment.author) }}
                              </span>
                              @if (comment.author.id === board()?.createdBy?.id) {
                                <span class="text-xs text-zinc-400">•</span>
                                <span
                                  class="inline-flex items-center rounded border border-violet-200 bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-violet-600"
                                >
                                  Creator
                                </span>
                              } @else if (
                                comment.author.role === 'Administrator' || comment.author.role === 'Partner_Staff'
                              ) {
                                <span class="text-xs text-zinc-400">•</span>
                                <span
                                  class="inline-flex items-center rounded border border-amber-200 bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-600"
                                >
                                  Staff
                                </span>
                              } @else if (isBoardAdminAuthor(comment.author.id)) {
                                <span class="text-xs text-zinc-400">•</span>
                                <span
                                  class="inline-flex items-center rounded border border-amber-200 bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-600"
                                >
                                  Staff
                                </span>
                              }
                              <span class="text-xs text-zinc-500">• {{ formatTimeAgo(comment.createdAt) }}</span>
                            </div>
                            @if (editingCommentId() === comment.id) {
                              <div class="mt-2 rounded-lg border border-gray-200 bg-white overflow-hidden">
                                <mas-rich-text-editor
                                  [value]="editCommentBody()"
                                  (valueChange)="editCommentBody.set($event)"
                                  [noBorder]="true"
                                  minHeight="72px"
                                />
                                <div
                                  class="flex items-center justify-end gap-2 px-3 py-2 border-t border-gray-100 bg-gray-50/60"
                                >
                                  <button
                                    type="button"
                                    class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                                    (click)="cancelCommentEdit()"
                                    [disabled]="savingCommentEdit()"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    class="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
                                    (click)="saveCommentEdit(post.id, comment.id)"
                                    [disabled]="savingCommentEdit() || isBodyEmpty(editCommentBody())"
                                  >
                                    {{ savingCommentEdit() ? 'Saving...' : 'Save' }}
                                  </button>
                                </div>
                              </div>
                            } @else {
                              <div
                                class="rich-content text-sm leading-relaxed text-gray-800"
                                style="margin-top: 10px; margin-bottom: 8px;"
                                [innerHTML]="comment.body"
                              ></div>
                              <!-- Action row -->
                              <div class="relative flex items-center flex-wrap gap-1" style="margin-left: -8px;">
                                @if (comment.replies.length > 0) {
                                  <button
                                    type="button"
                                    class="flex items-center justify-center w-4 h-4 text-[9px] rounded-full border border-zinc-400 text-zinc-500 bg-white hover:border-zinc-600 hover:text-zinc-700 transition"
                                    style="margin-left: 8px;"
                                    (click)="toggleCollapsed(comment.id)"
                                    aria-label="Collapse thread"
                                  >
                                    −
                                  </button>
                                }
                                <!-- Vote bar -->
                                <div
                                  class="inline-flex items-center justify-center gap-1 rounded-full h-8 px-2 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                                >
                                  <button
                                    type="button"
                                    aria-label="Upvote"
                                    [disabled]="!isLoggedIn() || votingCommentId() === comment.id"
                                    class="flex items-center justify-center h-6 w-6 rounded-full hover:bg-white transition-colors"
                                    [class.text-blue-500]="commentVotes().get(comment.id) === 'UP'"
                                    (click)="voteComment(post.id, comment.id, 'UP')"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      stroke-width="2"
                                      stroke-linecap="round"
                                      stroke-linejoin="round"
                                    >
                                      <path
                                        d="M9 19a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-6a1 1 0 0 1 1-1h3.293a.707.707 0 0 0 .5-1.207l-7.086-7.086a1 1 0 0 0-1.414 0l-7.086 7.086a.707.707 0 0 0 .5 1.207H8a1 1 0 0 1 1 1z"
                                      />
                                    </svg>
                                  </button>
                                  <span
                                    class="flex items-center justify-center min-w-6 text-center tabular-nums leading-none"
                                  >
                                    {{ comment.upvotes - comment.downvotes }}
                                  </span>
                                  <button
                                    type="button"
                                    aria-label="Downvote"
                                    [disabled]="!isLoggedIn() || votingCommentId() === comment.id"
                                    class="flex items-center justify-center h-6 w-6 rounded-full hover:bg-white transition-colors"
                                    [class.text-orange-500]="commentVotes().get(comment.id) === 'DOWN'"
                                    (click)="voteComment(post.id, comment.id, 'DOWN')"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      stroke-width="2"
                                      stroke-linecap="round"
                                      stroke-linejoin="round"
                                    >
                                      <path
                                        d="M9 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6a1 1 0 0 0 1 1h3.293a.707.707 0 0 1 .5 1.207l-7.086 7.086a1 1 0 0 1-1.414 0l-7.086-7.086a.707.707 0 0 1 .5-1.207H8a1 1 0 0 0 1-1z"
                                      />
                                    </svg>
                                  </button>
                                </div>
                                <!-- Reply button -->
                                @if (isLoggedIn()) {
                                  <button
                                    type="button"
                                    class="rounded-full h-8 px-3 text-xs font-semibold text-gray-700 hover:bg-gray-100 inline-flex items-center gap-1.5 transition-colors"
                                    (click)="startReply(comment.id)"
                                    [disabled]="replyingToCommentId() === comment.id || creatingReply()"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      stroke-width="2"
                                      stroke-linecap="round"
                                      stroke-linejoin="round"
                                    >
                                      <path
                                        d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"
                                      />
                                      <path d="M8 12h.01" />
                                      <path d="M12 12h.01" />
                                      <path d="M16 12h.01" />
                                    </svg>
                                    <span>Reply</span>
                                  </button>
                                }
                                <!-- Edit button -->
                                @if (isAdmin() || currentUser()?.id === comment.author.id) {
                                  <button
                                    type="button"
                                    class="rounded-full h-8 px-3 text-xs font-semibold text-gray-700 hover:bg-gray-100 inline-flex items-center gap-1.5 transition-colors"
                                    (click)="startEditComment(comment)"
                                    [disabled]="editingCommentId() !== null"
                                    title="Edit"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="13"
                                      height="13"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      stroke-width="2"
                                      stroke-linecap="round"
                                      stroke-linejoin="round"
                                    >
                                      <path
                                        d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"
                                      />
                                      <path d="m15 5 4 4" />
                                    </svg>
                                  </button>
                                }
                                <!-- Delete button -->
                                @if (isAdmin() || isBoardAdmin() || currentUser()?.id === comment.author.id) {
                                  <button
                                    type="button"
                                    class="rounded-full h-8 px-3 text-xs font-semibold text-gray-700 hover:bg-red-50 hover:text-red-600 inline-flex items-center gap-1.5 transition-colors"
                                    (click)="deleteComment(post.id, comment.id)"
                                    [disabled]="deletingCommentId() === comment.id"
                                  >
                                    @if (deletingCommentId() === comment.id) {
                                      <span>Deleting...</span>
                                    } @else {
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                      >
                                        <path d="M10 11v6" />
                                        <path d="M14 11v6" />
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                        <path d="M3 6h18" />
                                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                      </svg>
                                    }
                                  </button>
                                }
                              </div>
                            }
                            <!-- Reply form -->
                            @if (replyingToCommentId() === comment.id) {
                              <div class="mt-2 mb-2 max-w-xl space-y-2">
                                <mas-rich-text-editor
                                  [value]="newReplyBody()"
                                  (valueChange)="newReplyBody.set($event)"
                                  placeholder="Write a reply..."
                                  [disabled]="creatingReply()"
                                  minHeight="72px"
                                />
                                <div class="flex gap-2">
                                  <button
                                    type="button"
                                    class="rounded-md px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
                                    (click)="createReply(post.id, comment.id)"
                                    [disabled]="creatingReply() || isBodyEmpty(newReplyBody())"
                                  >
                                    {{ creatingReply() ? 'Replying...' : 'Reply' }}
                                  </button>
                                  <button
                                    type="button"
                                    class="rounded-md px-3 py-1.5 text-xs font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                                    (click)="cancelReply()"
                                    [disabled]="creatingReply()"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            }
                          </div>
                        }
                      </div>
                      <!-- Nested replies (only when expanded) -->
                      @if (!collapsedComments().has(comment.id) && comment.replies.length > 0) {
                        <div class="pl-[42.5px]">
                          <div class="pl-0.5">
                            @for (reply of comment.replies; track reply.id; let isLast = $last; let isFirst = $first) {
                              <div class="relative" [class.pt-2]="isFirst">
                                @if (!isLast) {
                                  <div
                                    class="absolute -left-7 top-0 bottom-0 w-px bg-zinc-300 hover:bg-zinc-400 cursor-pointer"
                                    (click)="toggleCollapsed(comment.id)"
                                  ></div>
                                }
                                <div
                                  class="absolute -left-7 -top-[0.1px] h-5 w-7 border-l border-b border-zinc-300 rounded-bl-[2rem] cursor-pointer"
                                  (click)="toggleCollapsed(comment.id)"
                                ></div>
                                <ng-container
                                  *ngTemplateOutlet="
                                    commentTemplate;
                                    context: { $implicit: reply, post: post, depth: depth + 1 }
                                  "
                                />
                              </div>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  </ng-template>
                </div>
              </div>
            } @else {
              <div class="flex flex-col items-center justify-center h-full py-20 px-8 text-center">
                <svg
                  class="text-gray-200 mb-4"
                  xmlns="http://www.w3.org/2000/svg"
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <p class="text-sm font-semibold text-gray-400">No post selected</p>
                <p class="text-[12px] text-gray-300 mt-1">Select a post from the sidebar to view its discussion</p>
              </div>
            }
          </article>
        </div>

        <!-- Board Management Modal -->
        @if (showManagementModal()) {
          <div
            class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
            (click)="closeManagementModal()"
          >
            <div
              class="modal-sheet relative w-full sm:max-w-md max-h-[75dvh] sm:max-h-[85vh] rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl flex flex-col"
              (click)="$event.stopPropagation()"
            >
              <!-- Drag handle - mobile only -->
              <div class="w-10 h-1 rounded-full bg-gray-300 mx-auto mt-3 mb-1 sm:hidden" aria-hidden="true"></div>
              <!-- Header -->
              <div class="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100">
                <div>
                  <p class="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">Board Settings</p>
                  <h2 class="text-lg font-bold text-gray-900 leading-tight">{{ board()?.name }}</h2>
                </div>
                <button
                  type="button"
                  class="h-8 w-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors ml-4 mt-0.5 shrink-0"
                  (click)="closeManagementModal()"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>

              <!-- Pill Tab Bar -->
              <div class="flex gap-1 px-5 py-3 border-b border-gray-100">
                @for (tab of managementTabs; track tab.id) {
                  <button
                    type="button"
                    class="px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors"
                    [class.bg-gray-900]="managementTab() === tab.id"
                    [class.text-white]="managementTab() === tab.id"
                    [class.text-gray-500]="managementTab() !== tab.id"
                    [class.hover:bg-gray-100]="managementTab() !== tab.id"
                    (click)="managementTab.set(tab.id)"
                  >
                    {{ tab.label }}
                  </button>
                }
              </div>

              <!-- Content -->
              <div class="flex-1 overflow-auto px-5 py-5 space-y-5">
                <!-- General Tab -->
                @if (managementTab() === 'general') {
                  <div class="space-y-4">
                    <div>
                      <label
                        for="forum-board-name-input"
                        class="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5"
                      >
                        Board Name
                      </label>
                      <input
                        id="forum-board-name-input"
                        type="text"
                        class="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 disabled:bg-gray-50 disabled:text-gray-400"
                        [value]="editingBoardName()"
                        (input)="setBoardName($event)"
                        [disabled]="savingBoardName()"
                      />
                    </div>
                    <div>
                      <label
                        for="forum-board-description-input"
                        class="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5"
                      >
                        Description
                        <span class="normal-case tracking-normal font-normal text-gray-400">(optional)</span>
                      </label>
                      <textarea
                        id="forum-board-description-input"
                        class="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 disabled:bg-gray-50 disabled:text-gray-400 resize-none"
                        rows="3"
                        placeholder="What is this board for?"
                        [value]="editingBoardDescription()"
                        (input)="setBoardDescription($event)"
                        [disabled]="savingBoardName()"
                      ></textarea>
                    </div>
                    <div class="grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-4">
                      <div class="text-center">
                        <p class="text-2xl font-bold text-gray-900">{{ board()?.memberCount ?? 0 }}</p>
                        <p class="text-[11px] text-gray-500 mt-0.5">members</p>
                      </div>
                      <div class="text-center">
                        <p class="text-2xl font-bold text-gray-900">{{ board()?.postCount ?? 0 }}</p>
                        <p class="text-[11px] text-gray-500 mt-0.5">posts</p>
                      </div>
                    </div>
                  </div>
                }

                <!-- Members Tab -->
                @if (managementTab() === 'members') {
                  <!-- Current Members -->
                  <div>
                    <div class="flex items-center justify-between mb-3">
                      <p class="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Current Members</p>
                    </div>
                    <div class="space-y-1 max-h-44 overflow-auto mb-4">
                      @if (boardMembersList().length === 0) {
                        <p class="text-sm text-gray-400 text-center py-4">No members yet.</p>
                      } @else {
                        @for (member of sortedBoardMembersList(); track member.id) {
                          <div
                            class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
                            [class]="
                              member.id === board()?.createdBy?.id
                                ? 'bg-violet-50 hover:bg-violet-100/60'
                                : member.isAdmin
                                  ? 'bg-amber-50 hover:bg-amber-100/60'
                                  : 'hover:bg-gray-50'
                            "
                          >
                            <div
                              class="h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-colors"
                              [class]="
                                member.id === board()?.createdBy?.id
                                  ? 'bg-violet-500'
                                  : member.isAdmin
                                    ? 'bg-amber-500'
                                    : 'bg-blue-500'
                              "
                            >
                              <span class="text-[11px] font-bold text-white">
                                {{ member.firstName[0] + member.lastName[0] }}
                              </span>
                            </div>
                            <div class="flex-1 min-w-0">
                              <div class="flex items-center gap-1.5 flex-wrap">
                                <p class="text-[13px] font-semibold text-gray-900 truncate">
                                  {{ member.firstName }} {{ member.lastName }}
                                </p>
                                @if (member.id === board()?.createdBy?.id) {
                                  <span
                                    class="inline-flex items-center rounded border border-violet-200 bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-violet-600 shrink-0"
                                  >
                                    Creator
                                  </span>
                                } @else if (member.isAdmin) {
                                  <span
                                    class="inline-flex items-center rounded border border-amber-200 bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-600 shrink-0"
                                  >
                                    Staff
                                  </span>
                                }
                              </div>
                              <p class="text-[11px] text-gray-400 truncate">{{ member.email }}</p>
                            </div>
                            <div class="flex items-center gap-1 shrink-0">
                              @if (isAdmin() && member.id !== board()?.createdBy?.id) {
                                <button
                                  type="button"
                                  class="h-7 w-7 rounded-full flex items-center justify-center transition-colors disabled:opacity-40"
                                  [class]="
                                    member.isAdmin
                                      ? 'bg-amber-100 text-amber-500 hover:bg-amber-200'
                                      : 'text-gray-300 hover:bg-amber-50 hover:text-amber-400'
                                  "
                                  [title]="member.isAdmin ? 'Remove board admin' : 'Grant board admin'"
                                  (click)="toggleBoardMemberAdmin(member.id, !member.isAdmin)"
                                  [disabled]="togglingAdminId() === member.id"
                                >
                                  @if (togglingAdminId() === member.id) {
                                    <svg
                                      class="animate-spin"
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="12"
                                      height="12"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      stroke-width="2"
                                    >
                                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                    </svg>
                                  } @else {
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="12"
                                      height="12"
                                      viewBox="0 0 24 24"
                                      [attr.fill]="member.isAdmin ? 'currentColor' : 'none'"
                                      stroke="currentColor"
                                      stroke-width="2"
                                      stroke-linecap="round"
                                      stroke-linejoin="round"
                                    >
                                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                    </svg>
                                  }
                                </button>
                              }
                              @if (isAdmin() || (member.id !== board()?.createdBy?.id && !member.isAdmin)) {
                                <button
                                  type="button"
                                  class="h-7 w-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
                                  (click)="removeBoardMemberFromForum(member.id)"
                                  [disabled]="removingMemberId() === member.id"
                                >
                                  @if (removingMemberId() === member.id) {
                                    <svg
                                      class="animate-spin"
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="13"
                                      height="13"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      stroke-width="2"
                                    >
                                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                    </svg>
                                  } @else {
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="13"
                                      height="13"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      stroke-width="2"
                                      stroke-linecap="round"
                                      stroke-linejoin="round"
                                    >
                                      <path d="M18 6 6 18" />
                                      <path d="m6 6 12 12" />
                                    </svg>
                                  }
                                </button>
                              }
                            </div>
                          </div>
                        }
                      }
                    </div>
                  </div>

                  <!-- Add Members -->
                  <div class="border-t border-gray-100 pt-4">
                    <p class="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Add Members</p>
                    <div class="relative mb-2">
                      <svg
                        class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        xmlns="http://www.w3.org/2000/svg"
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                      </svg>
                      <input
                        type="text"
                        class="w-full rounded-lg border border-gray-200 pl-8 pr-3 py-2.5 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 disabled:bg-gray-50"
                        placeholder="Search users by name or email..."
                        [value]="addMemberSearch()"
                        (input)="setAddMemberSearch($event)"
                        [disabled]="loadingUsers() || savingMembers()"
                      />
                    </div>

                    @if (loadingUsers()) {
                      <div class="flex items-center justify-center gap-2 py-4 text-[13px] text-gray-400">
                        <svg
                          class="animate-spin"
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                        Loading users...
                      </div>
                    } @else if (filteredAvailableUsers().length > 0) {
                      <div class="max-h-40 overflow-auto rounded-lg border border-gray-100 divide-y divide-gray-50">
                        @for (user of filteredAvailableUsers(); track user.id) {
                          <button
                            type="button"
                            class="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors disabled:opacity-50"
                            (click)="stageMemberToAdd(user)"
                            [disabled]="savingMembers()"
                          >
                            <div class="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                              <span class="text-[10px] font-bold text-gray-600">
                                {{ user.firstName[0] + user.lastName[0] }}
                              </span>
                            </div>
                            <div class="flex-1 min-w-0">
                              <p class="text-[13px] font-semibold text-gray-900 truncate">
                                {{ user.firstName }} {{ user.lastName }}
                              </p>
                              <p class="text-[11px] text-gray-400 truncate">{{ user.email }}</p>
                            </div>
                          </button>
                        }
                      </div>
                    } @else if (allUsers().length > 0) {
                      <p class="text-center text-[13px] text-gray-400 py-4">No users found matching your search.</p>
                    }
                  </div>

                  <!-- Pending Members -->
                  @if (pendingMembersToAdd().length > 0) {
                    <div class="border-t border-gray-100 pt-4">
                      <p class="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
                        Pending to Add
                      </p>
                      <div class="flex flex-wrap gap-2">
                        @for (member of pendingMembersToAdd(); track member.id) {
                          <div
                            class="inline-flex items-center gap-1.5 rounded-md bg-blue-50 border border-blue-100 px-3 py-1 text-[12px] font-semibold text-blue-700"
                          >
                            <span>{{ member.firstName }} {{ member.lastName }}</span>
                            <button
                              type="button"
                              class="text-blue-400 hover:text-blue-700 disabled:opacity-60 leading-none"
                              (click)="unstageMember(member.id)"
                              [disabled]="savingMembers()"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="11"
                                height="11"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              >
                                <path d="M18 6 6 18" />
                                <path d="m6 6 12 12" />
                              </svg>
                            </button>
                          </div>
                        }
                      </div>
                    </div>
                  }
                }

                <!-- Categories Tab -->
                @if (managementTab() === 'tags') {
                  <!-- Current Categories -->
                  <div>
                    <p class="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
                      Current Categories
                    </p>
                    @if (availableTags().length === 0) {
                      <p class="text-sm text-gray-400 text-center py-4">No categories yet.</p>
                    } @else {
                      <div class="max-h-44 overflow-auto space-y-1.5 mb-4">
                        @for (tag of availableTags(); track tag.id) {
                          <div class="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2">
                            <span
                              class="inline-block rounded-lg px-2.5 py-1 text-[11px] font-semibold"
                              [ngClass]="getTagColorClass(tag)"
                            >
                              {{ tag.name }}
                            </span>
                            <button
                              type="button"
                              class="h-6 w-6 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
                              (click)="deleteTag(tag.id)"
                              [disabled]="deletingTagId() === tag.id"
                            >
                              @if (deletingTagId() === tag.id) {
                                <svg
                                  class="animate-spin"
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  stroke-width="2"
                                >
                                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                </svg>
                              } @else {
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  stroke-width="2"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                >
                                  <path d="M18 6 6 18" />
                                  <path d="m6 6 12 12" />
                                </svg>
                              }
                            </button>
                          </div>
                        }
                      </div>
                    }
                  </div>

                  <!-- Add Category -->
                  <div class="border-t border-gray-100 pt-4">
                    <p class="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Add Category</p>
                    <div class="space-y-3">
                      <div>
                        <label
                          for="forum-tag-name"
                          class="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5"
                        >
                          Category Name
                        </label>
                        <input
                          id="forum-tag-name"
                          type="text"
                          class="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 disabled:bg-gray-50"
                          placeholder="e.g., Important"
                          [value]="newTagName()"
                          (input)="setNewTagName($event)"
                          [disabled]="creatingTag()"
                        />
                      </div>
                      <div>
                        <label
                          for="forum-tag-color"
                          class="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5"
                        >
                          Color
                        </label>
                        <select
                          id="forum-tag-color"
                          class="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 disabled:bg-gray-50"
                          [value]="newTagColor()"
                          (change)="setTagColor($event)"
                          [disabled]="creatingTag()"
                        >
                          <option value="blue">Blue</option>
                          <option value="green">Green</option>
                          <option value="red">Red</option>
                          <option value="orange">Orange</option>
                          <option value="purple">Purple</option>
                          <option value="yellow">Yellow</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        class="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                        (click)="createTag()"
                        [disabled]="creatingTag() || !newTagName().trim()"
                      >
                        {{ creatingTag() ? 'Creating...' : 'Add Category' }}
                      </button>
                    </div>
                  </div>
                }
              </div>

              <!-- Context-aware Footer -->
              <div class="border-t border-gray-100 px-5 py-4">
                @if (managementTab() === 'general') {
                  <button
                    type="button"
                    class="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                    (click)="saveBoardName()"
                    [disabled]="
                      savingBoardName() ||
                      (editingBoardName().trim() === board()?.name &&
                        editingBoardDescription() === board()?.description)
                    "
                  >
                    {{ savingBoardName() ? 'Saving...' : 'Save Changes' }}
                  </button>
                } @else if (managementTab() === 'members' && pendingMembersToAdd().length > 0) {
                  <button
                    type="button"
                    class="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:bg-gray-200 disabled:text-gray-400"
                    (click)="savePendingMembers()"
                    [disabled]="savingMembers()"
                  >
                    {{
                      savingMembers()
                        ? 'Adding...'
                        : 'Add ' +
                          pendingMembersToAdd().length +
                          ' Member' +
                          (pendingMembersToAdd().length === 1 ? '' : 's')
                    }}
                  </button>
                } @else {
                  <button
                    type="button"
                    class="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    (click)="closeManagementModal()"
                    [disabled]="savingMembers() || savingBoardName()"
                  >
                    Close
                  </button>
                }
              </div>
            </div>
          </div>
        }
      </section>

      <!-- ── Delete Post Confirmation Modal ── -->
      @if (pendingDeletePostId()) {
        <div
          class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
          (click)="cancelDeletePost()"
        >
          <div
            class="modal-sheet relative w-full sm:max-w-sm sm:mx-4 rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl max-h-[75dvh] overflow-y-auto"
            (click)="$event.stopPropagation()"
          >
            <!-- Drag handle - mobile only -->
            <div class="w-10 h-1 rounded-full bg-gray-300 mx-auto mt-3 mb-1 sm:hidden" aria-hidden="true"></div>
            <!-- Icon + header -->
            <div class="flex flex-col items-center px-6 pt-7 pb-5 text-center">
              <div class="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ef4444"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  <path d="M3 6h18" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </div>
              <h3 class="text-base font-bold text-gray-900 mb-1">Delete this post?</h3>
              <p class="text-sm text-gray-500 leading-relaxed">
                This will permanently delete the post and all its comments and replies. This action cannot be undone.
              </p>
            </div>
            <!-- Actions -->
            <div class="flex gap-2 px-6 pb-6">
              <button
                type="button"
                class="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                (click)="cancelDeletePost()"
              >
                Cancel
              </button>
              <button
                type="button"
                class="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                [disabled]="deletingPostId() !== null"
                (click)="confirmDeletePost()"
              >
                {{ deletingPostId() ? 'Deleting...' : 'Delete post' }}
              </button>
            </div>
          </div>
        </div>
      }

      <mas-footer />
    </div>
  `,
})
export class DiscussionBoardForumComponent implements OnInit {
  private http = inject(HttpClient);
  private authStore = inject(AuthStore);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private pushNotifications = inject(PushNotificationService);

  boardId = signal<string | null>(null);
  board = signal<BoardInfo | null>(null);
  posts = signal<DiscussionPost[]>([]);
  availableTags = signal<DiscussionTag[]>([]);
  selectedTagIds = signal<string[]>([]);
  selectedPostId = signal<string | null>(null);
  pendingQueryPostId = signal<string | null>(null);
  activeView = signal<'thread' | 'new'>('thread');
  postType = signal<'announcements' | 'threads'>('threads');
  sidebarCollapsed = signal(false);
  loading = signal(false);
  creatingPost = signal(false);
  creatingComment = signal(false);
  creatingAnnouncement = signal(false);
  sendEmailNotification = signal(false);
  previewPostId = signal<string | null>(null);
  boardUrl = computed(() => `${window.location.origin}/discussion/${this.boardId()}`);
  postPreviewUrl = computed(() => {
    const pid = this.previewPostId();
    return pid ? `${this.boardUrl()}?tab=announcements&post=${pid}` : this.boardUrl();
  });
  showPostErrors = signal(false);

  toggleCreatingAnnouncement(): void {
    const next = !this.creatingAnnouncement();
    this.creatingAnnouncement.set(next);
    if (!next) {
      this.sendEmailNotification.set(false);
      this.previewPostId.set(null);
    }
  }

  get emailPreviewBody(): string {
    return (
      this.newPostBody() ||
      '<span class="text-gray-400 text-xs italic">Post body will appear here as you type...</span>'
    );
  }

  toggleSendEmailNotification(): void {
    const next = !this.sendEmailNotification();
    this.sendEmailNotification.set(next);
    if (next) this.previewPostId.set(crypto.randomUUID());
    else this.previewPostId.set(null);
  }
  deletingPostId = signal<string | null>(null);
  pendingDeletePostId = signal<string | null>(null);
  deletingCommentId = signal<string | null>(null);
  editingPostId = signal<string | null>(null);
  editPostTitle = signal('');
  editPostBody = signal('');
  editPostTagIds = signal<string[]>([]);
  savingPostEdit = signal(false);
  editingCommentId = signal<string | null>(null);
  editCommentBody = signal('');
  savingCommentEdit = signal(false);
  pinningPostId = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  showManagementModal = signal(false);
  readonly managementTabs: ReadonlyArray<{ id: ManagementTab; label: string }> = [
    { id: 'general', label: 'General' },
    { id: 'members', label: 'Members' },
    { id: 'tags', label: 'Categories' },
  ];
  managementTab = signal<ManagementTab>('general');
  editingBoardName = signal('');
  editingBoardDescription = signal('');
  savingBoardName = signal(false);
  boardMembersList = signal<BoardMember[]>([]);
  allUsers = signal<BoardMember[]>([]);
  addMemberSearch = signal('');
  pendingMembersToAdd = signal<BoardMember[]>([]);
  savingMembers = signal(false);
  removingMemberId = signal<string | null>(null);
  togglingAdminId = signal<string | null>(null);
  loadingUsers = signal(false);

  sortedBoardMembersList = computed(() => {
    const creatorId = this.board()?.createdBy?.id;
    const fullName = (m: BoardMember) => `${m.firstName} ${m.lastName}`.toLowerCase();
    const members = [...this.boardMembersList()];
    return members.sort((a, b) => {
      const aIsCreator = a.id === creatorId;
      const bIsCreator = b.id === creatorId;
      if (aIsCreator !== bIsCreator) return aIsCreator ? -1 : 1;
      const aIsAdmin = a.isAdmin;
      const bIsAdmin = b.isAdmin;
      if (aIsAdmin !== bIsAdmin) return aIsAdmin ? -1 : 1;
      return fullName(a).localeCompare(fullName(b));
    });
  });
  creatingTag = signal(false);
  deletingTagId = signal<string | null>(null);

  showFilterPanel = signal(false);
  newTagName = signal('');
  newTagColor = signal<'blue' | 'green' | 'red' | 'orange' | 'purple' | 'yellow'>('blue');
  newPostTitle = signal('');
  newPostBody = signal('');
  newCommentBody = signal('');
  newReplyBody = signal('');
  replyingToCommentId = signal<string | null>(null);
  creatingReply = signal(false);
  searchQuery = signal('');
  collapsedComments = signal<Set<string>>(new Set());
  commentVotes = signal<Map<string, 'UP' | 'DOWN' | null>>(new Map());
  votingCommentId = signal<string | null>(null);
  selectedTagFilter = signal<string | null>(null);

  isLoggedIn = computed(() => Boolean(this.authStore.user()));
  isAdmin = computed(() => this.authStore.isStaff());
  currentUser = computed(() => this.authStore.user());
  isBoardAdmin = computed(() => {
    const uid = this.currentUser()?.id;
    return this.boardMembersList().some((m) => m.id === uid && m.isAdmin);
  });
  canPostAnnouncement = computed(() => this.isAdmin() || this.isBoardAdmin());

  filteredAvailableUsers = computed(() => {
    const query = this.addMemberSearch().trim().toLowerCase();
    const existingIds = new Set([
      ...this.boardMembersList().map((m) => m.id),
      ...this.pendingMembersToAdd().map((m) => m.id),
    ]);
    return this.allUsers()
      .filter((u) => !existingIds.has(u.id))
      .filter(
        (u) =>
          !query ||
          `${u.firstName} ${u.lastName}`.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query),
      );
  });

  filteredPosts = computed(() => {
    const term = this.searchQuery().trim().toLowerCase();
    const postType = this.postType();
    const selectedTagId = this.selectedTagFilter();
    const allPosts = this.posts();

    let filtered = allPosts.filter((post) => {
      const isAnnouncement = post.isAnnouncement;
      if (postType === 'announcements') {
        return isAnnouncement;
      } else {
        return !isAnnouncement;
      }
    });

    if (selectedTagId) {
      filtered = filtered.filter((post) => {
        return post.tags.some((tag) => tag.id === selectedTagId);
      });
    }

    if (term) {
      filtered = filtered.filter((post) => {
        const author = this.fullName(post.author).toLowerCase();
        return (
          post.title.toLowerCase().includes(term) || post.body.toLowerCase().includes(term) || author.includes(term)
        );
      });
    }

    // Always sort pinned posts to the top (enables reactive hot-reload of pin/unpin)
    return [...filtered].sort((a, b) => {
      if (a.isPinned === b.isPinned) return 0;
      return a.isPinned ? -1 : 1;
    });
  });

  tabPostsEmpty = computed(() => {
    const postType = this.postType();
    const allPosts = this.posts();
    if (postType === 'announcements') {
      return !allPosts.some((p) => p.isAnnouncement);
    }
    return !allPosts.some((p) => !p.isAnnouncement || p.isPinned);
  });

  selectedPost = computed(() => {
    const selectedId = this.selectedPostId();
    if (!selectedId) {
      return undefined;
    }
    return this.posts().find((post) => post.id === selectedId);
  });

  ngOnInit(): void {
    if (this.isLoggedIn()) {
      this.pushNotifications.subscribe();
    }
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.boardId.set(id);
        this.loadBoard(id);
        this.loadPosts(id);
        this.loadTags(id);
        this.loadBoardMembersList(id);
      }
    });
    this.route.queryParamMap.subscribe((queryParams) => {
      const tab = queryParams.get('tab');
      if (tab === 'announcements' || tab === 'threads') {
        this.postType.set(tab);
      }
      const postId = queryParams.get('post');
      if (postId) {
        this.pendingQueryPostId.set(postId);
        const existing = this.posts().find((p) => p.id === postId);
        if (existing) {
          this.selectPost(existing.id, existing.isAnnouncement);
        }
      }
    });
  }

  private loadBoard(boardId: string): void {
    this.loading.set(true);

    this.http.get<BoardInfo>(`/api/discussion-boards/${boardId}`).subscribe({
      next: (board) => {
        this.board.set(board);
      },
      error: (error) => {
        this.errorMessage.set(this.getApiErrorMessage(error, 'Unable to load board.'));
      },
      complete: () => {
        this.loading.set(false);
      },
    });
  }

  private loadPosts(boardId: string): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.http.get<DiscussionPost[]>(`/api/discussion-posts?boardId=${boardId}`).subscribe({
      next: (posts) => {
        this.posts.set(posts);
        const pending = this.pendingQueryPostId();
        if (pending) {
          const pendingPost = posts.find((p) => p.id === pending);
          if (pendingPost) {
            this.selectPost(pendingPost.id, pendingPost.isAnnouncement);
          }
        } else if (this.selectedPostId() && !posts.find((post) => post.id === this.selectedPostId())) {
          this.selectedPostId.set(null);
        }
        this.loadUserVotes(boardId);
      },
      error: (error) => {
        this.errorMessage.set(this.getApiErrorMessage(error, 'Unable to load discussion posts right now.'));
      },
      complete: () => {
        this.loading.set(false);
      },
    });
  }

  private loadPostById(postId: string): void {
    this.http.get<DiscussionPost>(`/api/discussion-posts/${postId}`).subscribe({
      next: (post) => {
        const currentPosts = this.posts();
        const index = currentPosts.findIndex((p) => p.id === postId);
        if (index >= 0) {
          const updatedPosts = [...currentPosts];
          updatedPosts[index] = post;
          this.posts.set(updatedPosts);
        }
      },
      error: () => {
        // Silently ignore failed refresh
      },
    });
  }

  private loadTags(boardId: string): void {
    this.http.get<DiscussionTag[]>(`/api/discussion-boards/${boardId}/tags`).subscribe({
      next: (tags) => {
        this.availableTags.set(tags);
        this.selectDefaultTag(tags);
        this.errorMessage.set(null);
      },
      error: () => {
        this.availableTags.set([]);
      },
    });
  }

  private loadUserVotes(boardId: string): void {
    if (!this.isLoggedIn()) return;
    this.http.get<Record<string, 'UP' | 'DOWN'>>(`/api/discussion-boards/${boardId}/my-votes`).subscribe({
      next: (votes) => {
        this.commentVotes.update((map) => {
          const next = new Map(map);
          for (const [commentId, vote] of Object.entries(votes)) {
            next.set(commentId, vote);
          }
          return next;
        });
      },
      error: () => {
        // Silently ignore — vote state just won't be pre-populated
      },
    });
  }

  fullName(user: DiscussionUser): string {
    return `${user.firstName} ${user.lastName}`.trim();
  }

  isBoardAdminAuthor(userId: string): boolean {
    return this.boardMembersList().some((m) => m.id === userId && m.isAdmin);
  }

  private loadUsersForBoardStaff(boardId: string, query: string): void {
    this.loadingUsers.set(true);
    this.http
      .get<BoardMember[]>(`/api/discussion-boards/${boardId}/users/search?q=${encodeURIComponent(query)}`)
      .subscribe({
        next: (users) => {
          this.allUsers.set(users);
          this.loadingUsers.set(false);
        },
        error: () => {
          this.allUsers.set([]);
          this.loadingUsers.set(false);
        },
      });
  }

  formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d`;
    if (seconds < 31536000) return `${Math.floor(seconds / 2592000)}mo`;
    return `${Math.floor(seconds / 31536000)}y`;
  }

  setSearch(event: Event): void {
    const value = (event.target as HTMLInputElement | null)?.value ?? '';
    this.searchQuery.set(value);
  }

  selectAnnouncements(): void {
    this.postType.set('announcements');
  }

  selectThreads(): void {
    this.postType.set('threads');
  }

  setTagFilter(event: Event): void {
    const value = (event.target as HTMLSelectElement | null)?.value ?? '';
    this.selectedTagFilter.set(value || null);
  }

  @ViewChild('threadContent') threadContentRef?: ElementRef<HTMLElement>;

  selectPost(postId: string, isAnnouncement = false): void {
    this.selectedPostId.set(postId);
    this.activeView.set('thread');
    this.postType.set(isAnnouncement ? 'announcements' : 'threads');
    this.sidebarCollapsed.set(true);
    this.threadContentRef?.nativeElement.scrollTo({ top: 0, behavior: 'smooth' });
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { post: postId, tab: isAnnouncement ? 'announcements' : 'threads' },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  openCreatePost(): void {
    this.activeView.set('new');
    this.sidebarCollapsed.set(true);
  }

  cancelCreatePost(): void {
    this.newPostTitle.set('');
    this.newPostBody.set('');
    this.showPostErrors.set(false);
    this.selectDefaultTag(this.availableTags());
    this.creatingAnnouncement.set(false);
    this.activeView.set('thread');
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { post: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  setNewPostTitle(event: Event): void {
    const value = (event.target as HTMLInputElement | null)?.value ?? '';
    this.newPostTitle.set(value);
  }

  setNewTagName(event: Event): void {
    const value = (event.target as HTMLInputElement | null)?.value ?? '';
    this.newTagName.set(value);
  }

  setNewPostBody(event: Event): void {
    const value = (event.target as HTMLTextAreaElement | null)?.value ?? '';
    this.newPostBody.set(value);
  }

  setTagColor(event: Event): void {
    const value = (event.target as HTMLSelectElement | null)?.value ?? 'blue';
    this.newTagColor.set(value as 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'yellow');
  }

  toggleTag(tagId: string): void {
    this.selectedTagIds.update((ids) => (ids.includes(tagId) ? ids.filter((id) => id !== tagId) : [...ids, tagId]));
  }

  // Radio-style: selecting a tag deselects any previously selected tag
  selectTag(tagId: string): void {
    this.selectedTagIds.update((ids) => (ids.includes(tagId) ? [] : [tagId]));
  }

  private selectDefaultTag(tags: DiscussionTag[]): void {
    const general = tags.find((t) => t.name.toLowerCase() === 'general');
    this.selectedTagIds.set(general ? [general.id] : []);
  }

  createPost(): void {
    const rawTitle = this.newPostTitle().trim();
    const title = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
    const body = this.newPostBody();

    if (!this.isLoggedIn()) return;

    if (!title || this.isBodyEmpty(body) || this.selectedTagIds().length === 0) {
      this.showPostErrors.set(true);
      return;
    }

    this.creatingPost.set(true);
    this.errorMessage.set(null);

    const boardId = this.boardId();
    const endpoint = boardId ? `/api/discussion-boards/${boardId}/posts` : '/api/discussion-posts';

    this.http
      .post<DiscussionPost>(endpoint, {
        title,
        body,
        tagIds: this.selectedTagIds(),
        isAnnouncement: this.creatingAnnouncement(),
        sendEmailNotification: this.sendEmailNotification(),
        boardUrl: this.sendEmailNotification() ? this.boardUrl() : undefined,
        postId: this.previewPostId() ?? undefined,
        boardId,
      })
      .subscribe({
        next: (post) => {
          this.newPostTitle.set('');
          this.newPostBody.set('');
          this.showPostErrors.set(false);
          this.selectDefaultTag(this.availableTags());
          this.creatingAnnouncement.set(false);
          this.sendEmailNotification.set(false);
          this.previewPostId.set(null);
          this.postType.set(post.isAnnouncement ? 'announcements' : 'threads');
          this.selectedPostId.set(post.id);
          this.activeView.set('thread');
          this.posts.set([post, ...this.posts()]);
        },
        error: (error) => {
          this.errorMessage.set(this.getApiErrorMessage(error, 'Unable to create post right now. Please try again.'));
          this.creatingPost.set(false);
        },
        complete: () => {
          this.creatingPost.set(false);
        },
      });
  }

  setCommentBody(event: Event): void {
    const value = (event.target as HTMLTextAreaElement | null)?.value ?? '';
    this.newCommentBody.set(value);
  }

  setReplyBody(event: Event): void {
    const value = (event.target as HTMLTextAreaElement | null)?.value ?? '';
    this.newReplyBody.set(value);
  }

  isBodyEmpty(html: string): boolean {
    if (!html) return true;
    return !html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, '')
      .trim();
  }

  toggleCollapsed(commentId: string): void {
    this.collapsedComments.update((set) => {
      const next = new Set(set);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  }

  startReply(commentId: string): void {
    this.editingCommentId.set(null);
    this.replyingToCommentId.set(commentId);
    this.newReplyBody.set('');
  }

  cancelReply(): void {
    this.replyingToCommentId.set(null);
    this.newReplyBody.set('');
  }

  createComment(postId: string): void {
    const body = this.newCommentBody();

    if (!this.isLoggedIn() || this.isBodyEmpty(body)) {
      return;
    }

    this.creatingComment.set(true);
    this.errorMessage.set(null);

    this.http.post<DiscussionComment>(`/api/discussion-posts/${postId}/comments`, { body }).subscribe({
      next: () => {
        this.newCommentBody.set('');
        this.loadPostById(postId);
      },
      error: (error) => {
        this.errorMessage.set(this.getApiErrorMessage(error, 'Unable to add comment right now. Please try again.'));
        this.creatingComment.set(false);
      },
      complete: () => {
        this.creatingComment.set(false);
      },
    });
  }

  createReply(postId: string, parentCommentId: string): void {
    const body = this.newReplyBody();

    if (!this.isLoggedIn() || this.isBodyEmpty(body)) {
      return;
    }

    this.creatingReply.set(true);
    this.errorMessage.set(null);

    this.http.post<DiscussionComment>(`/api/discussion-posts/${postId}/comments`, { body, parentCommentId }).subscribe({
      next: () => {
        this.cancelReply();
        this.loadPostById(postId);
      },
      error: (error) => {
        this.errorMessage.set(this.getApiErrorMessage(error, 'Unable to add reply right now. Please try again.'));
        this.creatingReply.set(false);
      },
      complete: () => {
        this.creatingReply.set(false);
      },
    });
  }

  togglePin(postId: string): void {
    this.pinningPostId.set(postId);

    this.http.patch<{ id: string; isPinned: boolean }>(`/api/discussion-posts/${postId}/pin`, {}).subscribe({
      next: (response) => {
        this.posts.update((posts) =>
          posts.map((post) => (post.id === postId ? { ...post, isPinned: response.isPinned } : post)),
        );
        this.pinningPostId.set(null);
        this.errorMessage.set(null);
      },
      error: (error) => {
        this.errorMessage.set(this.getApiErrorMessage(error, 'Failed to toggle pin status'));
        this.pinningPostId.set(null);
      },
    });
  }

  deletePost(postId: string): void {
    this.pendingDeletePostId.set(postId);
    document.body.style.overflow = 'hidden';
  }

  cancelDeletePost(): void {
    this.pendingDeletePostId.set(null);
    document.body.style.overflow = '';
  }

  confirmDeletePost(): void {
    const postId = this.pendingDeletePostId();
    if (!postId) return;
    this.pendingDeletePostId.set(null);
    document.body.style.overflow = '';

    this.deletingPostId.set(postId);

    this.http.delete(`/api/discussion-posts/${postId}`).subscribe({
      next: () => {
        this.posts.update((posts) => posts.filter((p) => p.id !== postId));
        this.selectedPostId.set(null);
        this.activeView.set('thread');
        this.deletingPostId.set(null);
        this.errorMessage.set(null);
      },
      error: (error) => {
        this.errorMessage.set(this.getApiErrorMessage(error, 'Failed to delete post'));
        this.deletingPostId.set(null);
      },
    });
  }

  deleteComment(postId: string, commentId: string): void {
    this.deletingCommentId.set(commentId);

    this.http.delete(`/api/discussion-posts/${postId}/comments/${commentId}`).subscribe({
      next: () => {
        const updatedPosts = this.posts().map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              comments: this.removeCommentRecursive(post.comments, commentId),
            };
          }
          return post;
        });
        this.posts.set(updatedPosts);
        this.deletingCommentId.set(null);
        this.errorMessage.set(null);
      },
      error: (error) => {
        this.errorMessage.set(this.getApiErrorMessage(error, 'Failed to delete comment'));
        this.deletingCommentId.set(null);
      },
    });
  }

  private removeCommentRecursive(comments: DiscussionComment[], commentId: string): DiscussionComment[] {
    return comments
      .filter((c) => c.id !== commentId)
      .map((c) => ({
        ...c,
        replies: this.removeCommentRecursive(c.replies, commentId),
      }));
  }

  private updateCommentBodyRecursive(
    comments: DiscussionComment[],
    commentId: string,
    body: string,
  ): DiscussionComment[] {
    return comments.map((c) => {
      if (c.id === commentId) return { ...c, body };
      return { ...c, replies: this.updateCommentBodyRecursive(c.replies, commentId, body) };
    });
  }

  startEditPost(post: DiscussionPost): void {
    this.editPostTitle.set(post.title);
    this.editPostBody.set(post.body);
    this.editPostTagIds.set(post.tags.map((t) => t.id));
    this.editingPostId.set(post.id);
  }

  toggleEditPostTag(tagId: string): void {
    const ids = this.editPostTagIds();
    this.editPostTagIds.set(ids.includes(tagId) ? [] : [tagId]);
  }

  cancelPostEdit(): void {
    this.editingPostId.set(null);
  }

  savePostEdit(postId: string): void {
    const title = this.editPostTitle().trim();
    const body = this.editPostBody();
    if (!title || this.isBodyEmpty(body)) return;

    this.savingPostEdit.set(true);
    const tagIds = this.editPostTagIds();
    this.http.patch<DiscussionPost>(`/api/discussion-posts/${postId}`, { title, body, tagIds }).subscribe({
      next: (updated) => {
        this.posts.update((posts) =>
          posts.map((p) =>
            p.id === postId ? { ...p, title: updated.title, body: updated.body, tags: updated.tags } : p,
          ),
        );
        this.editingPostId.set(null);
        this.savingPostEdit.set(false);
      },
      error: (error) => {
        this.errorMessage.set(this.getApiErrorMessage(error, 'Failed to update post'));
        this.savingPostEdit.set(false);
      },
    });
  }

  startEditComment(comment: DiscussionComment): void {
    this.replyingToCommentId.set(null);
    this.newReplyBody.set('');
    this.editCommentBody.set(comment.body);
    this.editingCommentId.set(comment.id);
  }

  cancelCommentEdit(): void {
    this.editingCommentId.set(null);
  }

  saveCommentEdit(postId: string, commentId: string): void {
    const body = this.editCommentBody();
    if (this.isBodyEmpty(body)) return;

    this.savingCommentEdit.set(true);
    this.http
      .patch<{ id: string; body: string }>(`/api/discussion-posts/${postId}/comments/${commentId}`, { body })
      .subscribe({
        next: (updated) => {
          this.posts.update((posts) =>
            posts.map((p) => {
              if (p.id !== postId) return p;
              return { ...p, comments: this.updateCommentBodyRecursive(p.comments, commentId, updated.body) };
            }),
          );
          this.editingCommentId.set(null);
          this.savingCommentEdit.set(false);
        },
        error: (error) => {
          this.errorMessage.set(this.getApiErrorMessage(error, 'Failed to update comment'));
          this.savingCommentEdit.set(false);
        },
      });
  }

  voteComment(postId: string, commentId: string, type: 'UP' | 'DOWN'): void {
    if (!this.isLoggedIn() || this.votingCommentId() === commentId) return;

    const currentVote = this.commentVotes().get(commentId) ?? null;

    // Optimistic: update local vote state
    const newVote: 'UP' | 'DOWN' | null = currentVote === type ? null : type;
    this.commentVotes.update((map) => {
      const next = new Map(map);
      next.set(commentId, newVote);
      return next;
    });

    // Optimistic: update local counts
    this.posts.update((posts) =>
      posts.map((post) => {
        if (post.id !== postId) return post;
        return { ...post, comments: this.updateCommentVotesRecursive(post.comments, commentId, type, currentVote) };
      }),
    );

    this.votingCommentId.set(commentId);

    this.http
      .post<{
        commentId: string;
        upvotes: number;
        downvotes: number;
        userVote: 'UP' | 'DOWN' | null;
      }>(`/api/discussion-posts/${postId}/comments/${commentId}/vote`, { type })
      .subscribe({
        next: (result) => {
          this.commentVotes.update((map) => {
            const next = new Map(map);
            next.set(commentId, result.userVote);
            return next;
          });
          this.posts.update((posts) =>
            posts.map((post) => {
              if (post.id !== postId) return post;
              return {
                ...post,
                comments: this.syncCommentVoteCountsRecursive(
                  post.comments,
                  result.commentId,
                  result.upvotes,
                  result.downvotes,
                ),
              };
            }),
          );
        },
        error: () => {
          // Revert optimistic update
          this.commentVotes.update((map) => {
            const next = new Map(map);
            next.set(commentId, currentVote);
            return next;
          });
          this.loadPostById(postId);
        },
        complete: () => {
          this.votingCommentId.set(null);
        },
      });
  }

  private updateCommentVotesRecursive(
    comments: DiscussionComment[],
    commentId: string,
    type: 'UP' | 'DOWN',
    previousVote: 'UP' | 'DOWN' | null,
  ): DiscussionComment[] {
    return comments.map((c) => {
      if (c.id === commentId) {
        const isToggle = previousVote === type;
        let upvotes = c.upvotes;
        let downvotes = c.downvotes;
        if (isToggle) {
          if (type === 'UP') upvotes = Math.max(0, upvotes - 1);
          else downvotes = Math.max(0, downvotes - 1);
        } else {
          if (type === 'UP') {
            upvotes++;
            if (previousVote === 'DOWN') downvotes = Math.max(0, downvotes - 1);
          } else {
            downvotes++;
            if (previousVote === 'UP') upvotes = Math.max(0, upvotes - 1);
          }
        }
        return { ...c, upvotes, downvotes };
      }
      if (c.replies.length > 0) {
        return { ...c, replies: this.updateCommentVotesRecursive(c.replies, commentId, type, previousVote) };
      }
      return c;
    });
  }

  private syncCommentVoteCountsRecursive(
    comments: DiscussionComment[],
    commentId: string,
    upvotes: number,
    downvotes: number,
  ): DiscussionComment[] {
    return comments.map((c) => {
      if (c.id === commentId) return { ...c, upvotes, downvotes };
      if (c.replies.length > 0) {
        return { ...c, replies: this.syncCommentVoteCountsRecursive(c.replies, commentId, upvotes, downvotes) };
      }
      return c;
    });
  }

  openManagementModal(tab: ManagementTab = 'general'): void {
    this.managementTab.set(tab);
    this.addMemberSearch.set('');
    this.pendingMembersToAdd.set([]);
    this.newTagName.set('');
    this.newTagColor.set('blue');
    const board = this.board();
    if (board?.name) {
      this.editingBoardName.set(board.name);
    }
    if (board?.description) {
      this.editingBoardDescription.set(board.description);
    } else {
      this.editingBoardDescription.set('');
    }
    const boardId = this.boardId();
    if (boardId) {
      this.loadBoardMembersList(boardId);
      if (this.isAdmin()) {
        this.loadAllUsersForForum();
      } else if (this.isBoardAdmin()) {
        this.loadUsersForBoardStaff(boardId, '');
      }
    }
    this.showManagementModal.set(true);
    document.body.style.overflow = 'hidden';
  }

  setEditPostTitle(event: Event): void {
    this.editPostTitle.set((event.target as HTMLInputElement).value);
  }

  closeManagementModal(): void {
    this.showManagementModal.set(false);
    this.addMemberSearch.set('');
    this.pendingMembersToAdd.set([]);
    if (!this.isAdmin()) {
      this.allUsers.set([]);
    }
    document.body.style.overflow = '';
  }

  private loadBoardMembersList(boardId: string): void {
    this.http.get<BoardMember[]>(`/api/discussion-boards/${boardId}/members`).subscribe({
      next: (members) => {
        this.boardMembersList.set(members);
      },
      error: () => {
        this.boardMembersList.set([]);
      },
    });
  }

  private loadAllUsersForForum(): void {
    this.loadingUsers.set(true);
    this.http.get<BoardMember[]>('/api/users/names').subscribe({
      next: (users) => {
        this.allUsers.set(users);
      },
      error: () => {
        this.allUsers.set([]);
      },
      complete: () => {
        this.loadingUsers.set(false);
      },
    });
  }

  setAddMemberSearch(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.addMemberSearch.set(query);
    if (!this.isAdmin() && this.isBoardAdmin()) {
      const boardId = this.boardId();
      if (!boardId) return;
      this.loadUsersForBoardStaff(boardId, query);
    }
  }

  stageMemberToAdd(user: BoardMember): void {
    this.pendingMembersToAdd.update((members) => [...members, user]);
    this.addMemberSearch.set('');
  }

  unstageMember(userId: string): void {
    this.pendingMembersToAdd.update((members) => members.filter((m) => m.id !== userId));
  }

  savePendingMembers(): void {
    const boardId = this.boardId();
    if (!boardId || this.pendingMembersToAdd().length === 0) return;

    this.savingMembers.set(true);
    const pending = this.pendingMembersToAdd();
    const addRequests = pending.map((user) =>
      lastValueFrom(this.http.post(`/api/discussion-boards/${boardId}/members`, { userId: user.id })),
    );

    Promise.all(addRequests)
      .then(
        () => {
          this.loadBoardMembersList(boardId);
          if (this.board()) {
            this.board.update((b) => (b ? { ...b, memberCount: b.memberCount + pending.length } : b));
          }
          this.pendingMembersToAdd.set([]);
        },
        () => {
          this.errorMessage.set(this.getApiErrorMessage(null, 'Unable to add members.'));
        },
      )
      .finally(() => {
        this.savingMembers.set(false);
      });
  }

  removeBoardMemberFromForum(userId: string): void {
    const boardId = this.boardId();
    if (!boardId) return;

    this.removingMemberId.set(userId);

    this.http.delete(`/api/discussion-boards/${boardId}/members/${userId}`).subscribe({
      next: () => {
        this.loadBoardMembersList(boardId);
        if (this.board()) {
          this.board.update((b) => (b ? { ...b, memberCount: Math.max(0, b.memberCount - 1) } : b));
        }
      },
      error: (error) => {
        this.errorMessage.set(this.getApiErrorMessage(error, 'Unable to remove member.'));
      },
      complete: () => {
        this.removingMemberId.set(null);
      },
    });
  }

  toggleBoardMemberAdmin(userId: string, makeAdmin: boolean): void {
    const boardId = this.boardId();
    if (!boardId) return;

    this.togglingAdminId.set(userId);

    this.http.patch(`/api/discussion-boards/${boardId}/members/${userId}/admin`, { isAdmin: makeAdmin }).subscribe({
      next: () => {
        this.loadBoardMembersList(boardId);
      },
      error: (error) => {
        this.errorMessage.set(this.getApiErrorMessage(error, 'Unable to update member admin status.'));
      },
      complete: () => {
        this.togglingAdminId.set(null);
      },
    });
  }

  setBoardName(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.editingBoardName.set(value);
  }

  setBoardDescription(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.editingBoardDescription.set(value);
  }

  saveBoardName(): void {
    const boardId = this.boardId();
    const newName = this.editingBoardName().trim();
    if (!boardId || !newName) return;

    this.savingBoardName.set(true);
    const updateData: { name: string; description?: string } = { name: newName };
    if (this.editingBoardDescription() !== this.board()?.description) {
      updateData.description = this.editingBoardDescription();
    }

    this.http.patch<BoardInfo>(`/api/discussion-boards/${boardId}`, updateData).subscribe({
      next: (updatedBoard) => {
        this.board.set(updatedBoard);
        this.errorMessage.set(null);
      },
      error: (error) => {
        this.errorMessage.set(this.getApiErrorMessage(error, 'Unable to update board.'));
      },
      complete: () => {
        this.savingBoardName.set(false);
      },
    });
  }

  createTag(): void {
    const name = this.newTagName().trim();
    const boardId = this.boardId();
    if (!name || !boardId) return;

    this.creatingTag.set(true);

    this.http
      .post(`/api/discussion-boards/${boardId}/tags`, {
        name,
        color: this.newTagColor(),
      })
      .subscribe({
        next: () => {
          this.newTagName.set('');
          this.newTagColor.set('blue');
          this.loadTags(boardId);
        },
        error: (error) => {
          this.errorMessage.set(this.getApiErrorMessage(error, 'Unable to create tag.'));
        },
        complete: () => {
          this.creatingTag.set(false);
        },
      });
  }

  deleteTag(tagId: string): void {
    const boardId = this.boardId();
    if (!boardId) return;
    this.deletingTagId.set(tagId);

    this.http.delete(`/api/discussion-boards/${boardId}/tags/${tagId}`).subscribe({
      next: () => {
        this.loadTags(boardId);
        this.deletingTagId.set(null);
      },
      error: (error) => {
        this.errorMessage.set(this.getApiErrorMessage(error, 'Unable to delete tag.'));
        this.deletingTagId.set(null);
      },
    });
  }

  getTagColorClass(tag: DiscussionTag): string {
    const colorMap: { [key: string]: string } = {
      blue: 'bg-blue-50 text-blue-700',
      green: 'bg-green-50 text-green-700',
      red: 'bg-red-50 text-red-700',
      orange: 'bg-orange-50 text-orange-700',
      purple: 'bg-purple-50 text-purple-700',
      yellow: 'bg-yellow-50 text-yellow-700',
    };
    return colorMap[tag.color] || 'bg-blue-50 text-blue-700';
  }

  private getApiErrorMessage(error: unknown, fallback: string): string {
    if (!(error instanceof HttpErrorResponse)) {
      return fallback;
    }

    const apiError = error.error;
    if (typeof apiError === 'string' && apiError.trim()) {
      return apiError;
    }

    const message = apiError?.message;
    if (Array.isArray(message) && typeof message[0] === 'string') {
      return message[0];
    }
    if (typeof message === 'string' && message.trim()) {
      return message;
    }

    return fallback;
  }
}
