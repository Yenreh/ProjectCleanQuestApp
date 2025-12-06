import { supabase } from './client'
import {
  calculateChallengeXP,
  calculateChallengeEndDate,
  selectRandomTasks,
  getRandomItem,
  type DurationType,
  type ChallengeType,
  type RotationPolicy
} from './utils'

/**
 * Challenge system module
 * Handles challenge generation, progress tracking, and completion
 */

// Standalone helper function to initialize progress data
function initializeProgressData(category: string, requirements: any): any {
  switch (category) {
    case 'task_completion':
      return {
        completed_tasks: [],
        target: requirements.task_count || 1
      }
    case 'streak':
      return {
        current_streak: 0,
        target: requirements.days || 3,
        last_completion: null
      }
    case 'variety':
      return {
        completed_zones: [],
        completed_tasks: [],
        target_zones: requirements.zone_count || 3,
        target_tasks: requirements.task_count || 3
      }
    case 'mastery':
      return {
        completed_tasks: [],
        target: requirements.task_count || 1,
        all_steps_required: requirements.all_steps || false
      }
    case 'collective':
      return {
        member_contribution: 0,
        team_total: 0,
        target: requirements.total_tasks || 10
      }
    case 'team_goal':
      return {
        member_completed: 0,
        target_per_member: requirements.min_tasks_per_member || 1
      }
    default:
      return {}
  }
}

export interface ChallengeTemplate {
  id: number
  name: string
  title: string
  description: string
  challenge_type: ChallengeType
  category: string
  requirements: any
  duration_type: DurationType
  duration_multiplier: number
  base_xp: number
  difficulty_multiplier: number
  min_mastery_level?: string
  requires_min_tasks: number
  is_active: boolean
}

export interface ActiveChallenge {
  id: number
  template_id?: number
  home_id: number
  title: string
  description: string
  challenge_type: ChallengeType
  category: string
  requirements: any
  start_date: string
  end_date: string
  cycle_aligned: boolean
  xp_reward: number
  status: 'active' | 'completed' | 'expired' | 'cancelled'
  assigned_to?: number
}

export interface ChallengeProgress {
  id: number
  challenge_id: number
  member_id: number
  progress_data: any
  is_completed: boolean
  completed_at?: string
  xp_awarded: number
}

