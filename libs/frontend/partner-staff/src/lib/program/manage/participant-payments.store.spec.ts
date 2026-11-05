import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ParticipantPayment } from '@mas/models';
import {
  AMOUNT_PATTERN,
  normalizeAmount,
  ParticipantPaymentsStore,
  paymentDate,
  summarizePayments,
} from './participant-payments.store';

const payment = (overrides: Partial<ParticipantPayment>): ParticipantPayment => ({
  id: 'payment-1',
  createdAt: new Date('2026-11-02'),
  userId: 'person-1',
  amount: 250,
  paidAt: new Date('2026-08-14'),
  checkNumber: null,
  paidBy: null,
  note: null,
  proofName: 'check.jpg',
  proofType: 'image/jpeg',
  ...overrides,
});

describe('payment helpers', () => {
  it.each([
    ['250', true],
    ['250.5', true],
    ['1,250.00', true],
    ['$500', true],
    ['0', false],
    ['0.00', false],
    ['12.345', false],
    ['-5', false],
    ['ten', false],
  ])('accepts %s as an amount: %s', (value, valid) => {
    expect(AMOUNT_PATTERN.test(normalizeAmount(value))).toBe(valid);
  });

  it('sends the paid date at local noon so it reads as the same day everywhere', () => {
    const sent = new Date(paymentDate('2026-11-02'));
    expect([sent.getFullYear(), sent.getMonth(), sent.getDate(), sent.getHours()]).toEqual([2026, 10, 2, 12]);
  });

  it('totals each participant’s payments and keeps the latest date', () => {
    const summary = summarizePayments([
      payment({ id: 'a', amount: 250, paidAt: new Date('2026-08-14') }),
      payment({ id: 'b', amount: 500, paidAt: new Date('2026-11-02') }),
      payment({ id: 'c', userId: 'person-2', amount: 75 }),
    ]);
    expect(summary.get('person-1')).toEqual({ total: 750, count: 2, lastPaidAt: new Date('2026-11-02') });
    expect(summary.get('person-2')?.total).toBe(75);
  });
});

describe('ParticipantPaymentsStore', () => {
  let store: InstanceType<typeof ParticipantPaymentsStore>;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ParticipantPaymentsStore, provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(ParticipantPaymentsStore);
    http = TestBed.inject(HttpTestingController);
    store.load('program-1');
    http.expectOne('/api/users-on-programs/program/program-1/payments').flush([payment({})]);
  });
  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });

  it('sends the form with its proof and adds the saved payment', () => {
    const onSaved = jest.fn();
    const proof = new File(['check'], 'check.jpg', { type: 'image/jpeg' });
    store.record({
      userId: 'person-1',
      amount: '$1,000.00',
      paidAt: '2026-11-02',
      checkNumber: ' 1042 ',
      paidBy: 'Frontline Housing',
      note: '',
      proof,
      onSaved,
    });
    const request = http.expectOne('/api/users-on-programs/program/program-1/participants/person-1/payments');
    const body = request.request.body as FormData;
    expect(body.get('amount')).toBe('1000.00');
    expect(body.get('checkNumber')).toBe('1042');
    expect(body.get('paidAt')).toBe(paymentDate('2026-11-02'));
    expect(body.has('note')).toBe(false);
    expect(body.get('proof')).toBe(proof);
    const saved = payment({ id: 'payment-2', amount: 1000 });
    request.flush(saved);
    expect(onSaved).toHaveBeenCalledWith(saved);
    expect(store.byParticipant().get('person-1')?.total).toBe(1250);
    expect(store.saving()).toBe(false);
  });

  it('shows the server’s reason when a payment is refused', () => {
    store.record({
      userId: 'person-1',
      amount: '10',
      paidAt: '2026-11-02',
      checkNumber: '',
      paidBy: '',
      note: '',
      proof: new File(['x'], 'x.txt', { type: 'text/plain' }),
      onSaved: jest.fn(),
    });
    http
      .expectOne('/api/users-on-programs/program/program-1/participants/person-1/payments')
      .flush({ message: ['The proof must be a JPG, PNG, WebP, HEIC or PDF file.'] }, { status: 422, statusText: 'No' });
    expect(store.error()).toBe('The proof must be a JPG, PNG, WebP, HEIC or PDF file.');
  });
});
