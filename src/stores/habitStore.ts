import { ref, computed } from 'vue';
import { db, type Habit } from '../db/database';
import { toDateKey, getWeekStart, getWeekDays } from '../utils/dateUtils';

export const activeWeekStart = ref<Date>(getWeekStart(new Date()));
export const habits = ref<Habit[]>([]);
export const entriesMap = ref<Map<string, Set<string>>>(new Map());
export const isLoading = ref(true);

export const currentWeekDays = computed(() => getWeekDays(activeWeekStart.value));

export async function loadHabits() {
  const allHabits = await db.habits.orderBy('sortOrder').toArray();
  habits.value = allHabits.filter(h => !h.archivedAt);
}

export async function loadEntriesForWeek(weekStart: Date) {
  const days = getWeekDays(weekStart);
  const dateKeys = days.map(toDateKey);

  const entries = await db.habitEntries
    .where('dateKey')
    .anyOf(dateKeys)
    .toArray();

  const map = new Map<string, Set<string>>();
  entries.forEach(entry => {
    if (!map.has(entry.habitId)) {
      map.set(entry.habitId, new Set());
    }
    map.get(entry.habitId)!.add(entry.dateKey);
  });

  entriesMap.value = map;
}

export async function toggleEntry(habitId: string, dateKey: string) {
  const existing = await db.habitEntries
    .where('[habitId+dateKey]')
    .equals([habitId, dateKey])
    .first();

  if (existing) {
    await db.habitEntries.delete(existing.id!);
    entriesMap.value.get(habitId)?.delete(dateKey);
  } else {
    await db.habitEntries.add({
      habitId,
      dateKey,
      value: 1,
      updatedAt: Date.now()
    });
    if (!entriesMap.value.has(habitId)) {
      entriesMap.value.set(habitId, new Set());
    }
    entriesMap.value.get(habitId)!.add(dateKey);
  }
}

export function getDoneCount(habitId: string): number {
  return entriesMap.value.get(habitId)?.size || 0;
}

export function isGoalReached(habit: Habit): boolean {
  return getDoneCount(habit.id) >= habit.targetPerWeek;
}

export function isDone(habitId: string, dateKey: string): boolean {
  return entriesMap.value.get(habitId)?.has(dateKey) || false;
}

export async function initializeApp() {
  isLoading.value = true;
  activeWeekStart.value = getWeekStart(new Date());
  await loadHabits();

  // seed sample habits if empty
  if (habits.value.length === 0) {
    await createHabit('workout', 3, '#a3be8c');
    await createHabit('read', 5, '#88c0d0');
    await createHabit('code', 2, '#b48ead');
  }

  await loadEntriesForWeek(activeWeekStart.value);
  isLoading.value = false;
}

export async function navigateWeek(direction: 'prev' | 'next') {
  const offset = direction === 'prev' ? -7 : 7;
  const newDate = new Date(activeWeekStart.value);
  newDate.setDate(newDate.getDate() + offset);
  activeWeekStart.value = newDate;
  await loadEntriesForWeek(activeWeekStart.value);
}

export async function goToToday() {
  activeWeekStart.value = getWeekStart(new Date());
  await loadEntriesForWeek(activeWeekStart.value);
}

export async function createHabit(name: string, targetPerWeek: number, color?: string, iconName?: string) {
  const id = crypto.randomUUID();
  const maxOrder = habits.value.reduce((max, h) => Math.max(max, h.sortOrder), -1);

  await db.habits.add({
    id,
    name,
    iconName,
    color,
    targetPerWeek,
    sortOrder: maxOrder + 1,
    createdAt: Date.now()
  });

  await loadHabits();
}

export async function updateHabit(id: string, name: string, targetPerWeek: number, color?: string, iconName?: string) {
  await db.habits.update(id, {
    name,
    iconName,
    color,
    targetPerWeek,
    updatedAt: Date.now()
  });

  await loadHabits();
}

export async function deleteHabit(id: string) {
  // Delete all entries for this habit
  await db.habitEntries.where('habitId').equals(id).delete();

  // Delete the habit
  await db.habits.delete(id);

  // Remove from local state
  entriesMap.value.delete(id);

  await loadHabits();
}

