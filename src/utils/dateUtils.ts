import { format, startOfWeek, addDays, getWeek } from 'date-fns';

export function toDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 0 }); // 0 = Sunday
}

export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function getWeekNumber(date: Date): number {
  return getWeek(date, { weekStartsOn: 0 });
}

export function formatWeekRange(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  const weekNum = getWeekNumber(weekStart);
  const startStr = format(weekStart, 'MMM d').toLowerCase();
  const endStr = format(weekEnd, 'MMM d').toLowerCase();
  return `w${weekNum.toString().padStart(2, '0')} · ${startStr} – ${endStr}`;
}

export function getDayLabel(date: Date): string {
  return format(date, 'EEE').toLowerCase().slice(0, 3);
}

export function isToday(date: Date): boolean {
  const today = new Date();
  return toDateKey(date) === toDateKey(today);
}

export function isSameWeek(date1: Date, date2: Date): boolean {
  return toDateKey(getWeekStart(date1)) === toDateKey(getWeekStart(date2));
}

