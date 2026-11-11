import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MonthReceiptsStore } from './month-receipts.store';

describe('Monthly receipts', () => {
  const context = { programId: 'program-1', checkpointId: 'month-1', userId: 'participant-1' };
  let store: InstanceType<typeof MonthReceiptsStore>;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MonthReceiptsStore, provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(MonthReceiptsStore);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });
  it('loads only the signed-in participant and selected monthly checkpoint', () => {
    store.load(context);
    const request = http.expectOne((req) => req.method === 'GET');
    expect(request.request.params.get('programId')).toBe(context.programId);
    expect(request.request.params.get('checkpointId')).toBe(context.checkpointId);
    expect(request.request.params.get('userId')).toBe(context.userId);
    request.flush([{ id: 'receipt-1', name: 'Savings.pdf' }]);
    expect(store.receipts()[0].id).toBe('receipt-1');
  });
  it('keeps earlier unassigned receipts accessible without mixing them into a monthly card', () => {
    store.load({ ...context, checkpointId: '' });
    const request = http.expectOne((req) => req.method === 'GET');
    expect(request.request.params.get('unassignedCheckpoint')).toBe('true');
    expect(request.request.params.has('checkpointId')).toBe(false);
    expect(request.request.params.get('userId')).toBe(context.userId);
    request.flush([]);
  });
  it('uploads to the correct month, ignores repeated submissions, and permits retry after failure', () => {
    const file = new File(['receipt'], 'Savings.pdf', { type: 'application/pdf' });
    store.upload({ ...context, files: [file] });
    store.upload({ ...context, files: [file] });
    const request = http.expectOne((req) => req.method === 'POST');
    expect(request.request.params.get('checkpointId')).toBe('month-1');
    expect(request.request.params.has('userId')).toBe(false);
    expect(request.request.body.getAll('files')).toHaveLength(1);
    request.flush({}, { status: 500, statusText: 'Error' });
    expect(store.uploading()).toBe(false);
    expect(store.error()).toContain('could not upload');
    store.upload({ ...context, files: [file] });
    http.expectOne((req) => req.method === 'POST').flush([{ id: 'receipt-1', name: file.name }]);
    expect(store.receipts()).toHaveLength(1);
    expect(store.notice()).toBe('');
  });
  it('prepares an empty month then uploads, keeping the loader active across both requests', () => {
    const submission = {
      ...context,
      checkpointId: '',
      monthName: 'Month 3',
      files: [new File(['receipt'], 'Savings.pdf', { type: 'application/pdf' })],
    };
    store.upload(submission);
    expect(store.uploading()).toBe(true);
    const prepare = http.expectOne('/api/checkpoints/my/program/program-1/month/Month%203/receipt-checkpoint');
    expect(prepare.request.body).toEqual({});
    prepare.flush({ id: 'new-month' });
    expect(store.uploading()).toBe(true);
    const upload = http.expectOne((req) => req.url === '/api/images');
    expect(upload.request.params.get('checkpointId')).toBe('new-month');
    upload.flush({}, { status: 500, statusText: 'Error' });
    expect(store.uploading()).toBe(false);
    store.upload(submission);
    http.expectNone('/api/checkpoints/my/program/program-1/month/Month%203/receipt-checkpoint');
    http.expectOne((req) => req.url === '/api/images').flush([]);
    expect(store.uploading()).toBe(false);
  });
  it('removes a receipt only after the server succeeds and preserves it after failure', () => {
    store.load(context);
    http.expectOne((req) => req.method === 'GET').flush([{ id: 'receipt-1', name: 'Savings.pdf' }]);
    store.remove('receipt-1');
    store.remove('receipt-1');
    expect(store.deletingId()).toBe('receipt-1');
    expect(store.receipts()).toHaveLength(1);
    http.expectOne('/api/images/receipt-1').flush({}, { status: 403, statusText: 'Forbidden' });
    expect(store.receipts()).toHaveLength(1);
    expect(store.deletingId()).toBe('');
    expect(store.error()).toContain('could not delete');
    store.remove('receipt-1');
    const request = http.expectOne('/api/images/receipt-1');
    expect(request.request.method).toBe('DELETE');
    request.flush({});
    expect(store.receipts()).toHaveLength(0);
    expect(store.notice()).toBe('');
  });
  it('rejects unsupported and oversized files without uploading', () => {
    store.upload({ ...context, files: [new File(['text'], 'file.txt', { type: 'text/plain' })] });
    const big = new File(['image'], 'large.png', { type: 'image/png' });
    Object.defineProperty(big, 'size', { value: 5_242_881 });
    store.upload({ ...context, files: [big] });
    http.expectNone((req) => req.method === 'POST');
    expect(store.error()).toContain('5 MB');
  });
});
