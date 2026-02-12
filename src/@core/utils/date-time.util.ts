/**
 * Returns a relative time string for a given ISO date string.
 * e.g. "just now", "5 minutes ago", "2 hours ago", "yesterday"
 */
export function formatRelativeTime(isoString: string, locale: string = 'en-KE'): string {
  if (!isoString) return '-';

  const date = new Date(isoString);
  const now = new Date();

  const secondsDiff = Math.floor((date.getTime() - now.getTime()) / 1000);
  const minutesDiff = Math.floor(secondsDiff / 60);
  const hoursDiff = Math.floor(secondsDiff / 3600);
  const daysDiff = Math.floor(secondsDiff / 86400);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (Math.abs(secondsDiff) < 60) {
    return 'just now';
  } else if (Math.abs(minutesDiff) < 60) {
    return rtf.format(minutesDiff, 'minute');
  } else if (Math.abs(hoursDiff) < 24) {
    return rtf.format(hoursDiff, 'hour');
  } else if (Math.abs(daysDiff) < 7) {
    return rtf.format(daysDiff, 'day');
  } else {
    // For older dates, fallback to formatted date
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  }
}

export function formatDateTime(
  isoString: string,
  locale: string = 'en-KE',
  options?: Intl.DateTimeFormatOptions
): string {
  if (!isoString) return '-';

  const date = new Date(isoString);

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  };

  return new Intl.DateTimeFormat(locale, options ?? defaultOptions).format(date);
}

export const formatDateLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
