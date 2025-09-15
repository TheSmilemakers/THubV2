import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date Formatting Helpers
/**
 * Convert date to ISO date string (YYYY-MM-DD)
 */
export function toISODate(date: Date | string | number): string {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

/**
 * Format relative time (e.g., "2 hours ago", "in 5 minutes")
 */
export function formatRelativeTime(date: Date | string | number): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = now - then;
  const absDiff = Math.abs(diff);
  
  const seconds = Math.floor(absDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  
  if (days > 0) {
    return rtf.format(diff > 0 ? -days : days, 'day');
  } else if (hours > 0) {
    return rtf.format(diff > 0 ? -hours : hours, 'hour');
  } else if (minutes > 0) {
    return rtf.format(diff > 0 ? -minutes : minutes, 'minute');
  } else {
    return rtf.format(diff > 0 ? -seconds : seconds, 'second');
  }
}

// Number Formatting Helpers
/**
 * Format price with appropriate decimal places
 */
export function formatPrice(price: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(price);
}

/**
 * Format percentage with + or - sign
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format large numbers with abbreviations (1.2K, 3.4M, etc.)
 */
export function formatVolume(num: number): string {
  if (num >= 1e9) {
    return `${(num / 1e9).toFixed(2)}B`;
  } else if (num >= 1e6) {
    return `${(num / 1e6).toFixed(2)}M`;
  } else if (num >= 1e3) {
    return `${(num / 1e3).toFixed(1)}K`;
  }
  return num.toString();
}

// Symbol Validation Helpers
/**
 * Check if symbol is valid (alphanumeric, 1-5 characters)
 */
export function isValidSymbol(symbol: string): boolean {
  return /^[A-Z0-9]{1,5}$/.test(symbol.toUpperCase());
}

/**
 * Normalize symbol to uppercase and remove whitespace
 */
export function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

// Market Hours Helpers
/**
 * Check if US market is currently open
 * Market hours: 9:30 AM - 4:00 PM EST, Monday-Friday
 */
export function isMarketOpen(): boolean {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcMinute = now.getUTCMinutes();
  const day = now.getUTCDay();
  
  // Convert to EST/EDT (simplified - doesn't account for DST perfectly)
  const isDST = isDaylightSavingTime(now);
  const estHour = utcHour - (isDST ? 4 : 5);
  const totalMinutes = estHour * 60 + utcMinute;
  
  // Market hours in minutes from midnight
  const marketOpen = 9 * 60 + 30;  // 9:30 AM
  const marketClose = 16 * 60;      // 4:00 PM
  
  // Check if weekend
  if (day === 0 || day === 6) return false;
  
  // Check if within market hours
  return totalMinutes >= marketOpen && totalMinutes < marketClose;
}

/**
 * Get next market open time
 */
export function getNextMarketOpen(): Date {
  const now = new Date();
  const next = new Date(now);
  
  // If market is open, return current time
  if (isMarketOpen()) return now;
  
  // Set to 9:30 AM EST
  const isDST = isDaylightSavingTime(next);
  next.setUTCHours(isDST ? 13 : 14, 30, 0, 0);
  
  // If it's after 4 PM, move to next day
  if (now > next) {
    next.setDate(next.getDate() + 1);
  }
  
  // Skip weekends
  while (next.getDay() === 0 || next.getDay() === 6) {
    next.setDate(next.getDate() + 1);
  }
  
  return next;
}

/**
 * Simple DST check (US rules)
 */
function isDaylightSavingTime(date: Date): boolean {
  const year = date.getFullYear();
  
  // DST starts second Sunday in March
  const dstStart = new Date(year, 2, 1);
  dstStart.setDate(14 - dstStart.getDay());
  
  // DST ends first Sunday in November  
  const dstEnd = new Date(year, 10, 1);
  dstEnd.setDate(7 - dstEnd.getDay());
  
  return date >= dstStart && date < dstEnd;
}

// Performance Helpers
/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Sleep function for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}