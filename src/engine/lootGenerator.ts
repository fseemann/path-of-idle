import type {
  GameMap,
  Character,
  LootResult,
  EquipmentItem,
  RolledModifier,
  ArmorItem,
  WeaponItem,
  RingItem,
  ItemRarity,
} from '@/types'
import { ModifierGroup, MAX_MODIFIERS_BY_SLOT } from '@/types'
import { MODIFIER_POOL } from '@/data/modifierPool'
import { BASE_ITEM_TEMPLATES } from '@/data/baseItems'
import { calculateStats } from '@/engine/statCalculator'

function weightedRandom<T extends { weight: number }>(pool: T[]): T | null {
  if (pool.length === 0) return null
  const total = pool.reduce((sum, m) => sum + m.weight, 0)
  let roll = Math.random() * total
  for (const entry of pool) {
    roll -= entry.weight
    if (roll <= 0) return entry
  }
  return pool[pool.length - 1] ?? null
}

function rollModifier(usedGroups: Set<ModifierGroup>): RolledModifier | null {
  const eligible = MODIFIER_POOL.filter((m) => !usedGroups.has(m.group))
  const def = weightedRandom(eligible)
  if (!def) return null
  const value = Math.round(def.minValue + Math.random() * (def.maxValue - def.minValue))
  return {
    definitionId: def.id,
    group: def.group,
    kind: def.kind,
    target: def.target,
    value,
    label: def.label.replace('{value}', String(value)),
  }
}

const ITEM_PREFIXES = ['Tempered', 'Gleaming', 'Vicious', 'Ancient', 'Runed']
const ITEM_SUFFIXES = ['of the Bear', 'of the Fox', 'of Endurance', 'of the Magi', 'of the Stalwart']

function generateItemName(baseName: string, rarity: ItemRarity): string {
  if (rarity === 'normal') return baseName
  const suffix = ITEM_SUFFIXES[Math.floor(Math.random() * ITEM_SUFFIXES.length)]!
  if (rarity === 'magic') return `${baseName} ${suffix}`
  const prefix = ITEM_PREFIXES[Math.floor(Math.random() * ITEM_PREFIXES.length)]!
  return `${prefix} ${baseName} ${suffix}`
}

export function generateLoot(map: GameMap, character: Character, survivalRatio = 1): LootResult {
  const stats = calculateStats(character)
  const dps = stats.attackDamage * stats.attackSpeed
  const bonusItems = Math.floor(Math.max(0, dps / 15.0 - 1))
  // Higher DPS gives a chance to roll one extra modifier per item, biasing toward higher rarity
  const extraModChance = Math.min(0.75, Math.max(0, (dps - 3) / 30))
  const rawCount = Math.round(map.lootMultiplier * (0.5 + Math.random())) + bonusItems
  const itemCount = Math.max(1, Math.round(rawCount * survivalRatio))
  const items: EquipmentItem[] = []

  const eligibleTemplates = BASE_ITEM_TEMPLATES.filter(
    (t) => t.tierMin <= map.tier && t.tierMax >= map.tier
  )
  if (eligibleTemplates.length === 0) {
    return {
      runId: '',
      characterId: character.id,
      items: [],
      xpAwarded: Math.round(map.xpReward * survivalRatio * (0.9 + Math.random() * 0.2)),
      generatedAt: Date.now(),
    }
  }

  for (let i = 0; i < itemCount; i++) {
    const template = eligibleTemplates[Math.floor(Math.random() * eligibleTemplates.length)]!
    const maxMods = MAX_MODIFIERS_BY_SLOT[template.slot]
    const isRing = template.slot === 'ring'
    const baseModCount = Math.max(1, Math.ceil(Math.random() * maxMods))
    const extraMod = !isRing && Math.random() < extraModChance ? 1 : 0
    const modCount = isRing ? 1 : Math.min(maxMods, baseModCount + extraMod)

    const usedGroups = new Set<ModifierGroup>()
    const modifiers: RolledModifier[] = []

    for (let m = 0; m < modCount; m++) {
      const mod = rollModifier(usedGroups)
      if (mod) {
        modifiers.push(mod)
        usedGroups.add(mod.group)
      }
    }

    const rarity: ItemRarity =
      modifiers.length >= 4 ? 'rare' : modifiers.length >= 2 ? 'magic' : 'normal'

    const base = {
      id: crypto.randomUUID(),
      name: generateItemName(template.name, rarity),
      slot: template.slot,
      rarity,
      levelRequirement: template.levelRequirement,
      statRequirements: {},
      modifiers,
    }

    if (template.slot === 'weapon') {
      items.push({
        ...base,
        slot: 'weapon',
        baseAttackDamage: template.baseAttackDamage!,
      } as WeaponItem)
    } else if (isRing) {
      items.push({
        ...base,
        slot: 'ring',
      } as RingItem)
    } else {
      items.push({
        ...base,
        slot: template.slot,
        baseDefense: template.baseDefense!,
      } as ArmorItem)
    }
  }

  return {
    runId: '',
    characterId: character.id,
    items,
    xpAwarded: Math.round(map.xpReward * survivalRatio * (0.9 + Math.random() * 0.2)),
    generatedAt: Date.now(),
  }
}
