import type { EquipmentItem } from '@/types'
import { ModifierGroup, MAX_MODIFIERS_BY_SLOT } from '@/types'
import { MODIFIER_POOL } from '@/data/modifierPool'
import { rollModifier, generateItemName } from './lootGenerator'

export interface DisassembleYield {
  annulmentShards: number
  exaltShards: number
}

export function getDisassembleYield(item: EquipmentItem): DisassembleYield {
  switch (item.rarity) {
    case 'normal': return { annulmentShards: 1, exaltShards: 0 }
    case 'magic':  return { annulmentShards: 0, exaltShards: 1 }
    case 'rare':   return { annulmentShards: 0, exaltShards: 2 }
  }
}

function rarityFromModCount(count: number): EquipmentItem['rarity'] {
  if (count >= 4) return 'rare'
  if (count >= 2) return 'magic'
  return 'normal'
}

/** Remove one random modifier. Returns null for items with no mods. */
export function applyAnnulment(item: EquipmentItem): EquipmentItem | null {
  if (item.modifiers.length === 0) return null
  const idx = Math.floor(Math.random() * item.modifiers.length)
  const newMods = item.modifiers.filter((_, i) => i !== idx)
  return { ...item, modifiers: newMods, rarity: rarityFromModCount(newMods.length) }
}


/** Add one random modifier respecting group uniqueness. Returns null for full items. */
export function applyExalt(item: EquipmentItem): EquipmentItem | null {
  const max = MAX_MODIFIERS_BY_SLOT[item.slot]
  if (item.modifiers.length >= max) return null

  const itemTier = item.itemTier ?? 1
  const usedGroups = new Set<ModifierGroup>(item.modifiers.map((m) => m.group))
  const newMod = rollModifier(usedGroups, itemTier, item.slot)
  if (!newMod) return null

  const newMods = [...item.modifiers, newMod]
  return { ...item, modifiers: newMods, rarity: rarityFromModCount(newMods.length) }
}

/** Upgrade a normal/magic item to rare, filling up to MAX_MODIFIERS_BY_SLOT mods. Returns null if already rare or already full. */
export function applyAlchemy(item: EquipmentItem): EquipmentItem | null {
  if (item.rarity === 'rare') return null
  const max = MAX_MODIFIERS_BY_SLOT[item.slot]
  if (item.modifiers.length >= max) return null

  const itemTier = item.itemTier ?? 1
  const usedGroups = new Set<ModifierGroup>(item.modifiers.map((m) => m.group))
  const modifiers = [...item.modifiers]

  while (modifiers.length < max) {
    const mod = rollModifier(usedGroups, itemTier, item.slot)
    if (!mod) break
    modifiers.push(mod)
    usedGroups.add(mod.group)
  }

  const name = generateItemName(item.name, 'rare')
  return { ...item, name, modifiers, rarity: 'rare' }
}

/** Reroll all mods on a rare item. Returns null if not rare. */
export function applyChaos(item: EquipmentItem): EquipmentItem | null {
  if (item.rarity !== 'rare') return null

  const itemTier = item.itemTier ?? 1
  const max = MAX_MODIFIERS_BY_SLOT[item.slot]
  const usedGroups = new Set<ModifierGroup>()
  const modifiers = []

  for (let i = 0; i < max; i++) {
    const mod = rollModifier(usedGroups, itemTier, item.slot)
    if (!mod) break
    modifiers.push(mod)
    usedGroups.add(mod.group)
  }

  return { ...item, modifiers, rarity: 'rare' }
}

/** Reroll the numeric values of existing mods. Returns null if item has no mods. */
export function applyDivine(item: EquipmentItem): EquipmentItem | null {
  if (item.modifiers.length === 0) return null

  const newMods = item.modifiers.map((mod) => {
    const def = MODIFIER_POOL.find((d) => d.id === mod.definitionId)
    if (!def) return mod
    const value = Math.round(def.minValue + Math.random() * (def.maxValue - def.minValue))
    return {
      ...mod,
      value,
      label: def.label.replace('{value}', String(value)),
    }
  })

  return { ...item, modifiers: newMods }
}
