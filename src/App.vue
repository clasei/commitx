<template>
  <div class="app">
    <div class="container">
      <WeekHeader
        :weekTitle="weekTitle"
        :weekDays="currentWeekDays"
        :isCurrentWeek="isCurrentWeek"
        @prev="handlePrevWeek"
        @next="handleNextWeek"
        @today="handleToday"
        @add="showAddModal = true"
        @menu="handleExport"
        @stats="handleShowStats"
      />

      <div v-if="isLoading" class="loading">
        loading...
      </div>

      <div v-else-if="habits.length === 0" class="empty-state">
        <div class="empty-content">
          <Target :size="48" :stroke-width="1.5" />
          <h2>no habits yet</h2>
          <p>tap the + button to create your first habit</p>
        </div>
      </div>

      <div v-else class="habits-grid">
        <HabitRow
          v-for="habit in habits"
          :key="habit.id"
          :habit="habit"
          :weekDays="currentWeekDays"
          @edit="handleEditHabit"
        />
      </div>
    </div>

    <HabitModal
      :isOpen="showAddModal"
      title="new habit"
      submitLabel="create"
      @close="showAddModal = false"
      @submit="handleCreateHabit"
      @import="handleImportData"
    />

    <HabitModal
      :isOpen="showEditModal"
      title="edit habit"
      submitLabel="save"
      editMode
      :habitData="editingHabit ?? undefined"
      @close="handleCloseEditModal"
      @submit="handleUpdateHabit"
      @delete="handleDeleteHabit"
    />

    <StatsModal
      :isOpen="showStatsModal"
      :habits="habits"
      :yearData="yearData"
      :streakData="streakData"
      @close="showStatsModal = false"
      @changeHabit="handleChangeStatsHabit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Target } from 'lucide-vue-next';
import WeekHeader from './components/WeekHeader.vue';
import HabitRow from './components/HabitRow.vue';
import HabitModal from './components/HabitModal.vue';
import StatsModal from './components/StatsModal.vue';
import {
  habits,
  activeWeekStart,
  currentWeekDays,
  isLoading,
  initializeApp,
  navigateWeek,
  goToToday,
  createHabit,
  updateHabit,
  deleteHabit,
  exportData,
  importData,
  getAllHabitsYearlyStats,
  getDailyStreaks
} from './stores/habitStore';
import { formatWeekRange, isSameWeek } from './utils/dateUtils';
import type { Habit } from './db/database';

const showAddModal = ref(false);
const showEditModal = ref(false);
const showStatsModal = ref(false);
const editingHabit = ref<{ id: string; name: string; targetPerWeek: number; color?: string } | null>(null);
const yearData = ref<Array<{
  habitId: string;
  weeks: Array<{
    weekStart: Date;
    completions: number;
    target: number;
    goalReached: boolean;
  }>;
}>>([]);
const streakData = ref<Array<{
  habitId: string;
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
}>>([]);

const weekTitle = computed(() => formatWeekRange(activeWeekStart.value));
const isCurrentWeek = computed(() => isSameWeek(activeWeekStart.value, new Date()));

async function handlePrevWeek() {
  await navigateWeek('prev');
}

async function handleNextWeek() {
  await navigateWeek('next');
}

async function handleToday() {
  await goToToday();
}

async function handleCreateHabit(data: { name: string; targetPerWeek: number; color?: string }) {
  await createHabit(data.name, data.targetPerWeek, data.color);
}

function handleEditHabit(habit: Habit) {
  editingHabit.value = {
    id: habit.id,
    name: habit.name,
    targetPerWeek: habit.targetPerWeek,
    color: habit.color
  };
  showEditModal.value = true;
}

async function handleUpdateHabit(data: { name: string; targetPerWeek: number; color?: string }) {
  if (editingHabit.value) {
    await updateHabit(editingHabit.value.id, data.name, data.targetPerWeek, data.color);
  }
}

async function handleDeleteHabit() {
  if (editingHabit.value) {
    await deleteHabit(editingHabit.value.id);
  }
}

function handleCloseEditModal() {
  showEditModal.value = false;
  editingHabit.value = null;
}

function handleExport() {
  exportData();
}

async function handleImportData(file: File) {
  const result = await importData(file);
  if (result.success) {
    alert(result.message);
  } else {
    alert(`Import failed: ${result.message}`);
  }
}

async function handleShowStats() {
  showStatsModal.value = true;
  yearData.value = await getAllHabitsYearlyStats();

  // Calculate daily streaks for all habits
  const streaks = [];
  for (const habit of habits.value) {
    const streakInfo = await getDailyStreaks(habit.id);
    streaks.push({
      habitId: habit.id,
      ...streakInfo
    });
  }
  streakData.value = streaks;
}

async function handleChangeStatsHabit(habitId: string) {
  // Data is already loaded, no need to reload
  console.log('Stats for habit:', habitId);
}

onMounted(async () => {
  await initializeApp();
});
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
  background: #0d1117;
  color: #e6edf3;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
  margin: 0;
  padding: 0;
  display: block;
  min-height: 100vh;
}

.app {
  min-height: 100vh;
  padding: 0;
  max-width: 100vw;
  overflow-x: hidden;
}

.container {
  max-width: 100%;
  margin: 0 auto;
}

.menu-panel {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 6px;
  padding: 4px;
  margin-bottom: 12px;
}

.menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: transparent;
  border: none;
  color: #e6edf3;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s ease;
  text-align: left;
}

.menu-item:hover {
  background: #30363d;
}

.loading {
  text-align: center;
  padding: 30px 16px;
  color: #9da7b3;
  font-size: 13px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 16px;
}

.empty-content {
  text-align: center;
  color: #9da7b3;
}

.empty-content svg {
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-content h2 {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 6px;
  color: #e6edf3;
}

.empty-content p {
  font-size: 13px;
}

.habits-grid {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

@media (min-width: 640px) {
  .app {
    padding: 8px;
  }

  .container {
    max-width: 640px;
  }

  .habits-grid {
    gap: 4px;
  }

  .menu-panel {
    padding: 8px;
    margin-bottom: 20px;
  }
}

@media (min-width: 1024px) {
  .container {
    max-width: 800px;
  }

  .habits-grid {
    gap: 15px;
  }
}
</style>
