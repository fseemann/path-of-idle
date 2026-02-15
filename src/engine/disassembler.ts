import type { EquipmentItem, RolledModifier } from '@/types'
import { ModifierGroup, MAX_MODIFIERS_BY_SLOT } from '@/types'
import { MODIFIER_POOL } from '@/data/modifierPool'

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

  const isRing = item.slot === 'ring'
  const itemTier = item.itemTier ?? 1

  const usedGroups = new Set<ModifierGroup>(item.modifiers.map((m) => m.group))
  const eligible = MODIFIER_POOL.filter(
    (m) =>
      !usedGroups.has(m.group) &&
      (m.minItemTier ?? 1) <= itemTier &&
      (!m.ringOnly || isRing),
  )
  if (eligible.length === 0) return null

  const total = eligible.reduce((sum, m) => sum + m.weight, 0)
  let roll = Math.random() * total
  let def = eligible[eligible.length - 1]!
  for (const entry of eligible) {
    roll -= entry.weight
    if (roll <= 0) { def = entry; break }
  }

  const value = Math.round(def.minValue + Math.random() * (def.maxValue - def.minValue))
  const newMod: RolledModifier = {
    definitionId: def.id,
    group: def.group,
    kind: def.kind,
    target: def.target,
    ...(def.extraTargets ? { extraTargets: def.extraTargets } : {}),
    value,
    label: def.label.replace('{value}', String(value)),
  }

  const newMods = [...item.modifiers, newMod]
  return { ...item, modifiers: newMods, rarity: rarityFromModCount(newMods.length) }
}
