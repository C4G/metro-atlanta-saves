import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { AuthStore } from '@mas/frontend-shared-auth';
import { FooterComponent } from '@mas/frontend-shared-layout';

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
    bio?: string | null;
  };
  memberCount: number;
  postCount: number;
};

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  bio?: string | null;
  role?: 'Administrator' | 'Partner_Staff' | null;
};

type BoardMember = User & {
  joinedAt: string;
  isAdmin: boolean;
};

type DiscussionTag = {
  id: string;
  name: string;
  color: string;
};

@Component({
  selector: 'mas-discussion-boards-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-75">
        <div class="flex flex-col items-center gap-3">
          <div class="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
          <p class="text-sm font-medium text-gray-600">Loading discussion boards...</p>
        </div>
      </div>
    }

    <div class="flex min-h-dvh flex-col">
      <section class="flex-1 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 w-full">
        <header class="mb-8 hidden sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Discussion Boards</h1>
            <p class="mt-1 text-sm text-gray-600">Select a board to start discussing with your community.</p>
          </div>
          @if (isAdmin()) {
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
              (click)="openCreateBoardModal()"
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
              New Board
            </button>
          }
        </header>

        <header class="mb-6 sm:hidden">
          <h1 class="text-3xl font-bold text-gray-900">Discussion Boards</h1>
          <p class="mt-1 text-sm text-gray-600">Select a board to start discussing with your community.</p>
          @if (isAdmin()) {
            <hr class="my-6 border-gray-200" />
            <button
              type="button"
              class="w-full justify-center inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
              (click)="openCreateBoardModal()"
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
              New Board
            </button>
          }
        </header>
        <hr class="mb-8 border-gray-200" />

        @if (errorMessage(); as error) {
          <div class="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {{ error }}
          </div>
        }

        @if (boards().length === 0 && !loading()) {
          <div class="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
            <p class="text-gray-600">No discussion boards available yet.</p>
            @if (isAdmin()) {
              <p class="mt-2 text-sm text-gray-500">Create your first board to get started.</p>
            }
          </div>
        } @else if (boards().length > 0) {
          <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            @for (board of boards(); track board.id) {
              <div
                class="flex flex-col rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all duration-200 border-l-4 overflow-hidden"
                [ngClass]="getBoardColor(board.id)"
              >
                <!-- Card body -->
                <div class="flex-1 px-5 pt-5 pb-4">
                  <h3 class="text-[15px] font-bold text-gray-900 leading-snug tracking-tight">{{ board.name }}</h3>
                  @if (board.description) {
                    <p class="mt-2 line-clamp-2 text-[13px] leading-relaxed text-gray-500">{{ board.description }}</p>
                  } @else {
                    <p class="mt-2 text-[13px] italic text-gray-400">No description provided.</p>
                  }
                  <div class="mt-4 flex items-center gap-3">
                    <div class="flex items-center gap-1.5">
                      <span class="text-sm font-bold text-gray-800">{{ board.memberCount }}</span>
                      <span class="text-xs text-gray-400 font-medium">members</span>
                    </div>
                    <span class="text-gray-200 select-none">|</span>
                    <div class="flex items-center gap-1.5">
                      <span class="text-sm font-bold text-gray-800">{{ board.postCount }}</span>
                      <span class="text-xs text-gray-400 font-medium">posts</span>
                    </div>
                  </div>
                </div>
                <!-- Card footer -->
                <div class="flex items-center gap-2 border-t border-gray-100 bg-gray-50/60 px-5 py-3">
                  <a
                    class="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-center text-xs font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
                    [routerLink]="['/discussion', board.id]"
                  >
                    Open Board
                  </a>
                  @if (canManageBoard(board)) {
                    <button
                      type="button"
                      class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 hover:border-gray-300 transition-colors inline-flex items-center gap-1.5"
                      (click)="openBoardSettings(board)"
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
                          d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
                        />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      Manage
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        }
        <!-- Create/Edit Board Modal -->
        @if (showBoardModal()) {
          <div
            class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm sm:px-4"
          >
            <div
              class="modal-sheet relative flex flex-col w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-gray-100 bg-white shadow-xl max-h-[75dvh] sm:max-h-[90dvh]"
            >
              <!-- Drag handle - mobile only -->
              <div class="w-10 h-1 rounded-full bg-gray-300 mx-auto mt-3 mb-1 sm:hidden" aria-hidden="true"></div>
              <!-- Modal Header -->
              <div class="flex items-start justify-between px-6 pt-6 pb-5 border-b border-gray-100">
                <div>
                  <p class="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">
                    {{ editingBoard() ? 'Edit' : 'New' }} Board
                  </p>
                  <h2 class="text-lg font-bold text-gray-900 leading-tight">
                    {{ editingBoard() ? 'Edit Board' : 'Create a New Board' }}
                  </h2>
                </div>
                <button
                  type="button"
                  class="h-8 w-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors shrink-0 mt-0.5"
                  (click)="closeBoardModal()"
                  title="Close"
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

              <!-- Modal Body -->
              <div class="flex-1 overflow-auto px-6 py-5 space-y-5">
                <!-- Board Name -->
                <div>
                  <label
                    for="board-name"
                    class="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5"
                  >
                    Board Name
                    <span class="text-red-400">*</span>
                  </label>
                  <input
                    id="board-name"
                    type="text"
                    class="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 disabled:bg-gray-50 disabled:text-gray-400"
                    placeholder="e.g., Test Program - Cohort 1"
                    [value]="boardFormData().name"
                    (input)="updateBoardForm({ name: $event })"
                    [disabled]="savingBoard()"
                  />
                </div>

                <!-- Description -->
                <div>
                  <label
                    for="board-description"
                    class="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5"
                  >
                    Description
                    <span class="text-gray-300 normal-case tracking-normal font-normal text-[11px]">(optional)</span>
                  </label>
                  <textarea
                    id="board-description"
                    class="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 resize-y focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 disabled:bg-gray-50"
                    placeholder="What is this board for?"
                    [value]="boardFormData().description"
                    (input)="updateBoardForm({ description: $event })"
                    [disabled]="savingBoard()"
                    rows="3"
                  ></textarea>
                </div>

                <!-- Add Members (create only) -->
                @if (!editingBoard()) {
                  <div>
                    <label class="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">
                      Add Members
                      <span class="text-gray-300 normal-case tracking-normal font-normal text-[11px]">(optional)</span>
                    </label>
                    <div class="space-y-2">
                      <input
                        type="text"
                        class="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                        placeholder="Search users by name or email..."
                        [value]="memberSearch()"
                        (input)="searchMembers($event)"
                      />
                      @if (searchingUsers()) {
                        <div class="flex items-center gap-2 py-2 px-1 text-[13px] text-gray-400">
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
                          <span>Loading users...</span>
                        </div>
                      } @else if (filteredNewBoardUsers().length > 0) {
                        <div class="max-h-36 overflow-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
                          @for (user of filteredNewBoardUsers(); track user.id) {
                            <button
                              type="button"
                              class="w-full px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
                              (click)="addMemberToForm(user)"
                            >
                              <p class="text-[13px] font-semibold text-gray-800">
                                {{ user.firstName }} {{ user.lastName }}
                              </p>
                              <p class="text-[11px] text-gray-400">{{ user.email }}</p>
                            </button>
                          }
                        </div>
                      } @else if (allUsers().length > 0) {
                        <p class="text-[12px] text-gray-400 px-1">No users match your search.</p>
                      }
                      @if (selectedMembers().length > 0) {
                        <div class="pt-1 space-y-1.5">
                          <p class="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Selected</p>
                          <div class="flex flex-wrap gap-1.5">
                            @for (member of selectedMembers(); track member.id) {
                              <div
                                class="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-100 pl-2.5 pr-1.5 py-1 text-[12px] font-semibold text-blue-700"
                              >
                                <span>{{ member.firstName }} {{ member.lastName }}</span>
                                <button
                                  type="button"
                                  class="flex h-4 w-4 items-center justify-center rounded text-blue-400 hover:bg-blue-200 hover:text-blue-700 transition-colors"
                                  (click)="removeMemberFromForm(member.id)"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="10"
                                    height="10"
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
                    </div>
                  </div>
                }
              </div>

              <!-- Modal Footer -->
              <div class="px-6 py-4 border-t border-gray-100 space-y-2">
                <div class="flex gap-3">
                  <button
                    type="button"
                    class="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
                    (click)="closeBoardModal()"
                    [disabled]="savingBoard()"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    class="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                    (click)="saveBoard()"
                    [disabled]="savingBoard() || !boardFormData().name.trim()"
                  >
                    {{ savingBoard() ? 'Saving...' : editingBoard() ? 'Update Board' : 'Create Board' }}
                  </button>
                </div>
                @if (editingBoard()) {
                  <button
                    type="button"
                    class="w-full rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
                    (click)="deleteBoard()"
                    [disabled]="savingBoard()"
                  >
                    {{ savingBoard() ? 'Deleting...' : 'Delete Board' }}
                  </button>
                }
              </div>
            </div>
          </div>
        }

        <!-- Board Management Modal -->
        @if (showSettingsModal()) {
          <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
            <div
              class="modal-sheet relative w-full sm:max-w-lg max-h-[75dvh] sm:max-h-[85vh] rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden"
            >
              <!-- Drag handle - mobile only -->
              <div class="w-10 h-1 rounded-full bg-gray-300 mx-auto mt-3 mb-1 sm:hidden" aria-hidden="true"></div>
              <!-- Header -->
              <div class="flex items-start justify-between px-6 pt-6 pb-4">
                <div>
                  <p class="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">Board Settings</p>
                  <h2 class="text-lg font-bold text-gray-900 leading-tight">{{ settingsBoard()?.name }}</h2>
                </div>
                <button
                  type="button"
                  class="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                  (click)="closeSettingsModal()"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
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

              <!-- Tab Bar (pill style) -->
              <div class="flex gap-1 px-6 pb-3">
                <button
                  type="button"
                  class="px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors"
                  [class.bg-gray-900]="managementTab() === 'general'"
                  [class.text-white]="managementTab() === 'general'"
                  [class.text-gray-500]="managementTab() !== 'general'"
                  [class.hover:bg-gray-100]="managementTab() !== 'general'"
                  (click)="managementTab.set('general')"
                >
                  General
                </button>
                <button
                  type="button"
                  class="px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors"
                  [class.bg-gray-900]="managementTab() === 'members'"
                  [class.text-white]="managementTab() === 'members'"
                  [class.text-gray-500]="managementTab() !== 'members'"
                  [class.hover:bg-gray-100]="managementTab() !== 'members'"
                  (click)="managementTab.set('members')"
                >
                  Members
                </button>
                <button
                  type="button"
                  class="px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors"
                  [class.bg-gray-900]="managementTab() === 'tags'"
                  [class.text-white]="managementTab() === 'tags'"
                  [class.text-gray-500]="managementTab() !== 'tags'"
                  [class.hover:bg-gray-100]="managementTab() !== 'tags'"
                  (click)="managementTab.set('tags')"
                >
                  Categories
                </button>
                <button
                  type="button"
                  class="px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors"
                  [class.bg-gray-900]="managementTab() === 'settings'"
                  [class.text-white]="managementTab() === 'settings'"
                  [class.text-gray-500]="managementTab() !== 'settings'"
                  [class.hover:bg-gray-100]="managementTab() !== 'settings'"
                  (click)="managementTab.set('settings')"
                >
                  Settings
                </button>
              </div>
              <div class="h-px bg-gray-100 mx-6"></div>

              <!-- Content -->
              <div class="flex-1 overflow-auto px-6 py-5 space-y-5">
                <!-- General Tab -->
                @if (managementTab() === 'general') {
                  <div class="space-y-4">
                    <div>
                      <label
                        for="board-name-input"
                        class="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5"
                      >
                        Board Name
                      </label>
                      <input
                        id="board-name-input"
                        type="text"
                        class="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
                        [value]="editingBoardName()"
                        (input)="setBoardName($event)"
                        [disabled]="savingBoardName()"
                      />
                    </div>
                    <div>
                      <label
                        for="board-description-input"
                        class="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5"
                      >
                        Description
                        <span class="normal-case font-normal text-gray-400">(optional)</span>
                      </label>
                      <textarea
                        id="board-description-input"
                        class="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition resize-none"
                        rows="3"
                        placeholder="What is this board for?"
                        [value]="editingBoardDescription()"
                        (input)="setBoardDescription($event)"
                        [disabled]="savingBoardName()"
                      ></textarea>
                    </div>
                    <div class="flex gap-6 rounded-xl bg-gray-50 px-4 py-3">
                      <div>
                        <p class="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Members</p>
                        <p class="mt-0.5 text-2xl font-bold text-gray-900">{{ settingsBoard()?.memberCount ?? 0 }}</p>
                      </div>
                      <div class="w-px bg-gray-200"></div>
                      <div>
                        <p class="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Posts</p>
                        <p class="mt-0.5 text-2xl font-bold text-gray-900">{{ settingsBoard()?.postCount ?? 0 }}</p>
                      </div>
                    </div>
                  </div>
                }

                <!-- Members Tab -->
                @if (managementTab() === 'members') {
                  <div class="space-y-5">
                    <div>
                      <div class="flex items-center justify-between mb-3">
                        <p class="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Current Members</p>
                      </div>
                      <div class="space-y-1 max-h-48 overflow-auto">
                        @if (boardMembers().length === 0) {
                          <p class="text-sm text-gray-400 py-2">No members yet.</p>
                        } @else {
                          @for (member of sortedBoardMembers(); track member.id) {
                            <div
                              class="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors"
                              [class]="
                                member.id === settingsBoard()?.createdBy?.id
                                  ? 'bg-violet-50 hover:bg-violet-100/60'
                                  : member.isAdmin
                                    ? 'bg-amber-50 hover:bg-amber-100/60'
                                    : 'hover:bg-gray-50'
                              "
                            >
                              <div class="flex items-center gap-3 min-w-0">
                                <div
                                  class="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-white flex-shrink-0 transition-colors"
                                  [class]="
                                    member.id === settingsBoard()?.createdBy?.id
                                      ? 'bg-violet-500'
                                      : member.isAdmin
                                        ? 'bg-amber-500'
                                        : 'bg-blue-500'
                                  "
                                >
                                  {{ member.firstName.charAt(0) }}{{ member.lastName.charAt(0) }}
                                </div>
                                <div class="min-w-0">
                                  <div class="flex items-center gap-1.5">
                                    <p class="text-sm font-semibold text-gray-900 truncate">
                                      {{ member.firstName }} {{ member.lastName }}
                                    </p>
                                    @if (member.id === settingsBoard()?.createdBy?.id) {
                                      <span
                                        class="inline-flex items-center rounded border border-violet-200 bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-violet-600 flex-shrink-0"
                                      >
                                        Creator
                                      </span>
                                    } @else if (member.isAdmin) {
                                      <span
                                        class="inline-flex items-center rounded border border-amber-200 bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-600 flex-shrink-0"
                                      >
                                        Staff
                                      </span>
                                    }
                                  </div>
                                  <p class="text-[11px] text-gray-400 truncate">{{ member.email }}</p>
                                </div>
                              </div>
                              <div class="flex items-center gap-1 flex-shrink-0 ml-2">
                                @if (isAdmin() && member.id !== settingsBoard()?.createdBy?.id) {
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
                                @if (canRemoveMember()) {
                                  <button
                                    type="button"
                                    class="h-7 w-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
                                    (click)="removeBoardMember(member.id)"
                                    [disabled]="removingMemberId() === member.id"
                                  >
                                    @if (removingMemberId() === member.id) {
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
                                        stroke-width="2.5"
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

                    <div class="border-t border-gray-100 pt-5">
                      <p class="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Add Members</p>
                      <input
                        type="text"
                        class="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition mb-2"
                        placeholder="Search users..."
                        [value]="addMemberSearch()"
                        (input)="searchUsersToAdd($event)"
                        [disabled]="searchingUsers() || savingBoard()"
                      />
                      @if (searchingUsers()) {
                        <p class="text-center text-sm text-gray-400 py-2">Loading users...</p>
                      } @else if (filteredAvailableUsers().length > 0) {
                        <div class="max-h-40 overflow-auto rounded-xl border border-gray-100 divide-y divide-gray-50">
                          @for (user of filteredAvailableUsers(); track user.id) {
                            <button
                              type="button"
                              class="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
                              (click)="stageMemberToAdd(user)"
                              [disabled]="savingBoard()"
                            >
                              <div
                                class="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-600 flex-shrink-0"
                              >
                                {{ user.firstName.charAt(0) }}{{ user.lastName.charAt(0) }}
                              </div>
                              <div class="text-left">
                                <p class="text-sm font-medium text-gray-900">
                                  {{ user.firstName }} {{ user.lastName }}
                                </p>
                                <p class="text-[11px] text-gray-400">{{ user.email }}</p>
                              </div>
                            </button>
                          }
                        </div>
                      } @else if (allUsers().length > 0) {
                        <p class="text-center text-sm text-gray-400 py-2">No users found.</p>
                      }
                    </div>

                    @if (pendingMembersToAdd().length > 0) {
                      <div class="border-t border-gray-100 pt-4">
                        <p class="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
                          Pending to Add
                        </p>
                        <div class="flex flex-wrap gap-2">
                          @for (member of pendingMembersToAdd(); track member.id) {
                            <div
                              class="inline-flex items-center gap-2 rounded-md bg-blue-50 border border-blue-100 pl-2.5 pr-2 py-1 text-xs font-medium text-blue-800"
                            >
                              <span>{{ member.firstName }} {{ member.lastName }}</span>
                              <button
                                type="button"
                                class="text-blue-400 hover:text-blue-700 disabled:opacity-60"
                                (click)="unstageMember(member.id)"
                                [disabled]="savingBoard()"
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
                  </div>
                }

                <!-- Categories Tab -->
                @if (managementTab() === 'tags') {
                  <div class="space-y-5">
                    <div>
                      <p class="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
                        Current Categories
                      </p>
                      @if (boardTags().length === 0) {
                        <p class="text-sm text-gray-400 py-2">No categories yet.</p>
                      } @else {
                        <div class="max-h-44 overflow-auto space-y-1.5">
                          @for (tag of boardTags(); track tag.id) {
                            <div class="flex items-center justify-between rounded-lg px-3 py-2.5 bg-gray-50">
                              <span
                                class="inline-block rounded-lg px-3 py-1 text-xs font-semibold"
                                [ngClass]="getTagColorClass(tag)"
                              >
                                {{ tag.name }}
                              </span>
                              <button
                                type="button"
                                class="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-60"
                                (click)="deleteBoardTag(tag.id)"
                                [disabled]="deletingTagId() === tag.id"
                              >
                                @if (deletingTagId() === tag.id) {
                                  <span class="text-xs">...</span>
                                } @else {
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

                    <div class="border-t border-gray-100 pt-5">
                      <p class="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Add Category</p>
                      <div class="space-y-3">
                        <div>
                          <label for="tag-name" class="block text-xs font-medium text-gray-600 mb-1.5">Name</label>
                          <input
                            id="tag-name"
                            type="text"
                            class="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
                            placeholder="e.g., Announcements"
                            [value]="newTagName()"
                            (input)="setNewTagName($event)"
                            [disabled]="creatingTag()"
                          />
                        </div>
                        <div>
                          <label for="tag-color" class="block text-xs font-medium text-gray-600 mb-1.5">Color</label>
                          <select
                            id="tag-color"
                            class="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm bg-white text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
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
                          class="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          (click)="createBoardTag()"
                          [disabled]="creatingTag() || !newTagName().trim()"
                        >
                          {{ creatingTag() ? 'Adding...' : 'Add Category' }}
                        </button>
                      </div>
                    </div>
                  </div>
                }

                <!-- Settings Tab -->
                @if (managementTab() === 'settings') {
                  <div class="space-y-4">
                    <p class="text-sm text-gray-500">Manage board settings and danger zone options.</p>
                    @if (canManageBoard(settingsBoard()!)) {
                      <div class="rounded-xl border border-red-100 bg-red-50/60 px-5 py-4">
                        <p class="text-sm font-bold text-red-700 mb-1">Delete Board</p>
                        <p class="text-xs text-red-400 mb-4">This action is permanent and cannot be undone.</p>
                        <button
                          type="button"
                          class="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60 transition-colors"
                          (click)="deleteSettingsBoard()"
                          [disabled]="deletingBoardId() === settingsBoard()?.id"
                        >
                          {{ deletingBoardId() === settingsBoard()?.id ? 'Deleting...' : 'Delete this Board' }}
                        </button>
                      </div>
                    }
                  </div>
                }
              </div>

              <!-- Footer -->
              <div class="border-t border-gray-100 px-6 py-4">
                @if (managementTab() === 'general') {
                  <button
                    type="button"
                    class="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    (click)="saveBoardName()"
                    [disabled]="
                      savingBoardName() ||
                      (editingBoardName().trim() === settingsBoard()?.name &&
                        editingBoardDescription() === settingsBoard()?.description)
                    "
                  >
                    {{ savingBoardName() ? 'Saving...' : 'Save Changes' }}
                  </button>
                } @else if (managementTab() === 'members' && pendingMembersToAdd().length > 0) {
                  <button
                    type="button"
                    class="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    (click)="savePendingMembers()"
                    [disabled]="savingBoard()"
                  >
                    {{
                      savingBoard()
                        ? 'Adding...'
                        : 'Add ' +
                          pendingMembersToAdd().length +
                          (pendingMembersToAdd().length > 1 ? ' Members' : ' Member')
                    }}
                  </button>
                } @else {
                  <button
                    type="button"
                    class="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    (click)="closeSettingsModal()"
                    [disabled]="savingBoard() || !!deletingBoardId() || savingBoardName()"
                  >
                    Close
                  </button>
                }
              </div>
            </div>
          </div>
        }
      </section>

      @if (pendingDeleteCallback()) {
        <div
          class="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
          (click)="pendingDeleteCallback.set(null); pendingDeleteBoardName.set(null)"
        >
          <div
            class="modal-sheet relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl flex flex-col"
            (click)="$event.stopPropagation()"
          >
            <!-- Drag handle - mobile only -->
            <div class="w-10 h-1 rounded-full bg-gray-300 mx-auto mt-3 mb-1 sm:hidden" aria-hidden="true"></div>
            <!-- Header -->
            <div class="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100">
              <div>
                <p class="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">Danger Zone</p>
                <h2 class="text-lg font-bold text-gray-900 leading-tight">Delete Board</h2>
              </div>
              <button
                type="button"
                class="h-8 w-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors ml-4 mt-0.5 shrink-0"
                (click)="pendingDeleteCallback.set(null); pendingDeleteBoardName.set(null)"
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
            <!-- Content -->
            <div class="px-6 py-5 space-y-3">
              <p class="text-sm text-gray-600 leading-relaxed">
                Are you sure you want to delete
                <span class="font-semibold text-gray-900">{{ pendingDeleteBoardName() }}</span>
                ?
              </p>
              <div class="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                <p class="text-sm text-red-700">
                  This will permanently delete the board, all its posts, comments, and members. This action cannot be
                  undone.
                </p>
              </div>
            </div>
            <!-- Footer -->
            <div class="px-6 pb-6 pt-2 flex justify-end gap-3">
              <button
                type="button"
                class="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
                (click)="pendingDeleteCallback.set(null); pendingDeleteBoardName.set(null)"
              >
                Cancel
              </button>
              <button
                type="button"
                class="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                (click)="pendingDeleteCallback()!(); pendingDeleteCallback.set(null); pendingDeleteBoardName.set(null)"
              >
                Delete Board
              </button>
            </div>
          </div>
        </div>
      }

      <mas-footer />
    </div>
  `,
})
export class DiscussionBoardsDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private authStore = inject(AuthStore);

  boards = signal<BoardInfo[]>([]);
  loading = signal(false);
  errorMessage = signal<string | null>(null);
  savingBoard = signal(false);
  searchingUsers = signal(false);
  showBoardModal = signal(false);
  showSettingsModal = signal(false);
  pendingDeleteBoardName = signal<string | null>(null);
  pendingDeleteCallback = signal<(() => void) | null>(null);
  editingBoard = signal<BoardInfo | null>(null);
  settingsBoard = signal<BoardInfo | null>(null);
  boardMembers = signal<BoardMember[]>([]);
  removingMemberId = signal<string | null>(null);
  togglingAdminId = signal<string | null>(null);
  addingMemberId = signal<string | null>(null);
  deletingBoardId = signal<string | null>(null);

  sortedBoardMembers = computed(() => {
    const creatorId = this.settingsBoard()?.createdBy?.id;
    const fullName = (m: BoardMember) => `${m.firstName} ${m.lastName}`.toLowerCase();
    const members = [...this.boardMembers()];
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

  boardFormData = signal({ name: '', description: '' });
  memberSearch = signal('');
  addMemberSearch = signal('');
  searchResults = signal<User[]>([]);
  selectedMembers = signal<User[]>([]);
  allUsers = signal<User[]>([]);
  boardTags = signal<DiscussionTag[]>([]);
  newTagName = signal('');
  newTagColor = signal<'blue' | 'green' | 'red' | 'orange' | 'purple' | 'yellow'>('blue');
  creatingTag = signal(false);
  deletingTagId = signal<string | null>(null);
  managementTab = signal<'general' | 'members' | 'tags' | 'settings'>('general');
  editingBoardName = signal('');
  editingBoardDescription = signal('');
  savingBoardName = signal(false);
  pendingMembersToAdd = signal<User[]>([]);

  isAdmin = computed(() => this.authStore.isStaff());
  currentUser = computed(() => this.authStore.user());

  // Reload boards when user context changes (e.g., when mimic mode is stopped)
  userChangeEffect = effect(() => {
    this.currentUser();
    this.loadBoards();
  });

  filteredAvailableUsers = computed(() => {
    const query = this.addMemberSearch().trim().toLowerCase();
    const existingIds = new Set([
      ...this.boardMembers().map((m) => m.id),
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

  filteredNewBoardUsers = computed(() => {
    const query = this.memberSearch().trim().toLowerCase();
    const selectedIds = new Set(this.selectedMembers().map((m) => m.id));
    return this.allUsers()
      .filter((u) => !selectedIds.has(u.id))
      .filter(
        (u) =>
          !query ||
          `${u.firstName} ${u.lastName}`.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query),
      );
  });

  ngOnInit(): void {
    this.loadBoards();
  }

  private loadBoards(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.http.get<BoardInfo[]>('/api/discussion-boards').subscribe({
      next: (boards) => {
        this.boards.set(boards);
      },
      error: (error) => {
        this.errorMessage.set(this.getApiErrorMessage(error, 'Unable to load discussion boards.'));
      },
      complete: () => {
        this.loading.set(false);
      },
    });
  }

  private loadAllUsers(): void {
    this.searchingUsers.set(true);

    this.http.get<User[]>('/api/users/names').subscribe({
      next: (users) => {
        this.allUsers.set(users);
      },
      error: () => {
        this.allUsers.set([]);
      },
      complete: () => {
        this.searchingUsers.set(false);
      },
    });
  }

  canManageBoard(board: BoardInfo): boolean {
    const user = this.currentUser();
    return this.isAdmin() || user?.id === board.createdBy.id;
  }

  getBoardColor(boardId: string): string {
    // Full class strings must be present as literals for Tailwind JIT scanning
    const colors = [
      'border-l-orange-500',
      'border-l-sky-500',
      'border-l-emerald-500',
      'border-l-violet-500',
      'border-l-rose-500',
    ];
    let hash = 0;
    for (let i = 0; i < boardId.length; i++) {
      hash = (hash + boardId.charCodeAt(i)) % colors.length;
    }
    return colors[hash];
  }

  openCreateBoardModal(): void {
    this.editingBoard.set(null);
    this.boardFormData.set({ name: '', description: '' });
    this.selectedMembers.set([]);
    this.memberSearch.set('');
    this.searchResults.set([]);
    this.loadAllUsers();
    this.showBoardModal.set(true);
    document.body.style.overflow = 'hidden';
  }

  openBoardSettings(board: BoardInfo): void {
    this.settingsBoard.set(board);
    this.addMemberSearch.set('');
    this.newTagName.set('');
    this.newTagColor.set('blue');
    this.editingBoardName.set(board.name);
    this.editingBoardDescription.set(board.description || '');
    this.managementTab.set('general');
    this.pendingMembersToAdd.set([]);
    this.loadBoardMembers(board.id);
    this.loadBoardTags(board.id);
    this.loadAllUsers();
    this.showSettingsModal.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeBoardModal(): void {
    this.showBoardModal.set(false);
    this.editingBoard.set(null);
    this.boardFormData.set({ name: '', description: '' });
    this.selectedMembers.set([]);
    this.memberSearch.set('');
    this.searchResults.set([]);
    document.body.style.overflow = '';
  }

  closeSettingsModal(): void {
    this.showSettingsModal.set(false);
    this.settingsBoard.set(null);
    this.boardMembers.set([]);
    this.addMemberSearch.set('');
    this.boardTags.set([]);
    this.newTagName.set('');
    this.newTagColor.set('blue');
    this.pendingMembersToAdd.set([]);
    document.body.style.overflow = '';
  }

  updateBoardForm(data: { name?: Event; description?: Event }): void {
    const current = this.boardFormData();

    if (data.name !== undefined) {
      const evt = data.name as Event;
      current.name = (evt.target as HTMLInputElement)?.value ?? '';
    }

    if (data.description !== undefined) {
      const evt = data.description as Event;
      current.description = (evt.target as HTMLTextAreaElement)?.value ?? '';
    }

    this.boardFormData.set({ ...current });
  }

  searchMembers(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.memberSearch.set(query);
  }

  addMemberToForm(user: User): void {
    this.selectedMembers.set([...this.selectedMembers(), user]);
    this.searchResults.set(this.searchResults().filter((u) => u.id !== user.id));
    this.memberSearch.set('');
  }

  removeMemberFromForm(userId: string): void {
    this.selectedMembers.set(this.selectedMembers().filter((m) => m.id !== userId));
  }

  saveBoard(): void {
    const formData = this.boardFormData();

    if (!formData.name.trim()) {
      this.errorMessage.set('Board name is required');
      return;
    }

    this.savingBoard.set(true);
    this.errorMessage.set(null);

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      memberIds: this.selectedMembers().map((m) => m.id),
    };

    const editBoard = this.editingBoard();
    const request = editBoard
      ? this.http.patch(`/api/discussion-boards/${editBoard.id}`, {
          name: payload.name,
          description: payload.description,
        })
      : this.http.post<{ id: string }>('/api/discussion-boards', payload);

    request.subscribe({
      next: (result) => {
        if (!editBoard && result && 'id' in result) {
          // Automatically add a default "General" category to new boards
          this.http.post(`/api/discussion-boards/${result.id}/tags`, { name: 'General', color: 'blue' }).subscribe({
            next: () => {
              this.closeBoardModal();
              this.loadBoards();
            },
            error: () => {
              // Tag creation failed non-critically; still close and refresh
              this.closeBoardModal();
              this.loadBoards();
            },
          });
        } else {
          this.closeBoardModal();
          this.loadBoards();
        }
      },
      error: (error) => {
        this.errorMessage.set(this.getApiErrorMessage(error, 'Unable to save board.'));
        this.savingBoard.set(false);
      },
      complete: () => {
        this.savingBoard.set(false);
      },
    });
  }

  deleteBoard(): void {
    const editBoard = this.editingBoard();
    if (!editBoard) return;

    this.pendingDeleteBoardName.set(editBoard.name);
    this.pendingDeleteCallback.set(() => {
      this.savingBoard.set(true);
      this.http.delete(`/api/discussion-boards/${editBoard.id}`).subscribe({
        next: () => {
          this.closeBoardModal();
          this.loadBoards();
        },
        error: (error) => {
          this.errorMessage.set(this.getApiErrorMessage(error, 'Unable to delete board.'));
          this.savingBoard.set(false);
        },
        complete: () => {
          this.savingBoard.set(false);
        },
      });
    });
  }

  private loadBoardMembers(boardId: string): void {
    this.http.get<BoardMember[]>(`/api/discussion-boards/${boardId}/members`).subscribe({
      next: (members) => {
        this.boardMembers.set(members);
      },
      error: () => {
        this.boardMembers.set([]);
      },
    });
  }

  searchUsersToAdd(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.addMemberSearch.set(query);
  }

  addBoardMember(userId: string): void {
    const board = this.settingsBoard();
    if (!board) return;

    this.addingMemberId.set(userId);

    this.http
      .post(`/api/discussion-boards/${board.id}/members`, {
        userId,
      })
      .subscribe({
        next: () => {
          this.loadBoardMembers(board.id);
          this.addMemberSearch.set('');
        },
        error: (error) => {
          this.errorMessage.set(this.getApiErrorMessage(error, 'Unable to add member.'));
        },
        complete: () => {
          this.addingMemberId.set(null);
        },
      });
  }

  removeBoardMember(userId: string): void {
    const board = this.settingsBoard();
    if (!board) return;

    this.removingMemberId.set(userId);

    this.http.delete(`/api/discussion-boards/${board.id}/members/${userId}`).subscribe({
      next: () => {
        this.loadBoardMembers(board.id);
        this.updateBoardMemberCount(board.id, -1);
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
    const board = this.settingsBoard();
    if (!board) return;

    this.togglingAdminId.set(userId);

    this.http.patch(`/api/discussion-boards/${board.id}/members/${userId}/admin`, { isAdmin: makeAdmin }).subscribe({
      next: () => {
        this.loadBoardMembers(board.id);
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
    const board = this.settingsBoard();
    const newName = this.editingBoardName().trim();
    if (!board || !newName) return;

    this.savingBoardName.set(true);
    const updateData: { name: string; description?: string } = { name: newName };
    if (this.editingBoardDescription() !== board.description) {
      updateData.description = this.editingBoardDescription();
    }

    this.http.patch<BoardInfo>(`/api/discussion-boards/${board.id}`, updateData).subscribe({
      next: (updatedBoard) => {
        this.settingsBoard.set(updatedBoard);
        this.boards.update((list) => list.map((b) => (b.id === board.id ? updatedBoard : b)));
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

  stageMemberToAdd(user: User): void {
    this.pendingMembersToAdd.update((members) => [...members, user]);
    this.addMemberSearch.set('');
  }

  unstageMember(userId: string): void {
    this.pendingMembersToAdd.update((members) => members.filter((m) => m.id !== userId));
  }

  savePendingMembers(): void {
    const board = this.settingsBoard();
    if (!board || this.pendingMembersToAdd().length === 0) return;

    this.savingBoard.set(true);
    const pending = this.pendingMembersToAdd();
    const addRequests = pending.map((user) =>
      lastValueFrom(this.http.post(`/api/discussion-boards/${board.id}/members`, { userId: user.id })),
    );

    Promise.all(addRequests)
      .then(
        () => {
          this.loadBoardMembers(board.id);
          this.updateBoardMemberCount(board.id, pending.length);
          this.pendingMembersToAdd.set([]);
        },
        () => {
          this.errorMessage.set(this.getApiErrorMessage(null, 'Unable to add members.'));
        },
      )
      .finally(() => {
        this.savingBoard.set(false);
      });
  }

  private updateBoardMemberCount(boardId: string, delta: number): void {
    this.boards.update((list) =>
      list.map((b) => (b.id === boardId ? { ...b, memberCount: b.memberCount + delta } : b)),
    );
  }

  canRemoveMember(): boolean {
    const user = this.currentUser();
    const board = this.settingsBoard();
    const isBoardAdmin = this.boardMembers().some((m) => m.id === user?.id && m.isAdmin);
    return this.isAdmin() || isBoardAdmin || (!!board && user?.id === board.createdBy.id);
  }

  deleteSettingsBoard(): void {
    const board = this.settingsBoard();
    if (!board) return;

    this.pendingDeleteBoardName.set(board.name);
    this.pendingDeleteCallback.set(() => {
      this.deletingBoardId.set(board.id);
      this.http.delete(`/api/discussion-boards/${board.id}`).subscribe({
        next: () => {
          this.closeSettingsModal();
          this.loadBoards();
          this.deletingBoardId.set(null);
        },
        error: (error) => {
          this.errorMessage.set(this.getApiErrorMessage(error, 'Unable to delete board.'));
          this.deletingBoardId.set(null);
        },
      });
    });
  }

  private loadBoardTags(boardId: string): void {
    this.http.get<DiscussionTag[]>(`/api/discussion-boards/${boardId}/tags`).subscribe({
      next: (tags) => {
        this.boardTags.set(tags);
      },
      error: () => {
        this.boardTags.set([]);
      },
    });
  }

  setNewTagName(event: Event): void {
    const value = (event.target as HTMLInputElement | null)?.value ?? '';
    this.newTagName.set(value);
  }

  setTagColor(event: Event): void {
    const value = (event.target as HTMLSelectElement | null)?.value ?? 'blue';
    this.newTagColor.set(value as 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'yellow');
  }

  createBoardTag(): void {
    const name = this.newTagName().trim();
    const board = this.settingsBoard();
    if (!name || !board) return;

    this.creatingTag.set(true);

    this.http
      .post(`/api/discussion-boards/${board.id}/tags`, {
        name,
        color: this.newTagColor(),
      })
      .subscribe({
        next: () => {
          this.newTagName.set('');
          this.newTagColor.set('blue');
          this.loadBoardTags(board.id);
        },
        error: (error) => {
          this.errorMessage.set(this.getApiErrorMessage(error, 'Unable to create tag.'));
        },
        complete: () => {
          this.creatingTag.set(false);
        },
      });
  }

  deleteBoardTag(tagId: string): void {
    const board = this.settingsBoard();
    if (!board) return;
    this.deletingTagId.set(tagId);

    this.http.delete(`/api/discussion-boards/${board.id}/tags/${tagId}`).subscribe({
      next: () => {
        this.loadBoardTags(board.id);
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