export async function exportData() {
  const allHabits = await db.habits.toArray();
  const allEntries = await db.habitEntries.toArray();

  const exportDataObj = {
    version: '0.1.0',
    exportedAt: new Date().toISOString(),
    habits: allHabits,
    entries: allEntries
  };

  const blob = new Blob([JSON.stringify(exportDataObj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `commitx-export-${toDateKey(new Date())}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importData(file: File): Promise<{ success: boolean; message: string; habitsAdded: number; entriesAdded: number }> {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    // Validate structure
    if (!data.habits || !Array.isArray(data.habits)) {
      return { success: false, message: 'Invalid file format: missing habits data', habitsAdded: 0, entriesAdded: 0 };
    }

    let habitsAdded = 0;
    let entriesAdded = 0;

    // Import habits (skip if ID already exists)
    for (const habit of data.habits) {
      const existing = await db.habits.get(habit.id);
      if (!existing) {
        await db.habits.add(habit);
        habitsAdded++;
      }
    }

    // Import entries (skip duplicates based on habitId+dateKey)
    if (data.entries && Array.isArray(data.entries)) {
      for (const entry of data.entries) {
        const existing = await db.habitEntries
          .where('[habitId+dateKey]')
          .equals([entry.habitId, entry.dateKey])
          .first();

        if (!existing) {
          await db.habitEntries.add({
            habitId: entry.habitId,
            dateKey: entry.dateKey,
            value: 1,
            updatedAt: entry.updatedAt || Date.now()
          });
          entriesAdded++;
        }
      }
    }

    // Reload data
    await loadHabits();
    await loadEntriesForWeek(activeWeekStart.value);

    return {
      success: true,
      message: `Successfully imported ${habitsAdded} habit(s) and ${entriesAdded} entry(s)`,
      habitsAdded,
      entriesAdded
    };
  } catch (error) {
    console.error('Import error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to import data',
      habitsAdded: 0,
      entriesAdded: 0
    };
  }
}

export async function getYearlyStats(habitId: string, year: number = new Date().getFullYear()) {
  const weeks: Array<{
    weekStart: Date;
    completions: number;
    target: number;
    goalReached: boolean;
  }> = [];

  // Get the habit to know the target
  const habit = habits.value.find(h => h.id === habitId);
  if (!habit) return weeks;

  // Start from beginning of year
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);

  let currentWeekStart = getWeekStart(yearStart);
  const today = new Date();

  while (currentWeekStart <= yearEnd && currentWeekStart <= today) {
    const weekDays = getWeekDays(currentWeekStart);
    const dateKeys = weekDays.map(toDateKey);

    // Get entries for this week
    const entries = await db.habitEntries
      .where('[habitId+dateKey]')
      .anyOf(dateKeys.map(dk => [habitId, dk]))
      .toArray();

    const completions = entries.length;
    const goalReached = completions >= habit.targetPerWeek;

    weeks.push({
      weekStart: new Date(currentWeekStart),
      completions,
      target: habit.targetPerWeek,
      goalReached
    });

    // Move to next week
    currentWeekStart = new Date(currentWeekStart);
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  }

  return weeks;
}

export async function getAllHabitsYearlyStats(year: number = new Date().getFullYear()) {
  const yearData: Array<{
    habitId: string;
    weeks: Array<{
      weekStart: Date;
      completions: number;
      target: number;
      goalReached: boolean;
    }>;
  }> = [];

  for (const habit of habits.value) {
    const weeks = await getYearlyStats(habit.id, year);
    yearData.push({
      habitId: habit.id,
      weeks
    });
  }

  return yearData;
}

export async function getDailyStreaks(habitId: string) {
  // Get all entries for this habit, sorted by date
  const allEntries = await db.habitEntries
    .where('habitId')
    .equals(habitId)
    .toArray();

  if (allEntries.length === 0) {
    return { currentStreak: 0, longestStreak: 0, totalDays: 0 };
  }

  // Sort entries by date
  const sortedDates = allEntries
    .map(e => e.dateKey)
    .sort((a, b) => a.localeCompare(b))
    .map(dateKey => {
      const parts = dateKey.split('-').map(Number);
      const year = parts[0] ?? 0;
      const month = parts[1] ?? 1;
      const day = parts[2] ?? 1;
      return new Date(year, month - 1, day);
    });

  // Remove duplicates and get unique dates
  const uniqueDates = Array.from(new Set(sortedDates.map(d => d.getTime())))
    .map(t => new Date(t))
    .sort((a, b) => a.getTime() - b.getTime());

  const totalDays = uniqueDates.length;

  // Calculate longest streak
  let longestStreak = 1;
  let currentStreakCount = 1;

  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDate = uniqueDates[i - 1];
    const currDate = uniqueDates[i];

    if (!prevDate || !currDate) continue;

    // Check if dates are consecutive (difference of 1 day)
    const diffTime = currDate.getTime() - prevDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      currentStreakCount++;
      longestStreak = Math.max(longestStreak, currentStreakCount);
    } else {
      currentStreakCount = 1;
    }
  }

  // Calculate current streak (from today backwards)
  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Start from today and go backwards
  let checkDate = new Date(today);

  while (true) {
    const dateKey = toDateKey(checkDate);
    const hasEntry = allEntries.some(e => e.dateKey === dateKey);

    if (hasEntry) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      // Check if we should look at yesterday (maybe user hasn't completed today yet)
      if (currentStreak === 0 && checkDate.getTime() === today.getTime()) {
        checkDate.setDate(checkDate.getDate() - 1);
        continue;
      }
      break;
    }
  }

  return { currentStreak, longestStreak, totalDays };
}




