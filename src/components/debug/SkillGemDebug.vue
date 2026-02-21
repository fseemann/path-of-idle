<template>
  <div class="skill-gem-debug">
    <h3>Skill Gem Collection ({{ skillsStore.skillGems.length }})</h3>
    <div v-if="skillsStore.skillGems.length === 0" class="empty">
      No skill gems yet. Run maps to find them! (15% drop rate)
    </div>
    <div v-else class="gem-list">
      <div
        v-for="gem in skillsStore.skillGems"
        :key="gem.id"
        class="gem-card"
        :class="skillClass(gem.skillId)"
      >
        <div class="gem-name">{{ getSkillName(gem.skillId) }}</div>
        <div class="gem-details">
          {{ getSkillType(gem.skillId) }} • Tier {{ getSkillTier(gem.skillId) }}
        </div>
        <div class="gem-description">{{ getSkillDescription(gem.skillId) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSkillsStore } from '@/stores/skills'
import { getSkillDefinition } from '@/data/skillDefinitions'

const skillsStore = useSkillsStore()

function getSkillName(skillId: string): string {
  return getSkillDefinition(skillId)?.name ?? 'Unknown Skill'
}

function getSkillType(skillId: string): string {
  const skill = getSkillDefinition(skillId)
  if (!skill) return ''
  return skill.type === 'active' ? 'Active Skill' : 'Aura'
}

function getSkillTier(skillId: string): number {
  return getSkillDefinition(skillId)?.tier ?? 0
}

function getSkillDescription(skillId: string): string {
  return getSkillDefinition(skillId)?.description ?? ''
}

function skillClass(skillId: string): string {
  const skill = getSkillDefinition(skillId)
  return skill?.type === 'active' ? 'active' : 'passive'
}
</script>

<style scoped>
.skill-gem-debug {
  padding: 16px;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  margin: 16px 0;
}

h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.empty {
  padding: 20px;
  text-align: center;
  color: #666;
  font-size: 13px;
}

.gem-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.gem-card {
  padding: 12px;
  background: #252525;
  border-radius: 6px;
  border-left: 3px solid #666;
  transition: all 0.2s;
}

.gem-card.active {
  border-left-color: #e67e22;
}

.gem-card.passive {
  border-left-color: #9b59b6;
}

.gem-card:hover {
  background: #2a2a2a;
}

.gem-name {
  font-weight: bold;
  font-size: 13px;
  color: #fff;
  margin-bottom: 4px;
}

.gem-details {
  font-size: 11px;
  color: #888;
  margin-bottom: 6px;
}

.gem-description {
  font-size: 11px;
  color: #aaa;
  line-height: 1.4;
}
</style>
