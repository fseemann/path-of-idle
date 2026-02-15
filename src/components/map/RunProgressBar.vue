<template>
  <div class="run-progress">
    <div class="progress-bar">
      <div
        class="progress-fill"
        :class="{ complete: progress?.isComplete }"
        :style="{ width: `${(progress?.fraction ?? 0) * 100}%` }"
      />
    </div>
    <div class="progress-labels">
      <span v-if="progress?.isComplete" class="complete-text">Complete!</span>
      <span v-else class="time-remaining">{{ formatTime(progress?.remaining ?? 0) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMapRunsStore } from '@/stores'

const props = defineProps<{ runId: string }>()

const mapRunsStore = useMapRunsStore()
const progress = computed(() => mapRunsStore.getProgress(props.runId))

function formatTime(ms: number): string {
  const secs = Math.ceil(ms / 1000)
  const m = Math.floor(secs / 60)
  const s = secs % 60
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}
</script>

<style scoped>
.run-progress {
  margin-top: var(--spacing-sm);
}

.progress-bar {
  height: 6px;
  background: var(--color-progress-bg);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-progress-fill);
  border-radius: 3px;
  transition: width 0.9s linear;
}

.progress-fill.complete {
  background: var(--color-progress-complete);
}

.progress-labels {
  display: flex;
  justify-content: flex-end;
  margin-top: 3px;
  font-size: 11px;
  color: var(--color-text-dim);
}

.complete-text {
  color: var(--color-progress-complete);
  font-weight: 600;
}
</style>
