import { formatDate } from '@angular/common';
import { computed, inject, LOCALE_ID } from '@angular/core';
import {
  EducationalContentStore,
  FrequentTasksStore,
  NewPlanTask,
  PlanAssignment,
  taskKey,
  TaskReviewStore,
} from '@mas/frontend-shared-data-access';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

export const MAX_MONTHS = 36;
const VISIBLE_TABS = 6;

export type DraftTask = {
  key: string;
  id: string | null;
  name: string;
  month: number | null;
  due: string;
  educationalContentId: string | null;
};

export type TaskForm = {
  key: string | null;
  name: string;
  due: string;
  educationalContentId: string | null;
  saveToFrequent: boolean;
  pickingContent: boolean;
  contentQuery: string;
};

type MonthlyPlanEditorState = {
  months: number;
  tasks: DraftTask[];
  original: DraftTask[];
  removedIds: string[];
  selected: number;
  windowStart: number;
  form: TaskForm | null;
  nextKey: number;
};

const initialState: MonthlyPlanEditorState = {
  months: 1,
  tasks: [],
  original: [],
  removedIds: [],
  selected: 1,
  windowStart: 1,
  form: null,
  nextKey: 1,
};

const emptyForm: TaskForm = {
  key: null,
  name: '',
  due: '',
  educationalContentId: null,
  saveToFrequent: false,
  pickingContent: false,
  contentQuery: '',
};

