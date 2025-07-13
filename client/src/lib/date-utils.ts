import { formatDistanceToNow, format, isToday, isYesterday, isThisYear } from 'date-fns';

/**
 * Format a date/timestamp to display in the user's local timezone
 */
export function formatLocalDateTime(timestamp: string | Date): string {
  const date = new Date(timestamp);
  
  if (isToday(date)) {
    return format(date, 'h:mm a'); // "2:30 PM"
  }
  
  if (isYesterday(date)) {
    return `Yesterday ${format(date, 'h:mm a')}`; // "Yesterday 2:30 PM"
  }
  
  if (isThisYear(date)) {
    return format(date, 'MMM d, h:mm a'); // "Jan 15, 2:30 PM"
  }
  
  return format(date, 'MMM d, yyyy, h:mm a'); // "Jan 15, 2024, 2:30 PM"
}

/**
 * Format a date for conversation list display
 */
export function formatConversationTime(timestamp: string | Date): string {
  const date = new Date(timestamp);
  
  if (isToday(date)) {
    return format(date, 'h:mm a');
  }
  
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  
  if (isThisYear(date)) {
    return format(date, 'MMM d');
  }
  
  return format(date, 'MMM d, yyyy');
}

/**
 * Format relative time (e.g., "2 hours ago") but respecting local timezone
 */
export function formatRelativeTime(timestamp: string | Date): string {
  const date = new Date(timestamp);
  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Format date for analytics and detailed views
 */
export function formatDetailedDateTime(timestamp: string | Date): string {
  const date = new Date(timestamp);
  return format(date, 'MMM d, yyyy h:mm:ss a');
}

/**
 * Get user's timezone
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Format date range for analytics
 */
export function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isToday(end) && isToday(start)) {
    return 'Today';
  }
  
  if (isYesterday(start) && isToday(end)) {
    return 'Yesterday - Today';
  }
  
  if (isThisYear(start) && isThisYear(end)) {
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`;
  }
  
  return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
}