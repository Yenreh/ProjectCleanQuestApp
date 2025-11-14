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
const MASTERY_REQUIREMENTS: MasteryRequirements[] = [
  {
    level: 'visionary',
    minPoints: 3000,
    minAchievements: 15,
    minWeeksActive: 12,
    minTasksCompleted: 300
  },
  {
    level: 'master',
    minPoints: 1500,
    minAchievements: 10,
    minWeeksActive: 8,
    minTasksCompleted: 150
  },
  {
    level: 'expert',
    minPoints: 500,
    minAchievements: 5,
    minWeeksActive: 4,
    minTasksCompleted: 50
  },
  {
    level: 'solver',
    minPoints: 100,
    minAchievements: 2,
    minWeeksActive: 2,
    minTasksCompleted: 15
  },
  {
    level: 'novice',
    minPoints: 0,
    minAchievements: 0,
    minWeeksActive: 0,
    minTasksCompleted: 0
  }
]

/**
 * Calculate the mastery level based on user statistics
 * Returns the highest level for which the user meets ALL requirements
 */
export function calculateMasteryLevel(stats: UserStats): MasteryLevel {
  for (const requirement of MASTERY_REQUIREMENTS) {
    if (
      stats.totalPoints >= requirement.minPoints &&
      stats.achievementsUnlocked >= requirement.minAchievements &&
      stats.weeksActive >= requirement.minWeeksActive &&
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
  const currentIndex = MASTERY_REQUIREMENTS.findIndex(r => r.level === currentLevel)
  
  if (currentIndex <= 0) {
    return null // Already at max level
  }
  
  return MASTERY_REQUIREMENTS[currentIndex - 1]
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
