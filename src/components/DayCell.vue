<template>
  <button
    class="day-cell"
    :class="{ 'is-done': isDone, 'is-today': isToday }"
    :style="isDone && iconColor ? { backgroundColor: iconColor, borderColor: iconColor, borderRadius: '4px' } : {}"
    @click="$emit('toggle')"
    :aria-label="`Toggle ${dayLabel}`"
  >
  </button>
</template>

<script setup lang="ts">
defineProps<{
  isDone: boolean;
  isToday: boolean;
  dayLabel: string;
  iconColor?: string;
}>();

defineEmits<{
  toggle: [];
}>();
</script>

<style scoped>
.day-cell {
  width: 100%;
  aspect-ratio: 1;
  max-width: 24px;
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  padding: 0;
  -webkit-tap-highlight-color: transparent;
}

.day-cell:hover {
  border-color: #484f58;
  transform: scale(1.05);
}

.day-cell:active {
  transform: scale(0.95);
}

.day-cell.is-today {
  border-color: #6e7681;
  border-width: 2px;
}

.day-cell.is-done {
  background: #6e7681aa;
  border-color: #6e7681aa;
}

.day-cell.is-done:hover {
  opacity: 0.85;
}
</style>
