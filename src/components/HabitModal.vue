<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click="close">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">{{ title }}</h2>
          <button class="close-btn" @click="close" aria-label="Close">
            <X :size="20" />
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="modal-form">
          <div class="form-group">
            <label for="habit-name">habit name</label>
            <input
              id="habit-name"
              v-model="formData.name"
              type="text"
              placeholder="e.g., workout, read, code, be batman"
              required
              autofocus
            />
          </div>

          <div class="form-group">
            <label for="habit-target">weekly target</label>
            <input
              id="habit-target"
              v-model.number="formData.targetPerWeek"
              type="number"
              min="1"
              max="7"
              required
            />
          </div>

          <div class="form-group">
            <label>success color</label>
            <div class="color-picker">
              <button
                v-for="color in colors"
                :key="color"
                type="button"
                class="color-option"
                :class="{ 'is-selected': formData.color === color }"
                :style="{ backgroundColor: color }"
                @click="formData.color = color"
                :aria-label="`Select ${color}`"
              />
            </div>
          </div>

          <div class="form-actions">
            <button
              v-if="editMode"
              type="button"
              class="btn btn-delete"
              @click="handleDelete"
            >
              delete
            </button>
            <button
              v-else
              type="button"
              class="btn btn-import"
              @click="triggerImport"
              aria-label="Import data"
            >
              <Upload :size="16" />
            </button>
            <div class="form-actions-right">
              <button type="button" class="btn btn-secondary" @click="close">
                cancel
              </button>
              <button type="submit" class="btn btn-primary">
                {{ submitLabel }}
              </button>
            </div>
          </div>

          <input
            ref="fileInput"
            type="file"
            accept="application/json"
            style="display: none"
            @change="handleFileSelect"
          />
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { X, Upload } from 'lucide-vue-next';

const props = defineProps<{
  isOpen: boolean;
  title?: string;
  submitLabel?: string;
  editMode?: boolean;
  habitData?: { id: string; name: string; targetPerWeek: number; color?: string };
}>();

const emit = defineEmits<{
  close: [];
  submit: [data: { name: string; targetPerWeek: number; color?: string }];
  delete: [];
  import: [file: File];
}>();

const fileInput = ref<HTMLInputElement | null>(null);

// Colorful palette (commented out - using blue scale instead)
// const colors = [
//   '#6b9bd1', // medium blue
//   '#88c0d0', // ice blue
//   '#8fbc8f', // sage green
//   '#e5c07b', // warm yellow
//   '#d9a5b3', // soft pink
//   '#c97676', // coral red
// ];

// Blue scale palette (light to dark)
const colors = [
  '#c2e3f0', // lightest blue
  '#a5d4e5', // light blue
  '#88c0d0', // ice blue
  '#6b9bd1', // medium blue
  '#5b7a9c', // dark blue
  '#4a5e7a', // darkest blue-grey
];

const formData = ref({
  name: '',
  targetPerWeek: 3,
  color: colors[0]
});

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    if (props.editMode && props.habitData) {
      // Edit mode: populate with existing data
      formData.value = {
        name: props.habitData.name,
        targetPerWeek: props.habitData.targetPerWeek,
        color: props.habitData.color || colors[0]
      };
    } else {
      // Create mode: reset to defaults
      formData.value = {
        name: '',
        targetPerWeek: 3,
        color: colors[0]
      };
    }
  }
});

function close() {
  emit('close');
}

function handleSubmit() {
  emit('submit', { ...formData.value });
  close();
}

function handleDelete() {
  if (confirm('delete this habit and all its data? this cannot be undone.')) {
    emit('delete');
    close();
  }
}

function triggerImport() {
  fileInput.value?.click();
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    emit('import', file);
    close();
    // Reset input
    target.value = '';
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal-content {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 18px;
  border-bottom: 1px solid #30363d;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #e6edf3;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #9da7b3;
  display: flex;
  align-items: center;
  border-radius: 4px;
  transition: all 0.15s ease;
  min-width: 28px;
  min-height: 28px;
}

.close-btn:hover {
  background: #30363d;
  color: #e6edf3;
}

.modal-form {
  padding: 18px;
  padding-bottom: 22px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group:last-of-type {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #9da7b3;
  margin-bottom: 6px;
}

.form-group input {
  width: 100%;
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 14px;
  color: #e6edf3;
  font-family: inherit;
  transition: border-color 0.15s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #58a6ff;
}

.color-picker {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.color-option {
  width: 38px;
  height: 38px;
  border-radius: 6px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
}

.color-option:hover {
  transform: scale(1.05);
}

.color-option.is-selected {
  border-color: #e6edf3;
  box-shadow: 0 0 0 2px #0d1117;
}

.form-actions {
  display: flex;
  gap: 8px;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
}

.form-actions-right {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 10px 18px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid;
  font-family: inherit;
  min-height: 40px;
}

.btn-secondary {
  background: transparent;
  border-color: #30363d;
  color: #9da7b3;
}

.btn-secondary:hover {
  background: #30363d;
  border-color: #484f58;
  color: #e6edf3;
}

.btn-primary {
  background: #30363d;
  border-color: #484f58;
  color: #e6edf3;
}

.btn-primary:hover {
  background: #484f58;
  border-color: #6e7681;
  color: #ffffff;
}

.btn-delete {
  background: transparent;
  border-color: #5a3232;
  color: #b97a7a;
}

.btn-delete:hover {
  background: #3d2626;
  border-color: #6e3a3a;
  color: #d9a5a5;
}

.btn-import {
  background: transparent;
  border-color: #30363d;
  color: #9da7b3;
  min-width: 40px;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-import:hover {
  background: #30363d;
  border-color: #484f58;
  color: #e6edf3;
}

.btn:active {
  transform: scale(0.97);
}

@media (min-width: 640px) {
  .modal-overlay {
    padding: 20px;
  }

  .modal-content {
    border-radius: 10px;
    max-width: 420px;
  }

  .modal-header {
    padding: 18px 22px;
  }

  .modal-title {
    font-size: 17px;
  }

  .modal-form {
    padding: 22px;
    padding-bottom: 26px;
  }

  .form-group {
    margin-bottom: 18px;
  }

  .form-group:last-of-type {
    margin-bottom: 22px;
  }

  .form-group label {
    font-size: 13px;
    margin-bottom: 8px;
  }

  .color-option {
    width: 40px;
    height: 40px;
    border-radius: 8px;
  }

  .btn {
    padding: 8px 16px;
    font-size: 14px;
  }
}
</style>



