import type { ComputedStats, SkillDefinition } from '@/types'

/**
 * Calculate the total mana reserved by equipped passive skills (auras).
 * @param maxMana - The character's maximum mana
 * @param auras - Array of equipped passive skill definitions
 * @returns The amount of mana reserved (absolute value, not percentage)
 */
export function calculateReservedMana(
  maxMana: number,
  auras: SkillDefinition[]
): number {
  const totalReservationPercent = auras.reduce((sum, aura) => {
    return sum + (aura.manaReservation || 0)
  }, 0)

  return Math.floor((maxMana * totalReservationPercent) / 100)
}

/**
 * Calculate available mana after reservation.
 * @param maxMana - The character's maximum mana
 * @param reserved - The amount of mana reserved by auras
 * @returns The available mana for active skills
 */
export function calculateAvailableMana(maxMana: number, reserved: number): number {
  return Math.max(0, maxMana - reserved)
}

/**
 * Regenerate mana over a time period.
 * @param currentMana - Current mana value
 * @param maxMana - Maximum mana pool
 * @param reservedMana - Mana reserved by auras (not regenerated into)
 * @param regenPercent - Mana regeneration rate as percentage of max mana per second
 * @param deltaSeconds - Time elapsed in seconds
 * @returns New current mana value after regeneration
 */
export function regenerateMana(
  currentMana: number,
  maxMana: number,
  reservedMana: number,
  regenPercent: number,
  deltaSeconds: number
): number {
  const availableMax = maxMana - reservedMana
  const regenAmount = (maxMana * regenPercent / 100) * deltaSeconds

  return Math.min(availableMax, currentMana + regenAmount)
}

/**
 * Calculate effective mana regeneration rate including all modifiers.
 * @param stats - Character's computed stats
 * @returns Total mana regen as percentage of max mana per second
 */
export function calculateManaRegenRate(stats: ComputedStats): number {
  // Base regen is 1.75% per second
  const basePercent = stats.manaRegenPercent
  // Flat mana regen adds directly to the percentage
  const total = basePercent + stats.manaRegenFlat

  return total
}

/**
 * Calculate mana-related stats for display or gameplay.
 * @param stats - Character's computed stats
 * @param equippedAuras - Array of equipped passive skills
 * @returns Object containing mana metrics
 */
export function calculateManaMetrics(
  stats: ComputedStats,
  equippedAuras: SkillDefinition[]
) {
  const reservedMana = calculateReservedMana(stats.maxMana, equippedAuras)
  const availableMana = calculateAvailableMana(stats.maxMana, reservedMana)
  const regenRate = calculateManaRegenRate(stats)
  const regenPerSecond = (stats.maxMana * regenRate) / 100

  return {
    maxMana: stats.maxMana,
    reservedMana,
    availableMana,
    regenRate, // as percentage
    regenPerSecond, // absolute value
  }
}
