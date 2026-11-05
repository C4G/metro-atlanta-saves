import { monthNumber, monthOfProgram } from './program-month';

describe('program month helpers', () => {
  it.each([
    ['Month 3', 3],
    ['  month 12 ', 12],
    ['Lunch Receipt', 0],
    ['Month', 0],
  ])('reads the month number from %p', (name, expected) => {
    expect(monthNumber(name)).toBe(expected);
  });

  it.each([
    [null, '2026-10-28', 1],
    ['2026-10-01', '2026-10-28', 1],
    ['2026-08-15', '2026-10-28', 3],
    ['2026-08-30', '2026-10-28', 2],
    ['2026-12-01', '2026-10-28', -1],
  ])('counts months from a start date of %p', (start, today, expected) => {
    expect(monthOfProgram(start, new Date(`${today}T12:00:00`))).toBe(expected);
  });
});
