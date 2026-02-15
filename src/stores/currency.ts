import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { EquipmentItem } from '@/types'
import { getDisassembleYield, applyAnnulment, applyExalt } from '@/engine/disassembler'

const STORAGE_KEY = 'poi-currency'
export const SHARDS_PER_CURRENCY = 10

export const useCurrencyStore = defineStore('currency', () => {
  const annulmentShards = ref(0)
  const exaltShards = ref(0)

  // Load persisted state
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      const data = JSON.parse(saved) as { annulmentShards?: number; exaltShards?: number }
      annulmentShards.value = data.annulmentShards ?? 0
      exaltShards.value = data.exaltShards ?? 0
    } catch { /* ignore */ }
  }

  // Persist on change
  watch([annulmentShards, exaltShards], () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      annulmentShards: annulmentShards.value,
      exaltShards: exaltShards.value,
    }))
  })

  // Full orbs (floored)
  const annulments = computed(() => Math.floor(annulmentShards.value / SHARDS_PER_CURRENCY))
  const exalts = computed(() => Math.floor(exaltShards.value / SHARDS_PER_CURRENCY))

  // Leftover shards after full orbs
  const annulmentRemainder = computed(() => annulmentShards.value % SHARDS_PER_CURRENCY)
  const exaltRemainder = computed(() => exaltShards.value % SHARDS_PER_CURRENCY)

  function disassembleItem(item: EquipmentItem): void {
    const { annulmentShards: a, exaltShards: e } = getDisassembleYield(item)
    annulmentShards.value += a
    exaltShards.value += e
  }

  /** Spend one Annulment Orb. Returns the modified item, or null on failure. */
  function useAnnulment(item: EquipmentItem): EquipmentItem | null {
    if (annulments.value < 1) return null
    const result = applyAnnulment(item)
    if (!result) return null
    annulmentShards.value -= SHARDS_PER_CURRENCY
    return result
  }

  /** Spend one Exalt Orb. Returns the modified item, or null on failure. */
  function useExalt(item: EquipmentItem): EquipmentItem | null {
    if (exalts.value < 1) return null
    const result = applyExalt(item)
    if (!result) return null
    exaltShards.value -= SHARDS_PER_CURRENCY
    return result
  }

  return {
    annulmentShards,
    exaltShards,
    annulments,
    exalts,
    annulmentRemainder,
    exaltRemainder,
    disassembleItem,
    useAnnulment,
    useExalt,
  }
})
