import { getRequirementReminderScheduledAt } from './requirement-reminder-time';

describe('getRequirementReminderScheduledAt', () => {
  it('schedules one day before at 9 a.m. Eastern across the spring DST transition', () => {
    const scheduledAt = getRequirementReminderScheduledAt(new Date('2026-03-09T16:00:00.000Z'), 1);

    expect(scheduledAt.toISOString()).toBe('2026-03-08T13:00:00.000Z');
  });

  it('schedules seven days before at 9 a.m. Eastern across the spring DST transition', () => {
    const scheduledAt = getRequirementReminderScheduledAt(new Date('2026-03-15T16:00:00.000Z'), 7);

    expect(scheduledAt.toISOString()).toBe('2026-03-08T13:00:00.000Z');
  });

  it('uses the Eastern calendar date when the due timestamp is on a different UTC date', () => {
    const scheduledAt = getRequirementReminderScheduledAt(new Date('2026-03-09T01:00:00.000Z'), 1);

    expect(scheduledAt.toISOString()).toBe('2026-03-07T14:00:00.000Z');
  });

  it('schedules seven calendar days before at 9 a.m. Eastern across the fall DST transition', () => {
    const scheduledAt = getRequirementReminderScheduledAt(new Date('2026-11-08T17:00:00.000Z'), 7);

    expect(scheduledAt.toISOString()).toBe('2026-11-01T14:00:00.000Z');
  });

  it('schedules one day before at 9 a.m. Eastern across the fall DST transition', () => {
    const scheduledAt = getRequirementReminderScheduledAt(new Date('2026-11-01T17:00:00.000Z'), 1);

    expect(scheduledAt.toISOString()).toBe('2026-10-31T13:00:00.000Z');
  });

  it('rejects a due timestamp that is not valid', () => {
    expect(() => getRequirementReminderScheduledAt(new Date(Number.NaN), 1)).toThrow(RangeError);
  });
});
