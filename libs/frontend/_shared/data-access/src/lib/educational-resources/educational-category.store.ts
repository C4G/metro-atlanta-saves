import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EducationalCategory } from '@mas/models';
import { MatDialog } from '@angular/material/dialog';

type CategoryState = {
  categoryList: EducationalCategory[];
};

const initialState: CategoryState = {
  categoryList: [],
};

const BASE_URL = '/api/educational-category';

export const EducationalCategoryStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, http = inject(HttpClient), snackBar = inject(MatSnackBar), dialogRef = inject(MatDialog)) => ({
    getCategoryList: rxMethod<void>(
      pipe(
        switchMap(() =>
          http.get<EducationalCategory[]>(`${BASE_URL}`).pipe(
            tapResponse({
              next: (data) => {
                patchState(store, (state) => ({ ...state, categoryList: data }));
              },
              error: () => {
                snackBar.open('There was an error while fetching the data...', undefined, {
                  panelClass: 'error',
                  duration: 5000,
                });
              },
            }),
          ),
        ),
      ),
    ),
    addCategories: rxMethod<Partial<EducationalCategory>>(
      pipe(
        switchMap((content) =>
          http.post<EducationalCategory>(`${BASE_URL}`, content).pipe(
            tapResponse({
              next: (content) => {
                patchState(store, (state) => ({
                  ...state,
                  categoryList: [...state.categoryList, content],
                }));
                dialogRef.closeAll();

                snackBar.open(`${content.category} has been added`, undefined, {
                  panelClass: 'success',
                  duration: 5000,
                });
              },
              error: (resp: HttpErrorResponse) => {
                snackBar.open(resp.error.message[0] || `There was an error updating the category`, undefined, {
                  panelClass: 'error',
                  duration: 5000,
                });
              },
            }),
          ),
        ),
      ),
    ),
    patchContent: rxMethod<Partial<EducationalCategory>>(
      pipe(
        switchMap((category) =>
          http.patch<EducationalCategory>(`${BASE_URL}/${category.id}`, category).pipe(
            tapResponse({
              next: (category) => {
                patchState(store, (state) => ({
                  ...state,
                  categoryList: state.categoryList.map((a) => (a.id === category.id ? category : a)),
                }));
                snackBar.open(`${category.category} has been updated`, undefined, {
                  panelClass: 'success',
                  duration: 5000,
                });
                dialogRef.closeAll();
              },
              error: (resp: HttpErrorResponse) => {
                snackBar.open(resp.error.message[0] || `There was an error updating the category`, undefined, {
                  panelClass: 'error',
                  duration: 5000,
                });
              },
            }),
          ),
        ),
      ),
    ),
    deleteCategory: rxMethod<string>(
      pipe(
        switchMap((id) =>
          http.delete<void>(`${BASE_URL}/${id}`).pipe(
            tapResponse({
              next: () => {
                patchState(store, (state) => ({
                  ...state,
                  categoryList: state.categoryList.filter((a) => a.id !== id),
                }));
                snackBar.open(`Category has been deleted`, undefined, {
                  panelClass: 'success',
                  duration: 5000,
                });
              },
              error: (resp: HttpErrorResponse) => {
                snackBar.open(resp.error.message[0] || `There was an error deleting the category`, undefined, {
                  panelClass: 'error',
                  duration: 5000,
                });
              },
            }),
          ),
        ),
      ),
    ),
  })),
  withHooks({
    onInit(store) {
      store.getCategoryList();
    },
  }),
);
