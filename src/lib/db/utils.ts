/**
 * Database utility functions and calculations
 * All business logic that was previously in SQL functions
 */

export type MasteryLevel = 'novice' | 'solver' | 'expert' | 'master' | 'visionary'
export type RotationPolicy = 'daily' | 'weekly' | 'biweekly' | 'monthly'
export type DurationType = 'daily' | 'quarter_cycle' | 'half_cycle' | 'full_cycle' | 'multi_cycle'
export type ChallengeType = 'individual' | 'group'

export interface ChallengeXPParams {
  baseXP: number
  challengeType: ChallengeType
  durationType: DurationType
  difficultyMultiplier: number
}

export interface ChallengeDurationParams {
  rotationPolicy: RotationPolicy
  durationType: DurationType
  durationMultiplier?: number
  startDate?: Date
}

export interface LevelProgress {
  currentLevel: MasteryLevel
  currentXP: number
  xpForCurrentLevel: number
  xpForNextLevel: number
  xpProgress: number // XP earned towards next level
  progressPercentage: number // 0-100
}

// ========== XP AND LEVEL CALCULATIONS ==========

/**
 * XP thresholds for each mastery level
 */
const XP_THRESHOLDS: Record<MasteryLevel, number> = {
  novice: 0,
  solver: 100,
  expert: 400,
  master: 1000,
  visionary: 2000,
}

/**
 * Calculate mastery level from total XP
 */
export function calculateMasteryLevel(totalXP: number): MasteryLevel {
  if (totalXP < 100) return 'novice'
  if (totalXP < 400) return 'solver'
  if (totalXP < 1000) return 'expert'
  if (totalXP < 2000) return 'master'
  return 'visionary'
}

/**
 * Get XP required for a specific level
 */
export function getXPForLevel(level: MasteryLevel): number {
  return XP_THRESHOLDS[level]
}

/**
 * Get XP required for next level
 */
export function getXPForNextLevel(currentLevel: MasteryLevel): number {
  const levels: MasteryLevel[] = ['novice', 'solver', 'expert', 'master', 'visionary']
  const currentIndex = levels.indexOf(currentLevel)
  
  if (currentIndex === levels.length - 1) {
    // Already at max level
    return XP_THRESHOLDS.visionary
  }
  
  return XP_THRESHOLDS[levels[currentIndex + 1]]
}

/**
 * Get detailed level progress information
 */
export function getLevelProgress(totalXP: number): LevelProgress {
  const currentLevel = calculateMasteryLevel(totalXP)
  const xpForCurrentLevel = getXPForLevel(currentLevel)
  const xpForNextLevel = getXPForNextLevel(currentLevel)
  
  const xpProgress = totalXP - xpForCurrentLevel
  const xpNeeded = xpForNextLevel - xpForCurrentLevel
  const progressPercentage = xpNeeded > 0 ? Math.min(100, (xpProgress / xpNeeded) * 100) : 100
  
  return {
    currentLevel,
    currentXP: totalXP,
    xpForCurrentLevel,
    xpForNextLevel,
    xpProgress,
    progressPercentage,
  }
}

/**
 * Calculate XP reward for a challenge
 * Formula: Base XP × Type Multiplier × Duration Bonus × Difficulty Multiplier
 */
export function calculateChallengeXP(params: ChallengeXPParams): number {
  const { baseXP, challengeType, durationType, difficultyMultiplier } = params
  
  // Type multiplier
  const typeMultiplier = challengeType === 'individual' ? 1.5 : 2.0
  
  // Duration bonus
  let durationBonus = 1.0
  switch (durationType) {
    case 'daily':
      durationBonus = 1.0
      break
    case 'quarter_cycle':
      durationBonus = 1.1
      break
    case 'half_cycle':
      durationBonus = 1.2
      break
    case 'full_cycle':
      durationBonus = 1.3
      break
    case 'multi_cycle':
      durationBonus = 1.5
      break
  }
  
  // Calculate final XP
  const finalXP = Math.round(baseXP * typeMultiplier * durationBonus * difficultyMultiplier)
  
  return finalXP
}

/**
 * Calculate XP for task completion
 * Base formula: effort_points × 10
 */
export function calculateTaskXP(effortPoints: number): number {
  return effortPoints * 10
}

// ========== DURATION CALCULATIONS ==========

/**
 * Get number of days for a rotation policy
 */
export function getCycleDurationDays(rotationPolicy: RotationPolicy): number {
  switch (rotationPolicy) {
    case 'daily':
      return 1
    case 'weekly':
      return 7
    case 'biweekly':
      return 14
    case 'monthly':
      return 30
    default:
      return 7 // Default to weekly
  }
}

/**
 * Calculate end date for a challenge based on duration type and home's rotation policy
 */
export function calculateChallengeEndDate(params: ChallengeDurationParams): Date {
  const { rotationPolicy, durationType, durationMultiplier = 1.0, startDate = new Date() } = params
  
  const baseDays = getCycleDurationDays(rotationPolicy)
  let totalDays: number
  
  switch (durationType) {
    case 'daily':
      totalDays = 1
      break
    case 'quarter_cycle':
      totalDays = Math.max(1, Math.round(baseDays * 0.25))
      break
    case 'half_cycle':
      totalDays = Math.max(1, Math.round(baseDays * 0.5))
      break
    case 'full_cycle':
      totalDays = baseDays
      break
    case 'multi_cycle':
      totalDays = Math.round(baseDays * durationMultiplier)
      break
    default:
      totalDays = baseDays
  }
  
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + totalDays)
  
  return endDate
}

// ========== CHALLENGE GENERATION HELPERS ==========

/**
 * Select random tasks from a list
 */
export function selectRandomTasks<T>(tasks: T[], count: number): T[] {
  if (tasks.length <= count) {
    return [...tasks]
  }
  
  const shuffled = [...tasks].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Get random item from array
 */
export function getRandomItem<T>(array: T[]): T | undefined {
  if (array.length === 0) return undefined
  return array[Math.floor(Math.random() * array.length)]
}

/**
 * Check if a date is within a date range
 */
export function isDateInRange(date: Date, start: Date, end: Date): boolean {
  return date >= start && date <= end
}

/**
 * Get days between two dates
 */
export function getDaysBetween(start: Date, end: Date): number {
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}
