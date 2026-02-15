import type { Character, ComputedStats, ArmorItem, WeaponItem } from '@/types'

export function calculateStats(character: Character): ComputedStats {
  const { strength: STR, dexterity: DEX, intelligence: INT } = character.baseStats
  const items = Object.values(character.equipment).filter(Boolean)

  // Base values derived from stats
  let health = 50 + STR * 5
  let mana = 30 + INT * 3
  let defense = Math.floor(STR / 5)
  let attackDamage = 3
  let attackSpeed = 1.0 + DEX * 0.002
  let movementSpeed = 100 + DEX * 0.2

  // Equipment base values
  for (const item of items) {
    if (item.slot === 'weapon') {
      const weapon = item as WeaponItem
      attackDamage += (weapon.baseAttackDamage[0] + weapon.baseAttackDamage[1]) / 2
    }
    if (item.slot === 'helmet' || item.slot === 'bodyArmor' || item.slot === 'boots') {
      defense += (item as ArmorItem).baseDefense
    }
  }

  // Collect modifier totals across all equipped items
  let flatHealth = 0
  let flatMana = 0
  let flatDefense = 0
  let flatAttackDamage = 0
  let pctDefense = 0
  let pctAttackDamage = 0
  let pctAttackSpeed = 0
  let pctMovementSpeed = 0
  let fireRes = 0
  let iceRes = 0
  let lightningRes = 0
  let chaosRes = 0

  for (const item of items) {
    for (const mod of item.modifiers) {
      switch (mod.target) {
        case 'health':
          flatHealth += mod.value
          break
        case 'mana':
          flatMana += mod.value
          break
        case 'defense':
          if (mod.kind === 'flat') flatDefense += mod.value
          else pctDefense += mod.value
          break
        case 'attackDamage':
          if (mod.kind === 'flat') flatAttackDamage += mod.value
          else pctAttackDamage += mod.value
          break
        case 'attackSpeed':
          pctAttackSpeed += mod.value
          break
        case 'movementSpeed':
          pctMovementSpeed += mod.value
          break
        case 'fireResistance':
          fireRes += mod.value
          break
        case 'iceResistance':
          iceRes += mod.value
          break
        case 'lightningResistance':
          lightningRes += mod.value
          break
        case 'chaosResistance':
          chaosRes += mod.value
          break
      }
    }
  }

  // Apply modifiers with two-pass formula: (base + flat) * (1 + increased/100)
  return {
    health: Math.round(health + flatHealth),
    mana: Math.round(mana + flatMana),
    defense: Math.round((defense + flatDefense) * (1 + pctDefense / 100)),
    attackDamage: Math.round((attackDamage + flatAttackDamage) * (1 + pctAttackDamage / 100)),
    attackSpeed: parseFloat(
      (attackSpeed * (1 + pctAttackSpeed / 100)).toFixed(2)
    ),
    movementSpeed: Math.round(movementSpeed * (1 + pctMovementSpeed / 100)),
    fireResistance: Math.min(75, fireRes),
    iceResistance: Math.min(75, iceRes),
    lightningResistance: Math.min(75, lightningRes),
    chaosResistance: chaosRes, // no cap, can be negative
  }
}
