import Dexie, { type Table } from 'dexie';

export interface Habit {
  id: string;
  name: string;
  iconName?: string;
  color?: string;
  targetPerWeek: number;
  sortOrder: number;
  createdAt: number;
  updatedAt?: number;
  archivedAt?: number;
}

export interface HabitEntry {
  id?: number;
  habitId: string;
  dateKey: string;
  value: 1;
  updatedAt: number;
}

export class CommitxDB extends Dexie {
  habits!: Table<Habit, string>;
  habitEntries!: Table<HabitEntry, number>;

  constructor() {
    super('commitx');
    
    this.version(1).stores({
      habits: 'id, sortOrder, archivedAt',
      habitEntries: '++id, [habitId+dateKey], dateKey, habitId'
    });
  }
}

export const db = new CommitxDB();

