/**
 * Date Utility Module
 *
 * Provides calendar date validation and local-time future date checks.
 */

/**
 * Returns today's date in local time as a YYYY-MM-DD string.
 */
export function getLocalTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Validates that an input string represents an existing, real calendar date in YYYY-MM-DD format.
 * Correctly rejects impossible dates like "2026-02-31" or "2026-04-31".
 */
export function isValidCalendarDate(dateString: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return false;
  }

  const [yearStr = '', monthStr = '', dayStr = ''] = dateString.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (month < 1 || month > 12) {
    return false;
  }

  // Construct a date using explicit local parts
  const dateObj = new Date(year, month - 1, day);

  // If the date wrapped (e.g. Feb 31 became March 3), the parts won't match
  return (
    dateObj.getFullYear() === year &&
    dateObj.getMonth() === month - 1 &&
    dateObj.getDate() === day
  );
}

/**
 * Checks whether a given YYYY-MM-DD date string is in the future relative to local today.
 */
export function isFutureDate(dateString: string, todayString: string = getLocalTodayString()): boolean {
  return dateString > todayString;
}
