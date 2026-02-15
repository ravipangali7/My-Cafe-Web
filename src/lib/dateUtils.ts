/**
 * Format a Date as YYYY-MM-DD in the user's local timezone.
 * Use this for "today" / "yesterday" filters so the date matches the user's calendar.
 */
export function getLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
