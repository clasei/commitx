<template>
  <div class="week-header">
    <div class="week-nav">
      <button class="nav-btn nav-arrow" @click="$emit('prev')" aria-label="Previous week">
        <ChevronLeft :size="8" />
      </button>

      <div class="week-info">
        <h1 class="week-title">{{ weekTitle }}</h1>
      </div>

      <button class="nav-btn nav-arrow" @click="$emit('next')" aria-label="Next week">
        <ChevronRight :size="8" />
      </button>
    </div>

    <div class="week-actions">
      <button
        class="action-btn"
        :class="{ 'is-disabled': isCurrentWeek }"
        :disabled="isCurrentWeek"
        @click="$emit('today')"
        aria-label="Go to current week"
      >
        <Circle :size="16" />
      </button>

      <button class="action-btn" @click="$emit('stats')" aria-label="View stats">
        <BarChart3 :size="16" />
      </button>

      <button class="action-btn" @click="$emit('menu')" aria-label="Export data">
        <Download :size="16" />
      </button>

      <button class="action-btn" @click="$emit('add')" aria-label="Add habit">
        <Plus :size="16" />
      </button>
    </div>
  </div>

  <div class="day-labels">
    <div class="day-label-spacer"></div>
    <div class="day-labels-grid">
      <div v-for="day in weekDays" :key="toDateKey(day)" class="day-label-container">
        <span class="day-label">{{ getDayLabel(day) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronLeft, ChevronRight, Plus, Download, Circle, BarChart3 } from 'lucide-vue-next';
import { toDateKey, getDayLabel } from '../utils/dateUtils';

defineProps<{
  weekTitle: string;
  weekDays: Date[];
  isCurrentWeek: boolean;
}>();

defineEmits<{
  prev: [];
  next: [];
  today: [];
  add: [];
  menu: [];
  stats: [];
}>();
</script>

<style scoped>
.week-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  margin-bottom: 32px;
}

.week-nav {
  display: flex;
  align-items: center;
  gap: 4px;
  padding-right: 22px;
}

.week-info {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 150px;
  justify-content: center;
}

.week-title {
  font-size: 14px;
  font-weight: 600;
  color: #c9d1d9;
  margin: 0;
  white-space: nowrap;
}

.week-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.nav-btn,
.action-btn {
  background: transparent;
  border: 1px solid #30363d;
  border-radius: 6px;
  color: #9da7b3;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  padding: 6px;
}

.nav-btn:hover,
.action-btn:hover {
  background: #21262d;
  border-color: #484f58;
  color: #c9d1d9;
}

.action-btn.is-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.action-btn.is-disabled:hover {
  background: transparent;
  border-color: #30363d;
  color: #9da7b3;
}

.nav-arrow {
  min-width: 10px;
  min-height: 10px;
  padding: 2px;
}

.day-labels {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  padding: 0;
}

.day-label-spacer {
  width: 70px;
  margin-right: 22px;
  flex-shrink: 0;
}

.day-labels-grid {
  display: flex;
  gap: 16px;
  flex: 1;
}

.day-label-container {
  width: 24px;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
}

.day-label {
  font-size: 13px;
  font-weight: 600;
  color: #6e7681;
  text-align: center;
  letter-spacing: 0.3px;
}

@media (min-width: 640px) {
  .week-header {
    padding: 10px 0;
    margin-bottom: 32px;
  }

  .week-nav {
    gap: 10px;
  }

  .week-info {
    min-width: 140px;
  }

  .week-title {
    font-size: 12px;
  }

  .week-actions {
    gap: 8px;
  }

  .nav-arrow {
    min-width: 24px;
    min-height: 24px;
  }
}

@media (min-width: 1024px) {
  .week-header {
    padding: 14px 0;
    margin-bottom: 40px;
  }

  .week-info {
    min-width: 180px;
  }

  .week-title {
    font-size: 15px;
  }

  .day-labels-grid {
    gap: 20px;
  }
}
</style>









