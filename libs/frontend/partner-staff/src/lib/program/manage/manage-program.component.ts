import { ChangeDetectionStrategy, Component, effect, inject, Injector, input, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import {
  ConfirmDialogComponent,
  DateInputComponent,
  LoaderComponent,
  RichTextEditorComponent,
  SpinnerComponent,
} from '@mas/frontend-shared-components';
import { htmlToText } from '@mas/frontend-shared-util';
import {
  AlliesOnProgramsStore,
  ProgramsStore,
  TaskReviewStore,
  UsersOnProgramsStore,
} from '@mas/frontend-shared-data-access';
import { UsersOnProgramsWithName } from '@mas/models';
import { openMonthlyPlan } from '../monthly-progress/monthly-plan-dialog.component';
import { toDateInput } from '../monthly-progress/monthly-plan-editor.store';
import { RequirementsStore } from '../requirements/requirements.store';
import { AddUsersOnProgramsComponent } from '../users-on-programs/ui/add-users-on-programs/add-users-on-programs.component';
import { ManageProgramStore } from './manage-program.store';
import { ProgramDocumentsStore } from './program-documents.store';
import { RemovePersonDialogComponent } from './remove-person-dialog.component';

const datesInOrder = ({ value }: { value: { startDate?: string | null; endDate?: string | null } }) =>
  value.startDate && value.endDate && value.endDate < value.startDate ? { dateOrder: true } : null;

@Component({
  selector: 'mas-manage-program',
  imports: [
    DateInputComponent,
    RichTextEditorComponent,
    SpinnerComponent,
    LoaderComponent,
    MatIcon,
    ReactiveFormsModule,
    RouterLink,
  ],
  providers: [ManageProgramStore, ProgramDocumentsStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-5">
      <header class="flex flex-wrap items-end justify-between gap-3">
        <h2 class="text-2xl font-semibold tracking-tight">Manage program</h2>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            (click)="participants.downloadExcel()"
            class="min-h-11 rounded-xl border border-outline bg-surface px-4 text-sm font-bold text-brand-strong hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand"
          >
            Export records
          </button>
          <button
            type="button"
            (click)="store.toggleAdding()"
            [attr.aria-expanded]="store.adding()"
            aria-controls="add-person-panel"
            class="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-brand-strong px-4 text-sm font-bold text-brand-on hover:bg-brand focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-canvas"
          >
            <mat-icon aria-hidden="true" class="!h-5 !w-5 !text-xl !leading-none">add</mat-icon>
            {{ store.addView().button }}
          </button>
        </div>
      </header>

      <div class="grid items-start gap-4 lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
        <section aria-label="People" class="min-w-0 rounded-2xl border border-outline bg-surface-raised">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-outline p-4">
            <div role="group" aria-label="Show" class="flex gap-2">
              @for (tab of store.tabs(); track tab.value) {
                @let active = store.tab() === tab.value;
                <button
                  type="button"
                  (click)="store.setTab(tab.value)"
                  [attr.aria-pressed]="active"
                  class="inline-flex min-h-10 items-center gap-2 rounded-xl border px-3.5 text-sm font-bold hover:bg-brand-soft/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  [class.border-brand]="active"
                  [class.bg-brand-soft]="active"
                  [class.text-brand-strong]="active"
                  [class.border-outline]="!active"
                >
                  {{ tab.label }}
                  <span
                    aria-hidden="true"
                    class="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-outline bg-surface px-1.5 text-xs tabular-nums text-ink-muted"
                  >
                    {{ tab.count }}
                  </span>
                </button>
              }
            </div>
            <label class="relative block w-full sm:w-64">
              <span class="sr-only">Find someone</span>
              <mat-icon
                aria-hidden="true"
                class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 !text-xl text-ink-subtle"
              >
                search
              </mat-icon>
              <input
                #search
                type="search"
                [value]="store.query()"
                (input)="store.setQuery(search.value)"
                placeholder="Search by name or email"
                class="min-h-10 w-full rounded-xl border border-outline bg-surface py-2 pl-10 pr-3 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </label>
          </div>

          @if (store.adding()) {
            <div
              id="add-person-panel"
              role="region"
              aria-labelledby="add-person-heading"
              class="space-y-3 border-b border-outline bg-brand-soft/30 p-4 sm:px-5"
            >
              <div class="flex items-center justify-between gap-3">
                <h3 id="add-person-heading" class="text-base font-bold">{{ store.addView().heading }}</h3>
                <button
                  type="button"
                  (click)="store.closeAdding()"
                  aria-label="Close"
                  class="flex h-9 w-9 items-center justify-center rounded-lg border border-outline bg-surface text-ink-muted hover:bg-surface-subtle focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  <mat-icon aria-hidden="true">close</mat-icon>
                </button>
              </div>
              <p class="text-sm text-ink-muted">{{ store.addView().hint }}</p>
              <input
                #addSearch
                type="search"
                [value]="store.addQuery()"
                (input)="store.setAddQuery(addSearch.value)"
                placeholder="Search people by name or email"
                aria-label="Search people to add"
                class="min-h-11 w-full rounded-xl border border-outline bg-surface px-3 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-brand"
              />
              <ul class="space-y-1.5">
                @for (candidate of store.candidates(); track candidate.id) {
                  <li class="flex items-center gap-3 rounded-xl border border-outline bg-surface p-2 pl-3">
                    <span
                      aria-hidden="true"
                      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-subtle text-xs font-bold"
                    >
                      {{ candidate.initials }}
                    </span>
                    <span class="min-w-0 flex-1">
                      <span class="block truncate text-sm font-bold">{{ candidate.name }}</span>
                      <span class="block truncate text-xs text-ink-muted">{{ candidate.email }}</span>
                    </span>
                    <button
                      type="button"
                      (click)="store.add(candidate.id)"
                      [attr.aria-label]="'Add ' + candidate.name"
                      class="min-h-9 rounded-lg bg-brand-strong px-3 text-sm font-bold text-brand-on hover:bg-brand focus:outline-none focus:ring-2 focus:ring-brand"
                    >
                      Add
                    </button>
                  </li>
                } @empty {
                  <li class="rounded-xl bg-surface p-3 text-center text-sm text-ink-muted">
                    No one else matches. Invite them from Admin › People first.
                  </li>
                }
              </ul>
            </div>
          }

          <div
            aria-hidden="true"
            class="hidden grid-cols-[minmax(0,2.2fr)_1fr_1.4fr_5.5rem] gap-3 border-b border-outline px-5 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-ink-subtle sm:grid"
          >
            <span>Name</span>
            <span>Saved</span>
            <span>Tasks done</span>
            <span></span>
          </div>
          @if (store.isLoadingPeople() && !store.rows().length) {
            <mas-loader label="Loading people" />
          } @else if (store.peopleLoadFailed()) {
            <p role="alert" class="p-6 text-sm text-danger">We could not load this list. Refresh to try again.</p>
          }
          <ul aria-label="People in this program">
            @for (person of store.rows(); track person.userId) {
              <li
                class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-outline px-5 py-2.5 last:border-b-0 sm:grid-cols-[minmax(0,2.2fr)_1fr_1.4fr_5.5rem]"
              >
                <span class="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden="true"
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand-strong"
                  >
                    {{ person.initials }}
                  </span>
                  <span class="min-w-0">
                    <span class="block truncate text-sm font-bold">{{ person.name }}</span>
                    <span class="block truncate text-xs text-ink-muted">{{ person.email }}</span>
                  </span>
                </span>
                <span class="hidden text-sm font-bold tabular-nums sm:block">
                  <span class="sr-only">Saved</span>
                  {{ person.savedLabel }}
                </span>
                <span class="hidden items-center gap-2 sm:flex">
                  @if (person.isParticipant) {
                    <span aria-hidden="true" class="h-1.5 flex-1 rounded-full bg-surface-subtle">
                      <span class="block h-1.5 rounded-full bg-brand" [style.width.%]="person.tasksPercent"></span>
                    </span>
                  }
                  <span class="min-w-8 text-xs font-bold tabular-nums text-ink-muted">
                    <span class="sr-only">Tasks done</span>
                    {{ person.tasksLabel }}
                  </span>
                </span>
                <span class="flex justify-end gap-1">
                  @if (person.record; as record) {
                    <button
                      type="button"
                      (click)="openRecord(record)"
                      [attr.aria-label]="'Edit ' + person.name"
                      title="Edit"
                      class="flex h-9 w-9 items-center justify-center rounded-lg border border-outline bg-surface text-ink hover:bg-brand-soft hover:text-brand-strong focus:outline-none focus:ring-2 focus:ring-brand"
                    >
                      <mat-icon aria-hidden="true" class="!h-[1.125rem] !w-[1.125rem] !text-lg !leading-none">
                        edit_square
                      </mat-icon>
                    </button>
                  }
                  <button
                    type="button"
                    (click)="askToRemove(person.userId)"
                    [attr.aria-label]="'Remove ' + person.name + ' from program'"
                    title="Remove from program"
                    class="flex h-9 w-9 items-center justify-center rounded-lg border border-outline bg-surface text-danger hover:border-danger hover:bg-danger/10 focus:outline-none focus:ring-2 focus:ring-danger"
                  >
                    <mat-icon aria-hidden="true" class="!h-[1.125rem] !w-[1.125rem] !text-lg !leading-none">
                      close
                    </mat-icon>
                  </button>
                </span>
              </li>
            } @empty {
              @if (!store.isLoadingPeople() && !store.peopleLoadFailed()) {
                <li class="p-8 text-center text-sm text-ink-muted">
                  {{
                    store.query().trim()
                      ? 'Nobody matches “' + store.query().trim() + '”.'
                      : store.tab() === 'allies'
                        ? 'No allies yet.'
                        : 'No participants yet.'
                  }}
                </li>
              }
            }
          </ul>
        </section>

        <div class="flex min-w-0 flex-col gap-4">
          <section
            aria-labelledby="settings-heading"
            class="rounded-2xl border bg-surface-raised p-5"
            [class.border-brand]="store.editingSettings()"
            [class.border-outline]="!store.editingSettings()"
          >
            <div class="flex items-center justify-between">
              <h3 id="settings-heading" class="text-base font-bold">Program settings</h3>
              @if (!store.editingSettings()) {
                <button
                  type="button"
                  (click)="editSettings()"
                  class="min-h-9 rounded-lg border border-outline bg-surface px-3 text-sm font-bold text-brand-strong hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  Edit
                </button>
              }
            </div>
            @if (store.editingSettings()) {
              <form [formGroup]="settingsForm" (ngSubmit)="saveSettings()" class="mt-4 space-y-3">
                <label class="block text-xs font-bold text-ink-muted">
                  Program name
                  <input
                    formControlName="name"
                    class="mt-1.5 min-h-11 w-full rounded-xl border border-outline bg-surface px-3 text-sm font-normal text-ink focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </label>
                <div class="grid grid-cols-2 gap-2.5">
                  <div>
                    <label for="settings-start" class="block text-xs font-bold text-ink-muted">Start date</label>
                    <mas-date-input
                      class="mt-1.5"
                      inputId="settings-start"
                      formControlName="startDate"
                      [warn]="!settingsForm.value.startDate"
                    />
                  </div>
                  <div>
                    <label for="settings-end" class="block text-xs font-bold text-ink-muted">End date</label>
                    <mas-date-input
                      class="mt-1.5"
                      inputId="settings-end"
                      formControlName="endDate"
                      [min]="settingsForm.value.startDate ?? ''"
                    />
                  </div>
                </div>
                <p
                  class="text-xs"
                  [class.text-warn-ink]="settingsForm.hasError('dateOrder') || !settingsForm.value.startDate"
                  [class.text-ink-muted]="!settingsForm.hasError('dateOrder') && settingsForm.value.startDate"
                >
                  {{
                    settingsForm.hasError('dateOrder')
                      ? 'The end date must be after the start date.'
                      : settingsForm.value.startDate
                        ? 'Month 1 begins on the start date.'
                        : 'Add a start date so Tasks Review knows the current month.'
                  }}
                </p>
                <div>
                  <span id="settings-description-label" class="block text-xs font-bold text-ink-muted">
                    Description
                  </span>
                  <mas-rich-text-editor
                    class="mt-1.5 block"
                    formControlName="description"
                    minHeight="120px"
                    aria-labelledby="settings-description-label"
                  />
                </div>
                <div class="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    (click)="store.setEditingSettings(false)"
                    class="min-h-10 rounded-xl border border-outline bg-surface px-3.5 text-sm font-bold hover:bg-surface-subtle focus:outline-none focus:ring-2 focus:ring-brand"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    [disabled]="settingsForm.invalid || programs.programSaving()"
                    class="min-h-10 rounded-xl bg-brand-strong px-4 text-sm font-bold text-brand-on hover:bg-brand focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
                  >
                    <span class="relative inline-flex items-center justify-center">
                      <span [class.invisible]="programs.programSaving()">Save settings</span>
                      @if (programs.programSaving()) {
                        <mas-spinner class="absolute" />
                        <span class="sr-only">Save settings</span>
                      }
                    </span>
                  </button>
                </div>
              </form>
            } @else {
              <dl class="mt-3">
                @for (row of store.settingRows(); track row.label) {
                  <div
                    class="flex min-h-11 items-center justify-between gap-3"
                    [class.border-t]="!$first"
                    [class.border-outline]="!$first"
                  >
                    <dt class="text-sm text-ink-muted">{{ row.label }}</dt>
                    <dd class="flex items-center gap-2 text-sm font-bold" [class.text-ink-muted]="row.isMissing">
                      {{ row.value }}
                      @if (row.needsDate) {
                        <button
                          type="button"
                          (click)="editSettings()"
                          class="min-h-7 rounded-lg border border-warn-ink bg-warn-soft px-2.5 text-xs font-bold text-warn-ink focus:outline-none focus:ring-2 focus:ring-brand"
                        >
                          Add date
                        </button>
                      }
                    </dd>
                  </div>
                }
              </dl>
            }
          </section>

          <section aria-labelledby="plan-heading" class="rounded-2xl border border-outline bg-surface-raised p-5">
            <div class="flex items-center justify-between">
              <h3 id="plan-heading" class="text-base font-bold">Monthly plan</h3>
              <button
                type="button"
                (click)="openPlan(review.currentMonth())"
                [disabled]="!review.data()"
                class="min-h-9 rounded-lg border border-brand px-3 text-sm font-bold text-brand-strong hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
              >
                Edit plan
              </button>
            </div>
            @if (store.planMonths().length) {
              <ol class="mt-3.5 grid grid-cols-5 gap-1.5">
                @for (month of store.planMonths(); track month.number) {
                  <li>
                    <button
                      type="button"
                      (click)="openPlan(month.number)"
                      [attr.aria-label]="month.name + '. Edit this month'"
                      class="w-full rounded-lg border py-2 text-center text-sm font-bold hover:border-brand focus:outline-none focus:ring-2 focus:ring-brand"
                      [class.border-brand]="month.hasTasks"
                      [class.bg-brand-soft]="month.hasTasks"
                      [class.text-brand-strong]="month.hasTasks"
                      [class.border-outline]="!month.hasTasks"
                      [class.text-ink-subtle]="!month.hasTasks"
                    >
                      M{{ month.number }}
                    </button>
                  </li>
                }
              </ol>
              <p class="mt-2.5 text-xs text-ink-muted">Select a month to edit its tasks.</p>
            } @else if (review.data()) {
              <p class="mt-3 text-sm text-ink-muted">No months yet. Choose how long the program runs.</p>
            }
            <a
              routerLink="../tasks"
              class="mt-2 inline-flex min-h-9 items-center gap-1 rounded-lg text-xs font-bold text-brand-strong hover:underline focus:outline-none focus:ring-2 focus:ring-brand"
            >
              Task types, reminders and instructions
              <mat-icon aria-hidden="true" class="!h-4 !w-4 !text-base !leading-none">arrow_forward</mat-icon>
            </a>
          </section>

          <section aria-labelledby="requests-heading" class="rounded-2xl border border-outline bg-surface-raised p-5">
            <h3 id="requests-heading" class="text-base font-bold">Enrollment requests</h3>
            @if (programs.enrollmentsLoading()) {
              <p role="status" class="mt-3 text-sm text-ink-muted flex items-center gap-2">
                <mas-spinner class="text-brand" />
                <span class="sr-only">Loading requests</span>
              </p>
            } @else if (programs.enrollmentsLoadFailed()) {
              <p role="alert" class="mt-3 text-sm text-danger">We could not load requests.</p>
            } @else {
              <ul class="mt-3 space-y-1.5">
                @for (request of store.requests(); track request.id) {
                  <li class="flex flex-wrap items-center gap-2 rounded-xl bg-surface-subtle p-2 pl-3">
                    <span class="min-w-0 flex-1">
                      <span class="block truncate text-sm font-bold">{{ request.name }}</span>
                      <span class="block text-xs text-ink-muted">{{ request.appliedLabel }}</span>
                    </span>
                    <button
                      type="button"
                      (click)="decline(request.id, request.name)"
                      [attr.aria-label]="'Decline ' + request.name"
                      class="min-h-9 rounded-lg border border-outline bg-surface px-2.5 text-xs font-bold text-danger hover:bg-danger/10 focus:outline-none focus:ring-2 focus:ring-brand"
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      (click)="approve(request.id)"
                      [attr.aria-label]="'Approve ' + request.name"
                      class="min-h-9 rounded-lg bg-brand-strong px-2.5 text-xs font-bold text-brand-on hover:bg-brand focus:outline-none focus:ring-2 focus:ring-brand"
                    >
                      Approve
                    </button>
                  </li>
                } @empty {
                  <li class="flex items-center gap-2.5 rounded-xl bg-surface-subtle p-3 text-sm text-ink-muted">
                    <span
                      aria-hidden="true"
                      class="flex h-7 w-7 items-center justify-center rounded-full bg-brand-soft text-brand-strong"
                    >
                      <mat-icon class="!h-4 !w-4 !text-base !leading-none">check</mat-icon>
                    </span>
                    No applications waiting.
                  </li>
                }
              </ul>
            }
          </section>

          <section aria-labelledby="documents-heading" class="rounded-2xl border border-outline bg-surface-raised p-5">
            <div class="flex items-center justify-between">
              <h3 id="documents-heading" class="text-base font-bold">Documents</h3>
              <label
                class="inline-flex min-h-9 cursor-pointer items-center rounded-lg border border-outline bg-surface px-3 text-sm font-bold text-brand-strong hover:bg-brand-soft focus-within:ring-2 focus-within:ring-brand"
              >
                <span class="relative inline-flex items-center justify-center">
                  <span [class.invisible]="documents.uploading()">Upload</span>
                  @if (documents.uploading()) {
                    <mas-spinner class="absolute" />
                    <span class="sr-only">Upload</span>
                  }
                </span>
                <input
                  #files
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  class="sr-only"
                  [disabled]="documents.uploading()"
                  (change)="upload(files)"
                />
              </label>
            </div>
            @if (documents.error()) {
              <p role="alert" class="mt-2 text-xs text-danger">{{ documents.error() }}</p>
            }
            @if (documents.loading()) {
              <p role="status" class="mt-3 text-sm text-ink-muted flex items-center gap-2">
                <mas-spinner class="text-brand" />
                <span class="sr-only">Loading documents</span>
              </p>
            } @else if (documents.loadFailed()) {
              <p role="alert" class="mt-3 text-sm text-danger">We could not load documents.</p>
            } @else {
              <p class="mb-2 mt-3.5 flex items-center gap-2 text-xs font-bold text-ink-muted">
                Receipts without a month
                <span
                  class="rounded-md border px-1.5 text-[0.6875rem]"
                  [class.border-warn-ink]="documents.unsorted().length"
                  [class.bg-warn-soft]="documents.unsorted().length"
                  [class.text-warn-ink]="documents.unsorted().length"
                  [class.border-outline]="!documents.unsorted().length"
                >
                  {{ documents.unsorted().length }}
                </span>
              </p>
              <ul class="space-y-1.5">
                @for (receipt of documents.unsorted(); track receipt.id) {
                  <li class="flex items-center gap-2 rounded-xl bg-surface-subtle p-2 pl-2.5">
                    <span class="min-w-0 flex-1">
                      <span class="block truncate text-sm font-bold">{{ receipt.name }}</span>
                      <span class="block text-xs text-ink-muted">{{ receipt.who }}</span>
                    </span>
                    @if (receipt.isAssigning) {
                      <span role="status" class="text-brand">
                        <mas-spinner />
                        <span class="sr-only">Filing {{ receipt.name }}</span>
                      </span>
                    }
                    <select
                      #month
                      (change)="month.value && documents.assign({ imageId: receipt.id, month: +month.value })"
                      [disabled]="receipt.isAssigning || !documents.monthOptions().length"
                      [attr.aria-label]="'Assign ' + receipt.name + ' to a month'"
                      class="min-h-9 rounded-lg border border-outline bg-surface px-1.5 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
                    >
                      <option value="">Assign…</option>
                      @for (option of documents.monthOptions(); track option.number) {
                        <option [value]="option.number">{{ option.name }}</option>
                      }
                    </select>
                  </li>
                } @empty {
                  <li class="rounded-xl bg-surface-subtle px-2.5 py-2 text-xs text-ink-muted">
                    Every receipt has a month.
                  </li>
                }
              </ul>
              <p class="mb-1 mt-3.5 text-xs font-bold text-ink-muted">Program library</p>
              <ul>
                @for (file of documents.library(); track file.id) {
                  <li
                    class="flex items-center gap-2.5 py-2"
                    [class.border-t]="!$first"
                    [class.border-outline]="!$first"
                  >
                    <span
                      aria-hidden="true"
                      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-[0.5625rem] font-black text-brand-strong"
                    >
                      {{ file.kind }}
                    </span>
                    <span class="min-w-0 flex-1 truncate text-sm font-bold">{{ file.name }}</span>
                    <button
                      type="button"
                      (click)="download(file.id, file.name)"
                      [attr.aria-label]="'Download ' + file.name"
                      class="min-h-9 rounded-lg px-2 text-xs font-bold text-brand-strong hover:underline focus:outline-none focus:ring-2 focus:ring-brand"
                    >
                      Download
                    </button>
                  </li>
                } @empty {
                  <li class="py-2 text-xs text-ink-muted">
                    No shared files yet. Upload one for everyone in the program.
                  </li>
                }
              </ul>
            }
          </section>
        </div>
      </div>
    </div>
  `,
  host: { class: 'block' },
})
export default class ManageProgramComponent {
  readonly id = input.required<string>();
  readonly store = inject(ManageProgramStore);
  readonly documents = inject(ProgramDocumentsStore);
  readonly participants = inject(UsersOnProgramsStore);
  readonly programs = inject(ProgramsStore);
  readonly review = inject(TaskReviewStore);
  private readonly allies = inject(AlliesOnProgramsStore);
  private readonly requirements = inject(RequirementsStore);
  private readonly dialog = inject(MatDialog);
  private readonly injector = inject(Injector);
  private readonly fb = inject(FormBuilder);

  readonly settingsForm = this.fb.nonNullable.group(
    { name: ['', Validators.required], startDate: '', endDate: '', description: '' },
    { validators: datesInOrder },
  );

  readonly loadEffect = effect(() => {
    const id = this.id();
    untracked(() => {
      this.participants.setProgramId(id);
      this.participants.getUsers();
      this.allies.setProgramId(id);
      this.allies.getAllies();
      this.programs.getEnrollments(id);
      this.documents.load(id);
    });
  });

  editSettings(): void {
    const program = this.programs.program();
    this.settingsForm.reset({
      name: program?.name ?? '',
      startDate: toDateInput(program?.startDate),
      endDate: toDateInput(program?.endDate),
      description: program?.description ?? '',
    });
    this.store.setEditingSettings(true);
  }

  saveSettings(): void {
    if (this.settingsForm.invalid) return;
    const { name, startDate, endDate, description } = this.settingsForm.getRawValue();
    this.programs.patchProgram({
      id: this.id(),
      name: name.trim(),
      startDate: startDate ? new Date(`${startDate}T00:00`) : null,
      endDate: endDate ? new Date(`${endDate}T00:00`) : null,
      // An editor left empty still holds an empty paragraph, which should not be saved as a description.
      description: htmlToText(description) ? description : null,
      keepOpen: true,
      onSaved: () => {
        this.store.setEditingSettings(false);
        // Month 1 follows the start date, so the review data needs to know about the new dates.
        this.review.load(this.id());
      },
    });
  }

  openPlan(month: number): void {
    openMonthlyPlan(this.dialog, this.injector, month);
  }

  openRecord(record: UsersOnProgramsWithName): void {
    this.requirements.setProgramId(this.id());
    this.requirements.getRequirements();
    this.dialog.open(AddUsersOnProgramsComponent, { data: record, maxWidth: 'calc(100vw - 2rem)', width: '48rem' });
  }

  askToRemove(userId: string): void {
    this.store.askToRemove(userId);
    this.dialog
      .open(RemovePersonDialogComponent, {
        injector: this.injector,
        width: '25rem',
        maxWidth: 'calc(100vw - 2rem)',
        ariaLabelledBy: 'remove-person-title',
      })
      .afterClosed()
      .subscribe(() => this.store.cancelRemove());
  }

  approve(enrollmentId: string): void {
    this.programs.convertToUser({
      programId: this.id(),
      enrollmentId,
      onApproved: () => {
        this.participants.getUsers();
        this.review.load(this.id());
      },
    });
  }

  decline(enrollmentId: string, name: string): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Decline request',
        content: `Decline ${name}’s request and delete their application?`,
        color: 'warn',
        onYesClick: () => this.programs.deleteEnrollment({ programId: this.id(), enrollmentId }),
      },
    });
  }

  upload(input: HTMLInputElement): void {
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (files.length) this.documents.upload(files);
  }

  download(id: string, name: string): void {
    this.documents.download({
      id,
      onReady: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = name;
        link.click();
        URL.revokeObjectURL(url);
      },
    });
  }
}
