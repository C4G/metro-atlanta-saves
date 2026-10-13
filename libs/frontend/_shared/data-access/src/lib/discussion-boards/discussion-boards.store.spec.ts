import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { type DiscussionBoard, DiscussionBoardsStore } from './discussion-boards.store';

describe('DiscussionBoardsStore', () => {
  const board: DiscussionBoard = {
    cohortId: null,
    createdAt: '2026-10-10T00:00:00.000Z',
    createdBy: { id: 'user-1', firstName: 'Jordan', lastName: 'Lee', bio: null },
    description: 'Connect with peers',
    id: 'board-1',
    memberCount: 2,
    name: 'Community board',
    postCount: 1,
    programId: null,
    updatedAt: '2026-10-10T00:00:00.000Z',
  };

  let http: HttpTestingController;
  let store: InstanceType<typeof DiscussionBoardsStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DiscussionBoardsStore, provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    store = TestBed.inject(DiscussionBoardsStore);
  });

  afterEach(() => {
    http.verify();
  });

  it('loads the accessible discussion boards', () => {
    store.getBoards().subscribe();
    http.expectOne('/api/discussion-boards').flush([board]);

    expect(store.boards()).toEqual([board]);
  });

  it('clears stale boards when loading fails after the user context changes', () => {
    store.getBoards().subscribe();
    http.expectOne('/api/discussion-boards').flush([board]);

    store.getBoards().subscribe({ error: () => undefined });
    http.expectOne('/api/discussion-boards').flush('Request failed', { status: 500, statusText: 'Server Error' });

    expect(store.boards()).toEqual([]);
  });

  it('keeps list and selected-board state synchronized when a board is updated', () => {
    store.getBoards().subscribe();
    http.expectOne('/api/discussion-boards').flush([board]);
    store.getBoard(board.id).subscribe();
    http.expectOne(`/api/discussion-boards/${board.id}`).flush(board);

    store.updateBoard(board.id, { name: 'Updated board' }).subscribe();
    const request = http.expectOne(`/api/discussion-boards/${board.id}`);
    expect(request.request.method).toBe('PATCH');
    request.flush({ ...board, name: 'Updated board' });

    expect(store.board()?.name).toBe('Updated board');
    expect(store.boards()[0].name).toBe('Updated board');
  });

  it('adds and removes boards through the shared CRUD resource', () => {
    store.createBoard({ name: board.name }).subscribe();
    const create = http.expectOne('/api/discussion-boards');
    expect(create.request.method).toBe('POST');
    create.flush(board);
    expect(store.boards()).toEqual([board]);

    store.deleteBoard(board.id).subscribe();
    const remove = http.expectOne(`/api/discussion-boards/${board.id}`);
    expect(remove.request.method).toBe('DELETE');
    remove.flush({ message: 'Discussion board deleted successfully' });
    expect(store.boards()).toEqual([]);
  });

  it('updates member counts without allowing a negative count', () => {
    store.getBoards().subscribe();
    http.expectOne('/api/discussion-boards').flush([{ ...board, memberCount: 0 }]);

    store.adjustMemberCount(board.id, -1);

    expect(store.boards()[0].memberCount).toBe(0);
  });
});
