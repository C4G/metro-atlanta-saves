export const REQUIREMENT_REMINDER_TIME_ZONE = 'America/New_York';
export type RequirementReminderOffset = 1 | 7;

const easternPartsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: REQUIREMENT_REMINDER_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

function zonedParts(value: Date): Record<string, number> {
  return Object.fromEntries(
    easternPartsFormatter.formatToParts(value).map(({ type, value: part }) => [type, Number(part)]),
  );
}

/**
 * Resolve 9:00 a.m. in the Eastern time zone on the calendar date `offset`
 * days before `dueAt`. Calendar arithmetic is performed independently of
 * UTC offsets so a daylight-saving transition does not move the local send
 * time.
 */
export function getRequirementReminderScheduledAt(dueAt: Date, offset: RequirementReminderOffset): Date {
  if (!Number.isFinite(dueAt.getTime())) {
    throw new RangeError('A valid requirement due timestamp is required');
  }

  if (offset !== 1 && offset !== 7) {
    throw new RangeError('Requirement reminder offset must be either 1 or 7 days');
  }

  const dueParts = zonedParts(dueAt);
  const dueLocalDateAsUtc = Date.UTC(dueParts['year'], dueParts['month'] - 1, dueParts['day']);
  const targetDate = new Date(dueLocalDateAsUtc - offset * 24 * 60 * 60 * 1000);
  const targetLocalAsUtc = Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate(), 9);

  // Resolve the requested wall-clock time by correcting the difference
  // between its UTC-shaped representation and its Eastern representation.
  // 9 a.m. is outside Eastern's DST transition gap and overlap.
  let candidateUtc = targetLocalAsUtc;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const candidateParts = zonedParts(new Date(candidateUtc));
    const representedLocalAsUtc = Date.UTC(
      candidateParts['year'],
      candidateParts['month'] - 1,
      candidateParts['day'],
      candidateParts['hour'],
      candidateParts['minute'],
      candidateParts['second'],
    );
    const difference = representedLocalAsUtc - targetLocalAsUtc;
    if (difference === 0) {
      break;
    }
    candidateUtc -= difference;
  }

  return new Date(candidateUtc);
}
