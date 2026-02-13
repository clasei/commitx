<template>
  <div class="habit-row" :class="{ 'is-completed': goalReached }">
    <button
      class="habit-label"
      :style="{ backgroundColor: iconBgColor }"
      @click="$emit('edit', habit)"
      type="button"
    >
      <span class="habit-name" :style="{ color: textColor }">{{ habit.name }}</span>
    </button>

    <div class="habit-grid">
      <DayCell
        v-for="day in weekDays"
        :key="toDateKey(day)"
        :isDone="isDone(habit.id, toDateKey(day))"
        :isToday="isToday(day)"
        :dayLabel="getDayLabel(day)"
        :iconColor="goalReached ? habit.color : undefined"
        @toggle="onToggle(habit.id, toDateKey(day))"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { type Habit } from '../db/database';
import { toDateKey, getDayLabel, isToday as checkIsToday } from '../utils/dateUtils';
import { isDone as checkIsDone, isGoalReached, toggleEntry } from '../stores/habitStore';
import DayCell from './DayCell.vue';

const props = defineProps<{
  habit: Habit;
  weekDays: Date[];
}>();

defineEmits<{
  edit: [habit: Habit];
}>();

const goalReached = computed(() => isGoalReached(props.habit));


const iconBgColor = computed(() => {
  if (goalReached.value && props.habit.color) {
    return props.habit.color;
  }
  return '#30363d';
});

const textColor = computed(() => {
  if (goalReached.value && props.habit.color) {
    return '#1f2428';
  }
  return '#c9d1d9';
});

function isDone(habitId: string, dateKey: string) {
  return checkIsDone(habitId, dateKey);
}

function isToday(date: Date) {
  return checkIsToday(date);
}

async function onToggle(habitId: string, dateKey: string) {
  await toggleEntry(habitId, dateKey);
}
</script>

<style scoped>
.habit-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
}

.habit-label {
  width: 50px;
  min-width: 50px;
  max-width: 50px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #21262d;
  transition: all 0.2s ease;
  padding: 0 6px;
  border: none;
  cursor: pointer;
  font-family: inherit;
}

.habit-label:hover {
  opacity: 0.85;
  transform: scale(1.02);
}

.habit-label:active {
  transform: scale(0.98);
}

.habit-name {
  font-size: 9px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1;
  text-align: center;
  width: 100%;
}

.habit-grid {
  display: flex;
  gap: 5px;
  flex: 1;
}

@media (min-width: 640px) {
  .habit-row {
    gap: 12px;
  }

  .habit-label {
    width: 70px;
    min-width: 70px;
    max-width: 70px;
    height: 28px;
    border-radius: 5px;
    padding: 0 8px;
  }

  .habit-name {
    font-size: 11px;
  }

  .habit-grid {
    gap: 6px;
  }
}

@media (min-width: 1024px) {
  .habit-row {
    gap: 14px;
  }

  .habit-label {
    width: 80px;
    min-width: 80px;
    max-width: 80px;
    height: 32px;
    border-radius: 6px;
    padding: 0 10px;
  }

  .habit-name {
    font-size: 12px;
  }

  .habit-grid {
    gap: 8px;
  }
}
</style>









