import { supabase } from './client'
import type { Achievement } from '../types'
import { calculateMasteryLevel, getLevelProgress, type MasteryLevel, type LevelProgress } from './utils'

/**
 * Achievements and XP module
 * Handles achievements, XP transactions, and level progression
 */

export const achievementsModule = {
  // ========== ACHIEVEMENTS ==========

  async getAchievements() {
    if (!supabase) return []
    
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data as Achievement[]
  },

  async getMemberAchievements(memberId: number) {
    if (!supabase) return []
    
    const { data, error } = await supabase
      .from('member_achievements')
      .select(`
        *,
        achievements (*)
      `)
      .eq('member_id', memberId)
      .order('unlocked_at', { ascending: false })
    
    if (error) throw error
    
    // Map to flat structure with achievement details
    return (data || []).map((item: any) => ({
      ...item.achievements,
      unlocked_at: item.unlocked_at
    }))
  },

  async unlockAchievement(memberId: number, achievementId: number) {
    if (!supabase) throw new Error('Supabase not configured')
    
    // Check if already unlocked
    const { data: existing } = await supabase
      .from('member_achievements')
      .select('id')
      .eq('member_id', memberId)
      .eq('achievement_id', achievementId)
      .maybeSingle()
    
    if (existing) {
      return existing // Already unlocked
    }
    
    const { data, error } = await supabase
      .from('member_achievements')
      .insert({
        member_id: memberId,
        achievement_id: achievementId,
        unlocked_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // ========== XP SYSTEM ==========

  async awardXP(
    memberId: number,
    amount: number,
    source: 'task_completion' | 'challenge_completion' | 'achievement_unlock' | 'bonus' | 'level_up' | 'streak_bonus',
    referenceType?: string,
    referenceId?: number,
    description?: string
  ) {
    if (!supabase) throw new Error('Supabase not configured')
    
    // Get current member data
    const { data: member, error: memberError } = await supabase
      .from('home_members')
      .select('total_xp, mastery_level')
      .eq('id', memberId)
      .single()
    
    if (memberError) throw memberError
    
    const oldXP = member.total_xp || 0
    const oldLevel = member.mastery_level as MasteryLevel
    const newXP = oldXP + amount
    const newLevel = calculateMasteryLevel(newXP)
    
    // Update member XP
    const updates: any = { total_xp: newXP }
    
    // Check for level up
    if (newLevel !== oldLevel) {
      updates.mastery_level = newLevel
    }
    
    const { error: updateError } = await supabase
      .from('home_members')
      .update(updates)
      .eq('id', memberId)
    
    if (updateError) throw updateError
    
    // Log transaction
    const { error: transactionError } = await supabase
      .from('xp_transactions')
      .insert({
        member_id: memberId,
        amount,
        source,
        reference_type: referenceType,
        reference_id: referenceId,
        description: description || `${amount} XP from ${source}`
      })
    
    if (transactionError) throw transactionError
    
    // If level up occurred, log it
    if (newLevel !== oldLevel) {
      await supabase
        .from('xp_transactions')
        .insert({
          member_id: memberId,
          amount: 0,
          source: 'level_up',
          description: `Subiste a nivel ${newLevel}`
        })
    }
    
    return {
      oldXP,
      newXP,
      oldLevel,
      newLevel,
      leveledUp: newLevel !== oldLevel
    }
  },

  async getXPTransactions(memberId: number, limit = 50) {
    if (!supabase) return []
    
    const { data, error } = await supabase
      .from('xp_transactions')
      .select('*')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data
  },

  async getMemberXPProgress(memberId: number): Promise<LevelProgress | null> {
    if (!supabase) return null
    
    const { data, error } = await supabase
      .from('home_members')
      .select('total_xp')
      .eq('id', memberId)
      .single()
    
    if (error) throw error
    
    return getLevelProgress(data.total_xp || 0)
  },

  async checkLevelUp(memberId: number) {
    if (!supabase) return null
    
    const { data, error } = await supabase
      .from('home_members')
      .select('total_xp, mastery_level')
      .eq('id', memberId)
      .single()
    
    if (error) throw error
    
    const currentXP = data.total_xp || 0
    const currentLevel = data.mastery_level as MasteryLevel
    const calculatedLevel = calculateMasteryLevel(currentXP)
    
    if (calculatedLevel !== currentLevel) {
      // Level up detected!
      await supabase
        .from('home_members')
        .update({ mastery_level: calculatedLevel })
        .eq('id', memberId)
      
      return {
        oldLevel: currentLevel,
        newLevel: calculatedLevel,
        currentXP
      }
    }
    
    return null
  },

  async checkAndUnlockAchievements(memberId: number) {
    if (!supabase) return []
    
    // Get member stats
    const { data: member, error: memberError } = await supabase
      .from('home_members')
      .select('*')
      .eq('id', memberId)
      .single()
    
    if (memberError) throw memberError
    
    // Get all achievements
    const { data: achievements, error: achievementsError } = await supabase
      .from('achievements')
      .select('*')
    
    if (achievementsError) throw achievementsError
    
    // Get already unlocked achievements
    const { data: unlocked, error: unlockedError } = await supabase
      .from('member_achievements')
      .select('achievement_id')
      .eq('member_id', memberId)
    
    if (unlockedError) throw unlockedError
    
    const unlockedIds = new Set(unlocked.map(u => u.achievement_id))
    const newlyUnlocked: Achievement[] = []
    
    // Check each achievement
    for (const achievement of achievements) {
      if (unlockedIds.has(achievement.id)) continue
      
      let shouldUnlock = false
      
      // Check requirement based on type
      switch (achievement.requirement_type) {
        case 'onboarding':
          shouldUnlock = true // Unlocked when member joins
          break
        case 'collaborations':
        case 'tasks_completed':
          shouldUnlock = member.tasks_completed >= achievement.requirement_value
          break
        case 'weeks_active':
          shouldUnlock = member.weeks_active >= achievement.requirement_value
          break
        case 'streak_days':
          shouldUnlock = member.current_streak >= achievement.requirement_value
          break
        case 'total_xp':
          shouldUnlock = (member.total_xp || 0) >= achievement.requirement_value
          break
        case 'challenges_completed':
          shouldUnlock = (member.challenges_completed || 0) >= achievement.requirement_value
          break
        case 'group_challenges_completed':
          shouldUnlock = (member.group_challenges_completed || 0) >= achievement.requirement_value
          break
        case 'speed_challenges_completed':
          shouldUnlock = (member.speed_challenges_completed || 0) >= achievement.requirement_value
          break
        case 'perfect_challenges':
          shouldUnlock = (member.perfect_challenges || 0) >= achievement.requirement_value
          break
        case 'level_reached':
          const levels: MasteryLevel[] = ['novice', 'solver', 'expert', 'master', 'visionary']
          const currentLevelIndex = levels.indexOf(member.mastery_level)
          shouldUnlock = currentLevelIndex >= achievement.requirement_value - 1
          break
      }
      
      if (shouldUnlock) {
        await this.unlockAchievement(memberId, achievement.id)
        newlyUnlocked.push(achievement)
      }
    }
    
    return newlyUnlocked
  },

  // ========== MASTERY LEVEL (Legacy) ==========

  async updateMasteryLevel(memberId: number) {
    if (!supabase) throw new Error('Supabase not configured');

    const { data: member } = await supabase
      .from('home_members')
      .select('total_points')
      .eq('id', memberId)
      .single();

    if (!member) return;

    const points = member.total_points || 0;
    let newLevel = 'novice';

    if (points >= 1000) newLevel = 'visionary';
    else if (points >= 500) newLevel = 'master';
    else if (points >= 200) newLevel = 'expert';
    else if (points >= 50) newLevel = 'solver';

    await supabase
      .from('home_members')
      .update({ mastery_level: newLevel })
      .eq('id', memberId);
  },

  async updateMemberMasteryLevel(memberId: number, masteryLevel: string): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');

    const { error } = await supabase
      .from('home_members')
      .update({ mastery_level: masteryLevel })
      .eq('id', memberId);

    if (error) throw error;
  },

  async getMemberAchievementsCount(memberId: number): Promise<number> {
    if (!supabase) return 0;

    const { count, error } = await supabase
      .from('member_achievements')
      .select('*', { count: 'exact', head: true })
      .eq('member_id', memberId);

    if (error) return 0;
    return count || 0;
  },

}
