import { formatDateInput, parseDateInput } from './date-input.component';

describe('date input conversion', () => {
  it('reads yyyy-mm-dd as a local calendar day', () => {
    const date = parseDateInput('2026-11-02');
    expect([date?.getFullYear(), date?.getMonth(), date?.getDate()]).toEqual([2026, 10, 2]);
    expect(parseDateInput('')).toBeNull();
    expect(parseDateInput('11/02/2026')).toBeNull();
  });

  it('writes a picked day back as yyyy-mm-dd', () => {
    expect(formatDateInput(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(formatDateInput(null)).toBe('');
  });
});
