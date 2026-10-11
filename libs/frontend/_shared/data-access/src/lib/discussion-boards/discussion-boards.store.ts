import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { catchError, tap, throwError } from 'rxjs';

export type DiscussionBoard = {
  cohortId: string | null;
  createdAt: string;
  createdBy: {
    bio?: string | null;
    firstName: string;
    id: string;
    lastName: string;
  };
  description: string | null;
  id: string;
  memberCount: number;
  name: string;
  postCount: number;
  programId: string | null;
  updatedAt: string;
};

export type CreateDiscussionBoard = {
  cohortId?: string;
  description?: string;
  memberIds?: string[];
  name: string;
  programId?: string;
};

export type UpdateDiscussionBoard = {
  description?: string;
  name?: string;
};

type DiscussionBoardsState = {
  board: DiscussionBoard | null;
  boards: DiscussionBoard[];
};

const BASE_URL = '/api/discussion-boards';

export const DiscussionBoardsStore = signalStore(
  { providedIn: 'root' },
  withState<DiscussionBoardsState>({ board: null, boards: [] }),
  withMethods((store, http = inject(HttpClient)) => ({
    adjustMemberCount: (boardId: string, delta: number) => {
      patchState(store, ({ board, boards }) => ({
        board: board?.id === boardId ? { ...board, memberCount: Math.max(0, board.memberCount + delta) } : board,
        boards: boards.map((board) =>
          board.id === boardId ? { ...board, memberCount: Math.max(0, board.memberCount + delta) } : board,
        ),
      }));
    },
    createBoard: (board: CreateDiscussionBoard) =>
      http.post<DiscussionBoard>(BASE_URL, board).pipe(
        tap((createdBoard) => {
          patchState(store, ({ boards }) => ({ boards: [...boards, createdBoard] }));
        }),
      ),
    deleteBoard: (boardId: string) =>
      http.delete<{ message: string }>(`${BASE_URL}/${boardId}`).pipe(
        tap(() => {
          patchState(store, ({ board, boards }) => ({
            board: board?.id === boardId ? null : board,
            boards: boards.filter((item) => item.id !== boardId),
          }));
        }),
      ),
    getBoard: (boardId: string) =>
      http.get<DiscussionBoard>(`${BASE_URL}/${boardId}`).pipe(
        tap((board) => {
          patchState(store, { board });
        }),
      ),
    getBoards: () =>
      http.get<DiscussionBoard[]>(BASE_URL).pipe(
        tap((boards) => {
          patchState(store, { boards });
        }),
        catchError((error: unknown) => {
          patchState(store, { boards: [] });
          return throwError(() => error);
        }),
      ),
    updateBoard: (boardId: string, changes: UpdateDiscussionBoard) =>
      http.patch<DiscussionBoard>(`${BASE_URL}/${boardId}`, changes).pipe(
        tap((updatedBoard) => {
          patchState(store, ({ board, boards }) => ({
            board: board?.id === updatedBoard.id ? updatedBoard : board,
            boards: boards.map((board) => (board.id === updatedBoard.id ? updatedBoard : board)),
          }));
        }),
      ),
  })),
);
