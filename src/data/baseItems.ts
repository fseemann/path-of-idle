import type { ItemSlot } from '@/types'

export interface BaseItemTemplate {
  id: string
  slot: ItemSlot
  name: string
  tierMin: number
  tierMax: number
  baseDefense?: number
  baseAttackDamage?: [number, number]
  levelRequirement: number
}

export const BASE_ITEM_TEMPLATES: BaseItemTemplate[] = [
  // Helmets
  { id: 'rusted-helm',     slot: 'helmet',    name: 'Rusted Helm',     tierMin: 1, tierMax: 2, baseDefense: 8,           levelRequirement: 1  },
  { id: 'iron-cap',        slot: 'helmet',    name: 'Iron Cap',        tierMin: 2, tierMax: 3, baseDefense: 16,          levelRequirement: 5  },
  { id: 'steel-crown',     slot: 'helmet',    name: 'Steel Crown',     tierMin: 3, tierMax: 5, baseDefense: 30,          levelRequirement: 12 },
  // Body Armor
  { id: 'tattered-robe',   slot: 'bodyArmor', name: 'Tattered Robe',   tierMin: 1, tierMax: 2, baseDefense: 12,          levelRequirement: 1  },
  { id: 'chain-hauberk',   slot: 'bodyArmor', name: 'Chain Hauberk',   tierMin: 2, tierMax: 4, baseDefense: 28,          levelRequirement: 5  },
  { id: 'plate-vest',      slot: 'bodyArmor', name: 'Plate Vest',      tierMin: 4, tierMax: 5, baseDefense: 55,          levelRequirement: 20 },
  // Weapons
  { id: 'worn-dagger',     slot: 'weapon',    name: 'Worn Dagger',     tierMin: 1, tierMax: 2, baseAttackDamage: [3, 6],   levelRequirement: 1  },
  { id: 'serrated-sword',  slot: 'weapon',    name: 'Serrated Sword',  tierMin: 2, tierMax: 3, baseAttackDamage: [8, 14],  levelRequirement: 5  },
  { id: 'war-axe',         slot: 'weapon',    name: 'War Axe',         tierMin: 3, tierMax: 5, baseAttackDamage: [15, 28], levelRequirement: 12 },
  // Boots
  { id: 'leather-shoes',   slot: 'boots',     name: 'Leather Shoes',   tierMin: 1, tierMax: 2, baseDefense: 5,           levelRequirement: 1  },
  { id: 'iron-greaves',    slot: 'boots',     name: 'Iron Greaves',    tierMin: 2, tierMax: 4, baseDefense: 15,          levelRequirement: 5  },
  { id: 'steel-sabatons',  slot: 'boots',     name: 'Steel Sabatons',  tierMin: 4, tierMax: 5, baseDefense: 28,          levelRequirement: 20 },
  // Rings (no base stats, all value in modifiers)
  { id: 'copper-ring',     slot: 'ring',      name: 'Copper Ring',     tierMin: 1, tierMax: 2, levelRequirement: 1  },
  { id: 'silver-ring',     slot: 'ring',      name: 'Silver Ring',     tierMin: 2, tierMax: 3, levelRequirement: 5  },
  { id: 'gold-ring',       slot: 'ring',      name: 'Gold Ring',       tierMin: 3, tierMax: 4, levelRequirement: 12 },
  { id: 'obsidian-band',   slot: 'ring',      name: 'Obsidian Band',   tierMin: 4, tierMax: 5, levelRequirement: 20 },
]
