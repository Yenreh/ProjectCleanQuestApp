// Service to calculate mastery level based on user stats
// All mastery logic is handled in the frontend, not in the database

export type MasteryLevel = 'novice' | 'solver' | 'expert' | 'master' | 'visionary'

interface MasteryRequirements {
  level: MasteryLevel
  minPoints: number
  minAchievements: number
  minWeeksActive: number
  minTasksCompleted: number
}

interface UserStats {
  totalPoints: number
  achievementsUnlocked: number
  weeksActive: number
  tasksCompleted: number
}

// Define requirements for each level
// Level progression uses HYBRID system (OR logic) - meet ANY condition to level up
// This matches the backend db.ts calculation for consistency
const LEVEL_REQUIREMENTS: MasteryRequirements[] = [
  {
    level: 'novice',
    minPoints: 0,
    minAchievements: 0,
    minWeeksActive: 0,
    minTasksCompleted: 0,
  },
  {
    level: 'solver', // Early game (3-7 days)
    minPoints: 30,        // 30 points (3 tasks @ 10pts each)
    minAchievements: 2,   // OR 2 achievements
    minWeeksActive: 1,    // OR 1 week active
    minTasksCompleted: 3, // OR 3 tasks completed
  },
  {
    level: 'expert', // Mid-early game (1-2 weeks)
    minPoints: 120,        // 120 points (12 tasks)
    minAchievements: 3,    // OR 3 achievements
    minWeeksActive: 2,     // OR 2 weeks active
    minTasksCompleted: 12, // OR 12 tasks completed
  },
  {
    level: 'master', // Mid-late game (3-4 weeks)
    minPoints: 300,        // 300 points (30 tasks)
    minAchievements: 5,    // OR 5 achievements
    minWeeksActive: 4,     // OR 4 weeks active
    minTasksCompleted: 30, // OR 30 tasks completed
  },
  {
    level: 'visionary', // End game (5+ weeks)
    minPoints: 600,        // 600 points (60 tasks)
    minAchievements: 8,    // OR 8 achievements
    minWeeksActive: 8,     // OR 8 weeks active
    minTasksCompleted: 60, // OR 60 tasks completed
  },
]

/**
 * Calculate the mastery level based on user statistics
 * Uses OR logic - user reaches next level if they meet ANY ONE of the requirements
 * This matches the backend db.ts hybrid scoring system
 */
export function calculateMasteryLevel(stats: UserStats): MasteryLevel {
  // Check from highest to lowest level
  for (let i = LEVEL_REQUIREMENTS.length - 1; i >= 0; i--) {
    const requirement = LEVEL_REQUIREMENTS[i]
    
    // User reaches this level if they meet ANY requirement (OR logic)
    if (
      stats.totalPoints >= requirement.minPoints ||
      stats.achievementsUnlocked >= requirement.minAchievements ||
      stats.weeksActive >= requirement.minWeeksActive ||
      stats.tasksCompleted >= requirement.minTasksCompleted
    ) {
      return requirement.level
    }
  }
  
  return 'novice'
}

/**
 * Get the next level requirements
 */
export function getNextLevelRequirements(currentLevel: MasteryLevel): MasteryRequirements | null {
  const currentIndex = LEVEL_REQUIREMENTS.findIndex(r => r.level === currentLevel)
  
  if (currentIndex === -1 || currentIndex === LEVEL_REQUIREMENTS.length - 1) {
    return null // Already at max level or level not found
  }
  
  return LEVEL_REQUIREMENTS[currentIndex + 1]
}

/**
 * Calculate progress percentage towards next level for each metric
 */
export function calculateProgressToNextLevel(stats: UserStats, currentLevel: MasteryLevel) {
  const nextLevel = getNextLevelRequirements(currentLevel)
  
  if (!nextLevel) {
    return null // Already at max level
  }
  
  return {
    pointsProgress: Math.min(100, Math.round((stats.totalPoints / nextLevel.minPoints) * 100)),
    achievementsProgress: Math.min(100, Math.round((stats.achievementsUnlocked / nextLevel.minAchievements) * 100)),
    weeksProgress: Math.min(100, Math.round((stats.weeksActive / nextLevel.minWeeksActive) * 100)),
    tasksProgress: Math.min(100, Math.round((stats.tasksCompleted / nextLevel.minTasksCompleted) * 100))
  }
}

/**
 * Check if user just leveled up (for showing notifications)
 */
export function checkLevelUp(previousLevel: MasteryLevel, newLevel: MasteryLevel): boolean {
  const levels: MasteryLevel[] = ['novice', 'solver', 'expert', 'master', 'visionary']
  const prevIndex = levels.indexOf(previousLevel)
  const newIndex = levels.indexOf(newLevel)
  
  return newIndex > prevIndex
}

/**
 * Get features unlocked at each level
 */
export function getLevelFeatures(level: MasteryLevel): string[] {
  const features: Record<MasteryLevel, string[]> = {
    novice: [
      'Vista básica de tareas',
      'Completar tareas simples',
      'Ver progreso básico'
    ],
    solver: [
      'Análisis de rendimiento',
      'Métricas básicas',
      'Consejos de optimización',
      'Vista de tendencias'
    ],
    expert: [
      'Métricas avanzadas',
      'Planificación estratégica',
      'Análisis de tendencias',
      'Reportes detallados'
    ],
    master: [
      'Control total del sistema',
      'Configuración avanzada de tareas',
      'Gestión de miembros y permisos',
      'Personalización completa'
    ],
    visionary: [
      'Todas las características anteriores',
      'Modo experimental',
      'Proponer mejoras al sistema',
      'Votar en experimentos',
      'Acceso a pruebas A/B'
    ]
  }
  
  return features[level] || []
}