export const challengesModule = {
  // ========== CHALLENGE TEMPLATES ==========

  async getChallengeTemplates(activeOnly = true): Promise<ChallengeTemplate[]> {
    if (!supabase) return []
    
    let query = supabase
      .from('challenge_templates')
      .select('*')
    
    if (activeOnly) {
      query = query.eq('is_active', true)
    }
    
    const { data, error } = await query.order('name', { ascending: true })
    
    if (error) throw error
    return data as ChallengeTemplate[]
  },

  async getAvailableChallengeTemplates(
    homeId: number,
    memberId: number,
    challengeType?: ChallengeType
  ): Promise<ChallengeTemplate[]> {
    if (!supabase) return []
    
    // Get member's mastery level
    let currentMasteryLevel = 'novice'
    
    if (memberId > 0) {
      const { data: member } = await supabase
        .from('home_members')
        .select('mastery_level')
        .eq('id', memberId)
        .single()
      
      if (member) {
        currentMasteryLevel = member.mastery_level
      }
    }
    
    // Get home's active tasks count
    const { count: taskCount } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('home_id', homeId)
      .eq('is_active', true)
    
    // Get all active templates
    let query = supabase
      .from('challenge_templates')
      .select('*')
      .eq('is_active', true)
    
    if (challengeType) {
      query = query.eq('challenge_type', challengeType)
    }
    
    const { data: templates, error } = await query
    
    if (error) throw error
    
    // Filter templates based on requirements
    const masteryLevels = ['novice', 'solver', 'expert', 'master', 'visionary']
    const memberLevelIndex = masteryLevels.indexOf(currentMasteryLevel)
    
    return (templates as ChallengeTemplate[]).filter(template => {
      // Check mastery level requirement
      if (template.min_mastery_level) {
        const requiredLevelIndex = masteryLevels.indexOf(template.min_mastery_level)
        if (memberLevelIndex < requiredLevelIndex) return false
      }
      
      // Check minimum tasks requirement
      if (template.requires_min_tasks > (taskCount || 0)) return false
      
      return true
    })
  },

  // ========== ACTIVE CHALLENGES ==========

  async getActiveChallenges(homeId: number, memberId?: number): Promise<ActiveChallenge[]> {
    if (!supabase) return []
    
    let query = supabase
      .from('active_challenges')
      .select('*')
      .eq('home_id', homeId)
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString())
    
    if (memberId) {
      // Get both group challenges and individual challenges assigned to this member
      query = query.or(`challenge_type.eq.group,assigned_to.eq.${memberId}`)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) throw error
    return data as ActiveChallenge[]
  },

  async getChallengeProgress(challengeId: number, memberId: number): Promise<ChallengeProgress | null> {
    if (!supabase) return null
    
    const { data, error } = await supabase
      .from('challenge_progress')
      .select('*')
      .eq('challenge_id', challengeId)
      .eq('member_id', memberId)
      .maybeSingle()
    
    if (error) throw error
    return data as ChallengeProgress | null
  },

  // ========== CHALLENGE GENERATION ==========

  async createChallengeFromTemplate(
    templateId: number,
    homeId: number,
    memberId?: number
  ): Promise<ActiveChallenge> {
    if (!supabase) throw new Error('Supabase not configured')
    
    // Get template
    const { data: template, error: templateError } = await supabase
      .from('challenge_templates')
      .select('*')
      .eq('id', templateId)
      .single()
    
    if (templateError) throw templateError
    
    // Get home's rotation policy
    const { data: home, error: homeError } = await supabase
      .from('homes')
      .select('rotation_policy')
      .eq('id', homeId)
      .single()
    
    if (homeError) throw homeError
    
    // Calculate XP reward
    const xpReward = calculateChallengeXP({
      baseXP: template.base_xp,
      challengeType: template.challenge_type as ChallengeType,
      durationType: template.duration_type as DurationType,
      difficultyMultiplier: template.difficulty_multiplier
    })
    
    // Calculate end date
    const startDate = new Date()
    const endDate = calculateChallengeEndDate({
      rotationPolicy: home.rotation_policy as RotationPolicy,
      durationType: template.duration_type as DurationType,
      durationMultiplier: template.duration_multiplier,
      startDate
    })
    
    // Create active challenge
    const { data: challenge, error: challengeError } = await supabase
      .from('active_challenges')
      .insert({
        template_id: templateId,
        home_id: homeId,
        title: template.title,
        description: template.description,
        challenge_type: template.challenge_type,
        category: template.category,
        requirements: template.requirements,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        cycle_aligned: true,
        xp_reward: xpReward,
        status: 'active',
        assigned_to: memberId
      })
      .select()
      .single()
    
    if (challengeError) throw challengeError
    
    // Create progress entry for the member (or all members if group challenge)
    if (template.challenge_type === 'individual' && memberId) {
      await supabase
        .from('challenge_progress')
        .insert({
          challenge_id: challenge.id,
          member_id: memberId,
          progress_data: initializeProgressData(template.category, template.requirements),
          is_completed: false
        })
    } else if (template.challenge_type === 'group') {
      // Get all active members
      const { data: members } = await supabase
        .from('home_members')
        .select('id')
        .eq('home_id', homeId)
        .eq('status', 'active')
      
      if (members) {
        await supabase
          .from('challenge_progress')
          .insert(
            members.map(m => ({
              challenge_id: challenge.id,
              member_id: m.id,
              progress_data: initializeProgressData(template.category, template.requirements),
              is_completed: false
            }))
          )
      }
    }
    
    return challenge as ActiveChallenge
  },

  async generateDailyChallenges(homeId: number, memberId: number, count = 2): Promise<ActiveChallenge[]> {
    if (!supabase) return []
    
    // Get available daily templates
    const templates = await this.getAvailableChallengeTemplates(homeId, memberId, 'individual')
    const dailyTemplates = templates.filter(t => t.duration_type === 'daily')
    
    if (dailyTemplates.length === 0) return []
    
    // Select random templates
    const selectedTemplates = selectRandomTasks(dailyTemplates, Math.min(count, dailyTemplates.length))
    
    // Create challenges
    const challenges: ActiveChallenge[] = []
    for (const template of selectedTemplates) {
      try {
        const challenge = await this.createChallengeFromTemplate((template as ChallengeTemplate).id, homeId, memberId)
        challenges.push(challenge)
      } catch (error) {
        console.error('Error creating daily challenge:', error)
      }
    }
    
    return challenges
  },

  async generateCycleChallenge(homeId: number): Promise<ActiveChallenge | null> {
    if (!supabase) return null
    
    // Get available group templates
    const templates = await this.getAvailableChallengeTemplates(homeId, 0, 'group')
    const cycleTemplates = templates.filter(t => 
      t.duration_type === 'full_cycle' || t.duration_type === 'half_cycle'
    )
    
    if (cycleTemplates.length === 0) return null
    
    // Select random template
    const template = getRandomItem(cycleTemplates)
    if (!template) return null
    
    // Create challenge
    try {
      return await this.createChallengeFromTemplate((template as ChallengeTemplate).id, homeId)
    } catch (error) {
      console.error('Error creating cycle challenge:', error)
      return null
    }
  },

  // ========== CHALLENGE PROGRESS ==========

  async updateChallengeProgress(
    challengeId: number,
    memberId: number,
    progressUpdate: Partial<any>
  ) {
    if (!supabase) throw new Error('Supabase not configured')
    
    // Get current progress
    const { data: current } = await supabase
      .from('challenge_progress')
      .select('progress_data')
      .eq('challenge_id', challengeId)
      .eq('member_id', memberId)
      .single()
    
    if (!current) throw new Error('Challenge progress not found')
    
    // Merge progress data
    const newProgressData = {
      ...current.progress_data,
      ...progressUpdate
    }
    
    // Update progress
    const { data, error } = await supabase
      .from('challenge_progress')
      .update({
        progress_data: newProgressData,
        last_updated: new Date().toISOString()
      })
      .eq('challenge_id', challengeId)
      .eq('member_id', memberId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async completeChallengeTask(challengeId: number, taskId: number, memberId: number) {
    if (!supabase) throw new Error('Supabase not configured')
    
    // Get challenge and progress
    const { data: challenge } = await supabase
      .from('active_challenges')
      .select('category, requirements')
      .eq('id', challengeId)
      .single()
    
    if (!challenge) throw new Error('Challenge not found')
    
    const { data: progress } = await supabase
      .from('challenge_progress')
      .select('progress_data')
      .eq('challenge_id', challengeId)
      .eq('member_id', memberId)
      .single()
    
    if (!progress) throw new Error('Progress not found')
    
    // Update progress based on category
    const progressData = progress.progress_data
    
    if (challenge.category === 'task_completion' || challenge.category === 'mastery') {
      if (!progressData.completed_tasks.includes(taskId)) {
        progressData.completed_tasks.push(taskId)
      }
    } else if (challenge.category === 'collective') {
      progressData.member_contribution += 1
      progressData.team_total += 1
    }
    
    // Check if challenge is complete
    const isComplete = this.checkChallengeComplete(challenge.category, progressData, challenge.requirements)
    
    // Update progress
    await supabase
      .from('challenge_progress')
      .update({
        progress_data: progressData,
        is_completed: isComplete,
        completed_at: isComplete ? new Date().toISOString() : null,
        last_updated: new Date().toISOString()
      })
      .eq('challenge_id', challengeId)
      .eq('member_id', memberId)
    
    return { isComplete, progressData }
  },

  checkChallengeComplete(category: string, progressData: any, requirements: any): boolean {
    switch (category) {
      case 'task_completion':
        return progressData.completed_tasks.length >= progressData.target
      case 'mastery':
        return progressData.completed_tasks.length >= progressData.target
      case 'variety':
        return progressData.completed_zones.length >= progressData.target_zones &&
               progressData.completed_tasks.length >= progressData.target_tasks
      case 'streak':
        return progressData.current_streak >= progressData.target
      case 'collective':
        return progressData.team_total >= progressData.target
      case 'team_goal':
        return progressData.member_completed >= progressData.target_per_member
      default:
        return false
    }
  },

  async claimChallengeReward(challengeId: number, memberId: number, awardXP: Function) {
    if (!supabase) throw new Error('Supabase not configured')
    
    // Get challenge and progress
    const { data: challenge } = await supabase
      .from('active_challenges')
      .select('xp_reward, challenge_type, category')
      .eq('id', challengeId)
      .single()
    
    if (!challenge) throw new Error('Challenge not found')
    
    const { data: progress } = await supabase
      .from('challenge_progress')
      .select('*')
      .eq('challenge_id', challengeId)
      .eq('member_id', memberId)
      .single()
    
    if (!progress) throw new Error('Progress not found')
    if (!progress.is_completed) throw new Error('Challenge not completed')
    if (progress.xp_awarded > 0) throw new Error('Reward already claimed')
    
    // Award XP
    await awardXP(
      memberId,
      challenge.xp_reward,
      'challenge_completion',
      'challenge',
      challengeId,
      `Completaste el desafío: ${challenge.xp_reward} XP`
    )
    
    // Update progress to mark reward as claimed
    await supabase
      .from('challenge_progress')
      .update({ xp_awarded: challenge.xp_reward })
      .eq('id', progress.id)
    
    // Update member challenge stats
    const statColumn = challenge.challenge_type === 'group' 
      ? 'group_challenges_completed'
      : 'challenges_completed'
    
    // Dynamically import to avoid circular dependency if needed, 
    // but since we are in the same directory structure, we can import at top level
    // However, to be safe and follow the pattern:
    const { membersModule } = await import('./members')
    
    const statsToUpdate: Record<string, number> = {
      [statColumn]: 1
    }
    
    // Update special challenge stats
    if (challenge.category === 'speed') {
      statsToUpdate['speed_challenges_completed'] = 1
    } else if (challenge.category === 'mastery') {
      statsToUpdate['perfect_challenges'] = 1
    }

    await membersModule.incrementStats(memberId, statsToUpdate)
    
    return {
      xpAwarded: challenge.xp_reward,
      challengeType: challenge.challenge_type
    }
  },

  // ========== UTILITIES ==========

  async expireOldChallenges() {
    if (!supabase) return
    
    const { error } = await supabase
      .from('active_challenges')
      .update({ status: 'expired' })
      .eq('status', 'active')
      .lt('end_date', new Date().toISOString())
    
    if (error) console.error('Error expiring old challenges:', error)
  },

  async getChallengeStats(homeId: number) {
    if (!supabase) return null
    
    const { data: challenges } = await supabase
      .from('active_challenges')
      .select('*')
      .eq('home_id', homeId)
    
    const { data: progress } = await supabase
      .from('challenge_progress')
      .select('*')
      .in('challenge_id', challenges?.map(c => c.id) || [])
    
    if (!challenges || !progress) return null
    
    const totalChallenges = challenges.length
    const activeChallenges = challenges.filter(c => c.status === 'active').length
    const completedChallenges = challenges.filter(c => c.status === 'completed').length
    const totalProgress = progress.length
    const completedProgress = progress.filter(p => p.is_completed).length
    const completionRate = totalProgress > 0 ? (completedProgress / totalProgress) * 100 : 0
    
    return {
      totalChallenges,
      activeChallenges,
      completedChallenges,
      completionRate
    }
  },
}