export const toDateInput = (dueAt: Date | string | null | undefined) => {
  if (!dueAt) return '';
  const date = new Date(dueAt);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const toDueAt = (due: string) => (due ? new Date(`${due}T23:59`).toISOString() : null);

export const monthRange = (startDate: Date | string | null | undefined, month: number) => {
  if (!startDate) return null;
  const start = new Date(startDate);
  const first = new Date(start.getFullYear(), start.getMonth() + month - 1, start.getDate());
  const last = new Date(start.getFullYear(), start.getMonth() + month, start.getDate() - 1);
  return { min: toDateInput(first), max: toDateInput(last) };
};

export const windowFor = (month: number, windowStart: number, months: number) => {
  const highestStart = Math.max(1, months - VISIBLE_TABS + 1);
  if (month < windowStart) return month;
  if (month >= windowStart + VISIBLE_TABS) return Math.min(highestStart, month - VISIBLE_TABS + 1);
  return Math.min(windowStart, highestStart);
};

export const MonthlyPlanEditorStore = signalStore(
  withState(initialState),
  withComputed(
    (
      { months, tasks, original, removedIds, selected, windowStart, form },
      review = inject(TaskReviewStore),
      frequent = inject(FrequentTasksStore),
      content = inject(EducationalContentStore),
      locale = inject(LOCALE_ID),
    ) => {
      const contentById = computed(() => new Map(content.contentList().map((item) => [item.id, item])));
      const contentMeta = (id: string | null) => {
        const item = id ? contentById().get(id) : null;
        return item ? { title: item.title, meta: item.categories.join(' · ') || 'Learning content' } : null;
      };
      const contentMark = (id: string) => {
        const item = contentById().get(id);
        return item?.file ? 'FILE' : item?.link ? 'LINK' : 'READ';
      };
      const minimumMonths = computed(() => Math.max(1, ...tasks().map(({ month }) => month ?? 0)));
      const unscheduled = computed(() => tasks().filter(({ month }) => month === null));
      const monthTasks = computed(() =>
        tasks().filter(({ month }) => (selected() ? month === selected() : month === null)),
      );
      return {
        minimumMonths,
        atMinimum: computed(() => months() <= minimumMonths()),
        atMaximum: computed(() => months() >= MAX_MONTHS),
        hasUnscheduled: computed(() => unscheduled().length > 0),
        unscheduledCount: computed(() => unscheduled().length),
        tabs: computed(() =>
          Array.from({ length: Math.min(VISIBLE_TABS, months()) }, (_, index) => windowStart() + index)
            .filter((n) => n <= months())
            .map((n) => ({ n, label: `Month ${n}`, isSelected: selected() === n })),
        ),
        monthOptions: computed(() => Array.from({ length: months() }, (_, index) => index + 1)),
        canGoEarlier: computed(() => windowStart() > 1),
        canGoLater: computed(() => windowStart() + VISIBLE_TABS <= months()),
        month: computed(() => {
          const n = selected();
          const range = n ? monthRange(review.data()?.startDate, n) : null;
          return {
            n,
            label: n ? `Month ${n}` : 'Anytime',
            minDue: range?.min ?? '',
            maxDue: range?.max ?? '',
            tasks: monthTasks().map((task) => {
              const attached = contentMeta(task.educationalContentId);
              const due = task.due ? `Due ${formatDate(`${task.due}T12:00`, 'MMM d, y', locale)}` : 'No due date';
              const isStarred = frequent.savedNames().has(taskKey(task.name));
              return {
                ...task,
                meta: attached ? `${due} · ${attached.title}` : due,
                isStarred,
                isEditing: form()?.key === task.key,
                starLabel: isStarred
                  ? `Remove ${task.name} from frequently used`
                  : `Save ${task.name} to frequently used`,
              };
            }),
          };
        }),
        formView: computed(() => {
          const current = form();
          if (!current) return null;
          const attached = contentMeta(current.educationalContentId);
          const query = current.contentQuery.trim().toLowerCase();
          return {
            ...current,
            isNew: current.key === null,
            canSubmit: current.name.trim().length > 0,
            content:
              attached && current.educationalContentId
                ? { ...attached, mark: contentMark(current.educationalContentId) }
                : null,
            contentItems: content
              .contentList()
              .filter((item) => !query || `${item.title} ${item.categories.join(' ')}`.toLowerCase().includes(query))
              .slice(0, 8)
              .map((item) => ({
                id: item.id,
                title: item.title,
                meta: item.categories.join(' · ') || 'Learning content',
                mark: contentMark(item.id),
              })),
          };
        }),
        library: computed(() => {
          const inMonth = new Set(monthTasks().map(({ name }) => taskKey(name)));
          return frequent.sortedTasks().map((task) => {
            const added = inMonth.has(taskKey(task.name));
            return {
              ...task,
              meta: contentMeta(task.educationalContentId)?.title ?? 'No content',
              isAdded: added,
              isPending: frequent.pending().includes(task.id),
            };
          });
        }),
        submission: computed(() => {
          const before = new Map(original().map((task) => [task.key, task]));
          const assignments: PlanAssignment[] = tasks().flatMap((task) => {
            const was = task.id ? before.get(task.key) : undefined;
            if (!task.id || !was) return [];
            return [
              {
                requirementId: task.id,
                month: task.month,
                ...(task.name.trim() !== was.name && { name: task.name.trim() }),
                ...(task.due !== was.due && { dueAt: toDueAt(task.due) }),
                ...(task.educationalContentId !== was.educationalContentId && {
                  educationalContentId: task.educationalContentId,
                }),
              },
            ];
          });
          const newTasks: NewPlanTask[] = tasks().flatMap((task) =>
            task.id || task.month === null
              ? []
              : [
                  {
                    name: task.name.trim(),
                    month: task.month,
                    dueAt: toDueAt(task.due),
                    educationalContentId: task.educationalContentId,
                  },
                ],
          );
          return { months: months(), assignments, newTasks, removedRequirementIds: removedIds() };
        }),
      };
    },
  ),
  withMethods((store, frequent = inject(FrequentTasksStore)) => {
    const select = (selected: number) =>
      patchState(store, {
        selected,
        form: null,
        windowStart: selected ? windowFor(selected, store.windowStart(), store.months()) : store.windowStart(),
      });
    const updateForm = (changes: Partial<TaskForm>) => {
      const form = store.form();
      if (form) patchState(store, { form: { ...form, ...changes } });
    };
    return {
      start: ({ months, month, tasks }: { months: number; month: number; tasks: Omit<DraftTask, 'key'>[] }) => {
        const keyed = tasks.map((task, index) => ({ ...task, key: `t${index}` }));
        const selected = Math.min(Math.max(month, 1), months);
        patchState(store, {
          months,
          tasks: keyed,
          original: keyed,
          removedIds: [],
          form: null,
          nextKey: keyed.length,
          selected,
          windowStart: windowFor(selected, 1, months),
        });
      },
      setMonths: (value: number) => {
        const months = Math.min(MAX_MONTHS, Math.max(store.minimumMonths(), value));
        const selected = Math.min(store.selected(), months);
        patchState(store, { months, selected, windowStart: windowFor(selected || 1, store.windowStart(), months) });
      },
      select,
      showEarlier: () => patchState(store, { windowStart: Math.max(1, store.windowStart() - 1) }),
      showLater: () =>
        patchState(store, {
          windowStart: Math.min(Math.max(1, store.months() - VISIBLE_TABS + 1), store.windowStart() + 1),
        }),
      startAdding: () => patchState(store, { form: { ...emptyForm } }),
      startEditing: (key: string) => {
        const task = store.tasks().find((item) => item.key === key);
        if (task) {
          patchState(store, {
            form: {
              ...emptyForm,
              key,
              name: task.name,
              due: task.due,
              educationalContentId: task.educationalContentId,
            },
          });
        }
      },
      cancelForm: () => patchState(store, { form: null }),
      updateForm,
      pickContent: (educationalContentId: string) =>
        updateForm({ educationalContentId, pickingContent: false, contentQuery: '' }),
      submitForm: () => {
        const form = store.form();
        const name = form?.name.trim();
        if (!form || !name) return;
        const month = store.selected() || null;
        if (form.key === null) {
          const key = `n${store.nextKey()}`;
          patchState(store, {
            tasks: [
              ...store.tasks(),
              { key, id: null, name, month, due: form.due, educationalContentId: form.educationalContentId },
            ],
            nextKey: store.nextKey() + 1,
            form: null,
          });
        } else {
          patchState(store, {
            tasks: store
              .tasks()
              .map((task) =>
                task.key === form.key
                  ? { ...task, name, due: form.due, educationalContentId: form.educationalContentId }
                  : task,
              ),
            form: null,
          });
        }
        if (form.saveToFrequent && !frequent.savedNames().has(taskKey(name))) {
          frequent.save({ name, educationalContentId: form.educationalContentId });
        }
      },
      removeTask: (key: string) => {
        const task = store.tasks().find((item) => item.key === key);
        if (!task) return;
        patchState(store, {
          tasks: store.tasks().filter((item) => item.key !== key),
          removedIds: task.id ? [...store.removedIds(), task.id] : store.removedIds(),
          form: null,
        });
      },
      moveToMonth: (key: string, month: number) =>
        patchState(store, {
          tasks: store.tasks().map((task) => (task.key === key ? { ...task, month } : task)),
        }),
      toggleStar: (key: string) => {
        const task = store.tasks().find((item) => item.key === key);
        if (!task) return;
        const saved = frequent.tasks().find(({ name }) => taskKey(name) === taskKey(task.name));
        if (saved) frequent.remove(saved.id);
        else frequent.save({ name: task.name.trim(), educationalContentId: task.educationalContentId });
      },
      addFromLibrary: (id: string) => {
        const saved = frequent.tasks().find((task) => task.id === id);
        const month = store.selected() || null;
        if (!saved || month === null) return;
        const key = `n${store.nextKey()}`;
        patchState(store, {
          tasks: [
            ...store.tasks(),
            { key, id: null, name: saved.name, month, due: '', educationalContentId: saved.educationalContentId },
          ],
          nextKey: store.nextKey() + 1,
        });
      },
    };
  }),
);
