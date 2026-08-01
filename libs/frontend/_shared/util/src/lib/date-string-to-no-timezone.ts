export const dateStringToNoTimezone = (dateString: string): Date => {
  // Extract the date part without timezone information
  const datePartWithoutTimezone = dateString.split('T')[0];

  // Split the date string into components
  const [yearStr, monthStr, dayStr] = datePartWithoutTimezone.split('-');

  // Parse components as integers
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // Months are zero-based in JavaScript Date objects
  const day = parseInt(dayStr, 10);

  // Create a Date object with the components
  const date = new Date(year, month, day);

  // If you want to ensure that the time part is set to 00:00:00 in the local timezone
  date.setHours(0, 0, 0, 0);

  return date;
};
