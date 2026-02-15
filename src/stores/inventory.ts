import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { EquipmentItem, ItemSlot } from '@/types'

const STORAGE_KEY = 'poi-inventory'

export const useInventoryStore = defineStore('inventory', () => {
  const items = ref<EquipmentItem[]>([])
  const selectedItemId = ref<string | null>(null)

  // Load persisted state
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      items.value = JSON.parse(saved) as EquipmentItem[]
    } catch {
      items.value = []
    }
  }

  // Persist on change
  watch(items, (val) => localStorage.setItem(STORAGE_KEY, JSON.stringify(val)), { deep: true })

  // Getters
  const selectedItem = computed(() =>
    items.value.find((i) => i.id === selectedItemId.value) ?? null
  )

  const itemsBySlot = computed(() => {
    const result: Partial<Record<ItemSlot, EquipmentItem[]>> = {}
    for (const item of items.value) {
      const slot = item.slot
      if (!result[slot]) result[slot] = []
      result[slot]!.push(item)
    }
    return result
  })

  // Actions
  function addItems(newItems: EquipmentItem[]) {
    items.value.push(...newItems)
  }

  function removeItem(itemId: string): EquipmentItem | null {
    const idx = items.value.findIndex((i) => i.id === itemId)
    if (idx === -1) return null
    return items.value.splice(idx, 1)[0] ?? null
  }

  function selectItem(id: string | null) {
    selectedItemId.value = id
  }

  return {
    items,
    selectedItemId,
    selectedItem,
    itemsBySlot,
    addItems,
    removeItem,
    selectItem,
  }
})
