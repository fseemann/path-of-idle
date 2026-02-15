<template>
  <AppHeader @go-to-inventory="activeTab = 'inventory'" />
  <AppTabs v-model="activeTab" />
  <main class="app-main">
    <MapPanel v-if="activeTab === 'maps'" />
    <CharacterPanel v-else-if="activeTab === 'characters'" />
    <InventoryPanel v-else-if="activeTab === 'inventory'" />
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppTabs, { type TabId } from '@/components/layout/AppTabs.vue'
import MapPanel from '@/components/map/MapPanel.vue'
import CharacterPanel from '@/components/character/CharacterPanel.vue'
import InventoryPanel from '@/components/inventory/InventoryPanel.vue'
import { useMapRunsStore } from '@/stores'

const activeTab = ref<TabId>('maps')
const mapRunsStore = useMapRunsStore()

onMounted(() => mapRunsStore.startLoop())
onUnmounted(() => mapRunsStore.stopLoop())
</script>

<style scoped>
.app-main {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
