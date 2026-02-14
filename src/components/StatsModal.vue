<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-content">
          <div class="modal-header">
            <h2>{{ selectedHabit ? selectedHabit.name : 'overview' }}</h2>
            <button class="btn-close" @click="$emit('close')" type="button">×</button>
          </div>

          <div class="habit-selector" v-if="habits.length > 0">
            <button
              v-for="habit in habits"
              :key="habit.id"
              class="habit-option"
              :class="{ active: selectedHabit?.id === habit.id }"
              :style="{ backgroundColor: selectedHabit?.id === habit.id ? habit.color : '#30363d' }"
              @click="selectHabit(habit)"
              type="button"
            >
              <span :style="{ color: selectedHabit?.id === habit.id ? '#1f2428' : '#c9d1d9' }">
                {{ habit.name }}
              </span>
            </button>
          </div>

          <div class="stats-summary" v-if="selectedHabit">
            <div class="stat-card">
              <div class="stat-label">completion rate</div>
              <div class="stat-value">{{ completionRate }}%</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">current streak</div>
              <div class="stat-value">{{ currentStreak }} days</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">longest streak</div>
              <div class="stat-value">{{ longestStreak }} days</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">total days</div>
              <div class="stat-value">{{ totalDays }}</div>
            </div>
          </div>

          <div class="year-grid-container">
            <div class="year-label">{{ currentYear }}</div>
            <div class="year-grid">
              <div
                v-for="(week, index) in yearWeeks"
                :key="index"
                class="year-week"
                :class="{ 'has-completions': week.completions > 0, 'goal-reached': week.goalReached }"
                :style="{ backgroundColor: getWeekColor(week) }"
                :title="getWeekTitle(week)"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { type Habit } from '../db/database';

const props = defineProps<{
  isOpen: boolean;
  habits: Habit[];
  yearData: {
    habitId: string;
    weeks: Array<{
      weekStart: Date;
      completions: number;
      target: number;
      goalReached: boolean;
    }>;
  }[];
  streakData: {
    habitId: string;
    currentStreak: number;
    longestStreak: number;
    totalDays: number;
  }[];
}>();

const emit = defineEmits<{
  close: [];
  changeHabit: [habitId: string];
}>();

const selectedHabit = ref<Habit | null>(null);

const currentYear = computed(() => new Date().getFullYear());

const yearWeeks = computed(() => {
  if (!selectedHabit.value) return [];

  const habitData = props.yearData.find(d => d.habitId === selectedHabit.value?.id);
  return habitData?.weeks || [];
});

const completionRate = computed(() => {
  if (yearWeeks.value.length === 0) return 0;
  const totalWeeks = yearWeeks.value.length;
  const completedWeeks = yearWeeks.value.filter(w => w.goalReached).length;
  return Math.round((completedWeeks / totalWeeks) * 100);
});

const currentStreak = computed(() => {
  if (!selectedHabit.value) return 0;
  const streakInfo = props.streakData.find(d => d.habitId === selectedHabit.value?.id);
  return streakInfo?.currentStreak || 0;
});

const longestStreak = computed(() => {
  if (!selectedHabit.value) return 0;
  const streakInfo = props.streakData.find(d => d.habitId === selectedHabit.value?.id);
  return streakInfo?.longestStreak || 0;
});

const totalDays = computed(() => {
  if (!selectedHabit.value) return 0;
  const streakInfo = props.streakData.find(d => d.habitId === selectedHabit.value?.id);
  return streakInfo?.totalDays || 0;
});

function selectHabit(habit: Habit) {
  selectedHabit.value = habit;
  emit('changeHabit', habit.id);
}

function getWeekColor(week: { completions: number; target: number; goalReached: boolean }): string {
  if (!selectedHabit.value) return '#161b22';

  if (week.goalReached) {
    return selectedHabit.value.color || '#88c0d0';
  }

  if (week.completions > 0) {
    return '#525252';
  }

  return '#161b22';
}

function getWeekTitle(week: { weekStart: Date; completions: number; target: number }): string {
  const dateStr = week.weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${dateStr}: ${week.completions}/${week.target}`;
}

watch(() => props.isOpen, (open) => {
  if (open && props.habits.length > 0 && !selectedHabit.value) {
    const firstHabit = props.habits[0];
    if (firstHabit) {
      selectedHabit.value = firstHabit;
      emit('changeHabit', firstHabit.id);
    }
  }
});

watch(() => props.habits, (newHabits) => {
  if (newHabits.length > 0 && !selectedHabit.value) {
    const firstHabit = newHabits[0];
    if (firstHabit) {
      selectedHabit.value = firstHabit;
    }
  } else if (selectedHabit.value && !newHabits.find(h => h.id === selectedHabit.value?.id)) {
    const firstHabit = newHabits[0];
    selectedHabit.value = firstHabit || null;
  }
}, { immediate: true });
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal-content {
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 8px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 20px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #e6edf3;
  margin: 0;
}

.btn-close {
  background: transparent;
  border: none;
  color: #e6edf3;
  font-size: 32px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s;
}

.btn-close:hover {
  opacity: 0.7;
}

.habit-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.habit-option {
  padding: 6px 12px;
  border-radius: 4px;
  border: none;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.habit-option:hover {
  opacity: 0.85;
  transform: scale(1.02);
}

.habit-option.active {
  box-shadow: 0 0 0 2px #58a6ff;
}

.stats-summary {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.stat-card {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 6px;
  padding: 12px;
  text-align: center;
}

.stat-label {
  font-size: 11px;
  color: #8b949e;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #e6edf3;
}

.year-grid-container {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 6px;
  padding: 16px;
}

.year-label {
  font-size: 14px;
  font-weight: 600;
  color: #e6edf3;
  margin-bottom: 12px;
}

.year-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(8px, 1fr));
  gap: 3px;
  max-width: 100%;
}

.year-week {
  aspect-ratio: 1;
  border-radius: 2px;
  cursor: pointer;
  transition: transform 0.1s;
}

.year-week:hover {
  transform: scale(1.2);
  z-index: 1;
}

@media (min-width: 640px) {
  .modal-content {
    padding: 24px;
  }

  .modal-header h2 {
    font-size: 20px;
  }

  .year-grid {
    grid-template-columns: repeat(52, 1fr);
    gap: 4px;
  }

  .year-week {
    width: 12px;
    height: 12px;
  }
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.2s ease;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.95);
}
</style>




