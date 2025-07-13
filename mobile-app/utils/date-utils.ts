/**
 * Format a date/timestamp to display in the user's local timezone
 */
export function formatLocalDateTime(timestamp: string | Date): string {
  const date = new Date(timestamp);
  
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // "2:30 PM"
  }
  
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`; // "Yesterday 2:30 PM"
  }
  
  if (date.getFullYear() === today.getFullYear()) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); // "Jan 15, 2:30 PM"
  }
  
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }); // "Jan 15, 2024, 2:30 PM"
}

/**
 * Format date for conversation list display
 */
export function formatConversationTime(timestamp: string | Date): string {
  const date = new Date(timestamp);
  
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  
  if (date.getFullYear() === today.getFullYear()) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}



/**
 * Format relative time (e.g., "2 hours ago") but respecting local timezone
 */
export function formatRelativeTime(timestamp: string | Date): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks === 1 ? '' : 's'} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`;
}



/**
 * Format date for analytics and detailed views
 */
export function formatDetailedDateTime(timestamp: string | Date): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString([], { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });
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
  const today = new Date();
  
  if (end.toDateString() === today.toDateString() && start.toDateString() === today.toDateString()) {
    return 'Today';
  }
  
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  
  if (start.toDateString() === yesterday.toDateString() && end.toDateString() === today.toDateString()) {
    return 'Yesterday - Today';
  }
  
  if (start.getFullYear() === today.getFullYear() && end.getFullYear() === today.getFullYear()) {
    return `${start.toLocaleDateString([], { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
  }
  
  return `${start.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} - ${end.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`;
}