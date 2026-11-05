import { toDateValue, toNumber } from './edit-participant-dialog.component';
import { toProgramDate } from './program-settings-dialog.component';
import { fileSizeLabel, MAX_PROOF_BYTES, proofProblem } from './record-payment-dialog.component';

describe('manage program window helpers', () => {
  it('reads dates from date fields in local time', () => {
    expect(toProgramDate('')).toBeNull();
    expect(toProgramDate('2026-05-01')?.getDate()).toBe(1);
    expect(toDateValue('')).toBeUndefined();
    expect(toDateValue('2026-03-14')?.getMonth()).toBe(2);
  });

  it.each([
    ['38,500', 38500],
    ['$41,200.50', 41200.5],
    ['', undefined],
    ['about ten', undefined],
  ])('reads %s as %s', (value, expected) => {
    expect(toNumber(value)).toBe(expected);
  });

  it('accepts check photos and PDFs up to 5 MB', () => {
    const file = (type: string, size = 10) => new File([new Uint8Array(size)], 'proof', { type });
    expect(proofProblem(file('image/jpeg'))).toBe('');
    expect(proofProblem(file('application/pdf'))).toBe('');
    expect(proofProblem(file('text/plain'))).toBe('Choose a JPG, PNG, WebP, HEIC or PDF file.');
    expect(proofProblem(file('image/png', MAX_PROOF_BYTES + 1))).toBe('Choose a file smaller than 5 MB.');
  });

  it('labels file sizes', () => {
    expect(fileSizeLabel(200)).toBe('1 KB');
    expect(fileSizeLabel(48_000)).toBe('47 KB');
    expect(fileSizeLabel(2_516_582)).toBe('2.4 MB');
  });
});
