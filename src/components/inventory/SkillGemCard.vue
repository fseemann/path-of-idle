<template>
  <div
    class="gem-card"
    :class="skillDef?.type ?? 'active'"
    @click="emit('open', gem)"
  >
    <div class="gem-header">
      <span class="gem-name">{{ skillDef?.name ?? gem.skillId }}</span>
      <span class="gem-tier">T{{ skillDef?.tier }}</span>
    </div>
    <div class="gem-meta">
      <span class="gem-type-label">{{ typeLabel }}</span>
      <span class="gem-scaling">{{ scalingLabel }}</span>
    </div>
    <div v-if="skillDef?.description" class="gem-description">{{ skillDef.description }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SkillGem } from '@/types'
import { getSkillDefinition } from '@/data/skillDefinitions'

const props = defineProps<{ gem: SkillGem }>()
const emit = defineEmits<{ open: [gem: SkillGem] }>()

const skillDef = computed(() => getSkillDefinition(props.gem.skillId))

const typeLabel = computed(() =>
  skillDef.value?.type === 'passive' ? 'Aura / Passive' : 'Active Skill'
)

const scalingLabel = computed(() => {
  const attr = skillDef.value?.scaling.attribute
  if (!attr) return ''
  return attr.charAt(0).toUpperCase() + attr.slice(1)
})
</script>

<style scoped>
.gem-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-left-width: 3px;
  border-radius: var(--radius-sm);
  padding: var(--spacing-sm);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.gem-card:hover {
  background: var(--color-bg-card-hover);
}

.gem-card.active {
  border-left-color: #e67e22;
}

.gem-card.passive {
  border-left-color: #9b59b6;
}

.gem-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--spacing-xs);
}

.gem-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gem-tier {
  font-size: 10px;
  color: var(--color-text-dim);
  flex-shrink: 0;
}

.gem-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.gem-type-label {
  font-size: 10px;
  color: var(--color-text-dim);
}

.gem-scaling {
  font-size: 10px;
  color: var(--color-text-dim);
  font-style: italic;
}

.gem-description {
  font-size: 11px;
  color: var(--color-text-dim);
  line-height: 1.4;
  margin-top: 2px;
}
</style>
