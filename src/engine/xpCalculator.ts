export function xpRequiredForLevel(level: number): number {
  return Math.round(100 * Math.pow(1.5, level - 1))
}
