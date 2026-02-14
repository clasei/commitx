<template>
  <div class="app">
    <header class="app-header">
      <h1 class="app-title">commitx</h1>
      <div class="header-actions">
        <button
          class="header-btn header-btn-transparent"
          @click="handleImportClick"
          aria-label="Import data"
        >
          <Upload :size="15" />
        </button>
        <button
          class="header-btn header-btn-transparent"
          @click="handleExport"
          aria-label="Export data"
        >
          <Download :size="15" />
        </button>
        <button
          class="header-btn"
          :class="{ 'is-active': isMonochromeMode }"
          @click="toggleMonochrome"
          :aria-label="isMonochromeMode ? 'Switch to colorful mode' : 'Switch to monochrome mode'"
        >
          <Zap :size="15" />
        </button>
      </div>
    </header>

    <input
      ref="importFileInput"
      type="file"
      accept="application/json"
      style="display: none"
      @change="handleFileImport"
    />

    <div class="container">
      <div
        class="main-panel"
        @touchstart="handleTouchStart"
        @touchend="handleTouchEnd"
      >
        <WeekHeader
          :weekTitle="weekTitle"
          :weekDays="currentWeekDays"
          :isCurrentWeek="isCurrentWeek"
          @prev="handlePrevWeek"
          @next="handleNextWeek"
          @today="handleToday"
          @add="showAddModal = true"
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
import { Target, Zap, Upload, Download } from 'lucide-vue-next';
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
const importFileInput = ref<HTMLInputElement | null>(null);

// Check current monochrome mode
const isMonochromeMode = computed(() => {
  return localStorage.getItem('commitx-monochrome') === 'true';
});

// Touch swipe support
let touchStartX = 0;
let touchEndX = 0;

function handleTouchStart(e: TouchEvent) {
  if (e.changedTouches[0]) {
    touchStartX = e.changedTouches[0].screenX;
  }
}

function handleTouchEnd(e: TouchEvent) {
  if (e.changedTouches[0]) {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }
}

function handleSwipe() {
  const swipeThreshold = 50; // minimum distance for swipe
  const diff = touchStartX - touchEndX;

  if (Math.abs(diff) > swipeThreshold) {
    if (diff > 0) {
      // Swiped left - go to next week
      handleNextWeek();
    } else {
      // Swiped right - go to previous week
      handlePrevWeek();
    }
  }
}

async function toggleMonochrome() {
  const currentMode = localStorage.getItem('commitx-monochrome') === 'true';
  const newMode = !currentMode;

  // Define both palettes
  const colorfulPalette = [
    '#6b9bd1', // medium blue
    '#88c0d0', // ice blue
    '#8fbc8f', // sage green
    '#e5c07b', // warm yellow
    '#d9a5b3', // soft pink
    '#c97676', // coral red
  ];

  const bluePalette = [
    '#c2e3f0', // lightest blue
    '#a5d4e5', // light blue
    '#88c0d0', // ice blue
    '#6b9bd1', // medium blue
    '#5b7a9c', // dark blue
    '#4a5e7a', // darkest blue-grey
  ];

  const fromPalette = currentMode ? bluePalette : colorfulPalette;
  const toPalette = currentMode ? colorfulPalette : bluePalette;

  // Function to find closest color match in palette
  function findClosestColorIndex(color: string, palette: string[]): number {
    const index = palette.findIndex(c => c.toLowerCase() === color.toLowerCase());
    if (index !== -1) return index;

    // If exact match not found, try to find closest by comparing hex values
    // For simplicity, default to first color
    return 0;
  }

  // Update all existing habits to new palette
  try {
    const allHabits = habits.value;

    for (const habit of allHabits) {
      if (habit.color) {
        const currentIndex = findClosestColorIndex(habit.color, fromPalette);
        const newColor = toPalette[currentIndex];

        // Update habit color in database
        await updateHabit(habit.id, habit.name, habit.targetPerWeek, newColor);
      }
    }

    // Save new mode preference
    localStorage.setItem('commitx-monochrome', String(newMode));

    // Reload to apply changes across all components
    window.location.reload();
  } catch (error) {
    console.error('Error converting palette:', error);
    alert('Failed to switch palette. Please try again.');
  }
}

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

function handleImportClick() {
  importFileInput.value?.click();
}

async function handleFileImport(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    const result = await importData(file);
    if (result.success) {
      alert(result.message);
    } else {
      alert(`Import failed: ${result.message}`);
    }
    // Reset input
    target.value = '';
  }
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
  padding: 40px 4px 4px;
  padding-top: max(40px, env(safe-area-inset-top));
  max-width: 100vw;
  overflow-x: hidden;
}

.app-header {
  max-width: 640px;
  margin: 0 auto 48px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 8px;
}

.app-title {
  font-size: 20px;
  font-weight: 400;
  color: #9da7b3;
  letter-spacing: 2px;
  text-transform: lowercase;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.header-btn {
  background: transparent;
  border: 1px solid #30363d;
  border-radius: 4px;
  color: #9da7b3;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  min-width: 28px;
  min-height: 28px;
  transition: all 0.2s ease;
}

.header-btn-transparent {
  background: transparent;
  border: none;
  color: #9da7b3;
  min-width: auto;
  min-height: auto;
  padding: 2px;
}

.header-btn-transparent:hover {
  background: transparent;
  border: none;
  color: #c9d1d9;
}

.header-btn:hover {
  background: transparent;
  color: #c9d1d9;
}

.header-btn.is-active {
  background: transparent;
  color: #6e7681;
  fill: #6e7681;
}

.header-btn.is-active:hover {
  background: transparent;
  border-color: #8b949e;
  color: #8b949e;
  fill: #8b949e;
}

.header-btn:active {
  transform: scale(0.95);
}

.container {
  max-width: 100%;
  margin: 0 auto;
}

.main-panel {
  background: rgba(22, 27, 34, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(48, 54, 61, 0.5);
  border-radius: 16px;
  padding: 12px 16px 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  touch-action: pan-x;
  user-select: none;
  -webkit-user-select: none;
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
  gap: 0;
}

@media (min-width: 640px) {
  .app {
    padding: 16px;
  }

  .container {
    max-width: 640px;
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

  .app-header {
    margin-bottom: 50px;
  }
}
</style>
