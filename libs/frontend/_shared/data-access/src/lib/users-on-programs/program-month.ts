export const monthNumber = (name: string) => Number(/^month\s+(\d+)$/i.exec(name.trim())?.[1] ?? 0);

export const monthOfProgram = (startDate: Date | string | null | undefined, today: Date) => {
  if (!startDate) return 1;
  const start = new Date(startDate);
  const elapsed = (today.getFullYear() - start.getFullYear()) * 12 + today.getMonth() - start.getMonth();
  return elapsed + (today.getDate() >= start.getDate() ? 1 : 0);
};
