/**
 * Timezone utilities to ensure consistent timestamp handling
 */

/**
 * Get current time as UTC Date object
 * This ensures consistency across the application regardless of user's timezone
 */
export function getCurrentLocalTime(): Date {
  // Force UTC by creating date from UTC string
  return new Date(new Date().toISOString());
}

/**
 * Get current time as UTC ISO string
 * This is the recommended way to store timestamps in database
 */
export function getCurrentUTCTime(): string {
  return new Date().toISOString();
}

/**
 * Get current time as epoch milliseconds
 * This is timezone-agnostic and ensures consistency
 */
export function getCurrentEpoch(): number {
  return Date.now();
}

/**
 * Convert epoch milliseconds to Date object
 * This handles timezone conversion correctly
 */
export function epochToDate(epoch: number): Date {
  return new Date(epoch);
}

/**
 * Convert a Date object to local time string for database storage
 * This ensures the timestamp is stored in the correct timezone
 */
export function toLocalTimeString(date: Date): string {
  // Get the local timezone offset in minutes
  const timezoneOffset = date.getTimezoneOffset();

  // Create a new date adjusted for local timezone
  const localDate = new Date(date.getTime() - timezoneOffset * 60000);

  return localDate.toISOString();
}

/**
 * Convert an ISO string to local Date object
 * This handles timezone conversion correctly
 */
export function fromLocalTimeString(isoString: string): Date {
  return new Date(isoString);
}

/**
 * Get current time as ISO string in local timezone
 * This is used for consistent timestamp storage
 */
export function getCurrentLocalTimeISO(): string {
  return getCurrentLocalTime().toISOString();
}

/**
 * Convert UTC timestamp to user's local timezone for display
 * @param utcTimestamp - UTC timestamp (ISO string or Date object)
 * @param userTimezone - User's timezone (e.g., 'America/New_York', 'Europe/London')
 * @returns Formatted date string in user's timezone
 */
export function formatTimestampForUser(
  utcTimestamp: string | Date,
  userTimezone?: string,
): string {
  const date =
    typeof utcTimestamp === "string" ? new Date(utcTimestamp) : utcTimestamp;

  if (userTimezone) {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: userTimezone,
    }).format(date);
  }

  // Fallback to user's browser timezone
  return date.toLocaleString();
}

/**
 * Get user's timezone from browser
 * @returns User's timezone (e.g., 'America/New_York')
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
