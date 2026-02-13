<template>
  <div class="habit-row" :class="{ 'is-completed': goalReached }">
    <div class="habit-icon" :style="{ backgroundColor: iconBgColor }">
      <component v-if="iconComponent" :is="iconComponent" :size="14" :stroke-width="2.5" />
      <span v-else class="icon-fallback">{{ habit.name[0]?.toUpperCase() || 'H' }}</span>
    </div>

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
import { computed, defineAsyncComponent } from 'vue';
import { type Habit } from '../db/database';
import { toDateKey, getDayLabel, isToday as checkIsToday } from '../utils/dateUtils';
import { isDone as checkIsDone, isGoalReached, toggleEntry } from '../stores/habitStore';
import DayCell from './DayCell.vue';

const props = defineProps<{
  habit: Habit;
  weekDays: Date[];
}>();

const goalReached = computed(() => isGoalReached(props.habit));

const iconComponent = computed(() => {
  if (!props.habit.iconName) return null;
  return defineAsyncComponent(() =>
    import('lucide-vue-next').then((module) => {
      const iconName = props.habit.iconName as string;
      const component = (module as any)[iconName];
      return component || null;
    }).catch(() => null)
  );
});

const iconBgColor = computed(() => {
  if (goalReached.value && props.habit.color) {
    return props.habit.color;
  }
  return '#21262d';
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
  gap: 5px;
  padding: 2px 0;
}

.habit-icon {
  width: 26px;
  height: 26px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #21262d;
  transition: all 0.2s ease;
  color: #9da7b3;
}

.is-completed .habit-icon {
  color: #ffffff;
}

.icon-fallback {
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
}

.habit-grid {
  display: flex;
  gap: 3px;
  flex: 1;
}

@media (min-width: 640px) {
  .habit-row {
    gap: 6px;
    padding: 3px 0;
  }

  .habit-icon {
    width: 28px;
    height: 28px;
    border-radius: 5px;
  }

  .icon-fallback {
    font-size: 12px;
  }

  .habit-grid {
    gap: 4px;
  }
}

@media (min-width: 1024px) {
  .habit-row {
    gap: 8px;
    padding: 4px 0;
  }

  .habit-icon {
    width: 32px;
    height: 32px;
    border-radius: 6px;
  }

  .icon-fallback {
    font-size: 13px;
  }

  .habit-grid {
    gap: 5px;
  }
}
</style>

