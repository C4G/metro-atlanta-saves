import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { type Blog } from '@prisma/client';
import { MatDialog } from '@angular/material/dialog';

type AddBlog = Omit<Blog, 'id' | 'createdAt' | 'updatedAt'>;

type BlogsState = {
  blog: null | Blog;
  blogs: Blog[];
};

const initialState: BlogsState = {
  blog: null,
  blogs: [],
};

const BASE_URL = '/api/blogs';

export const BlogsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, http = inject(HttpClient), snackBar = inject(MatSnackBar), dialogRef = inject(MatDialog)) => ({
    setProgramId: (programId: string) => {
      patchState(store, (state) => ({ ...state, programId }));
    },
    clearBlog: () => patchState(store, (state) => ({ ...state, blog: null })),
    getBlogs: rxMethod<void>(
      pipe(
        switchMap(() =>
          http.get<Blog[]>(BASE_URL).pipe(
            tapResponse({
              next: (blogs) => {
                patchState(store, (state) => ({ ...state, blogs }));
              },
              error: () => {
                snackBar.open('There was an error retreiving blogs', undefined, {
                  panelClass: 'error',
                  duration: 5000,
                });
              },
            }),
          ),
        ),
      ),
    ),
    getBlog: rxMethod<string>(
      pipe(
        switchMap((slug: string) =>
          http.get<Blog>(`${BASE_URL}/slug/${slug}`).pipe(
            tapResponse({
              next: (blog) => {
                patchState(store, (state) => ({ ...state, blog }));
              },
              error: () => {
                snackBar.open('There was an error retreiving the blog', undefined, {
                  panelClass: 'error',
                  duration: 5000,
                });
              },
            }),
          ),
        ),
      ),
    ),
    patchBlog: rxMethod<Partial<Blog>>(
      pipe(
        switchMap((blog) =>
          http.patch<Blog>(`${BASE_URL}/${blog.id}`, blog).pipe(
            tapResponse({
              next: (blog) => {
                patchState(store, (state) => ({
                  ...state,
                  blogs: state.blogs.map((a) => (a.id === blog.id ? blog : a)),
                }));
                dialogRef.closeAll();
                snackBar.open(`${blog.title} has been updated`, undefined, {
                  panelClass: 'success',
                  duration: 5000,
                });
              },
              error: (resp: HttpErrorResponse) => {
                snackBar.open(resp.error.message[0] || `There was an error updating the blog`, undefined, {
                  panelClass: 'error',
                  duration: 5000,
                });
              },
            }),
          ),
        ),
      ),
    ),
    addBlog: rxMethod<AddBlog>(
      pipe(
        switchMap((blog) =>
          http.post<Blog>(BASE_URL, blog).pipe(
            tapResponse({
              next: (blog) => {
                patchState(store, (state) => ({
                  ...state,
                  blogs: [...state.blogs, blog],
                }));
                dialogRef.closeAll();
                snackBar.open(`${blog.title} has been created!`, undefined, {
                  panelClass: 'success',
                  duration: 5000,
                });
              },
              error: (resp: HttpErrorResponse) => {
                snackBar.open(resp.error.message[0] || `There was an error creating the blog`, undefined, {
                  panelClass: 'error',
                  duration: 5000,
                });
              },
            }),
          ),
        ),
      ),
    ),
    deleteBlog: rxMethod<string>(
      pipe(
        switchMap((id) =>
          http.delete<Blog>(`${BASE_URL}/${id}`).pipe(
            tapResponse({
              next: (blog) => {
                patchState(store, (state) => ({
                  ...state,
                  blogs: state.blogs.filter((p) => p.id !== blog.id),
                }));
                snackBar.open(`${blog.title} has been deleted!`, undefined, {
                  panelClass: 'success',
                  duration: 5000,
                });
              },
              error: (resp: HttpErrorResponse) => {
                snackBar.open(resp.error.message[0] || `There was an error deleting the blog`, undefined, {
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
);
