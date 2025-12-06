/**
 * Database Layer - Combined Export
 * 
 * This file combines all modular database functions into a single `db` object
 * for backward compatibility with existing code.
 * 
 * All functions are now in organized modules - no dependency on db_old.ts
 */

import { authModule } from './auth'
import { homesModule } from './homes'
import { membersModule } from './members'
import { tasksModule } from './tasks'
import { challengesModule } from './challenges'
import { achievementsModule } from './achievements'

/**
 * Combined database object
 * All database functions organized by domain
 */
export const db = {
  // ========== AUTHENTICATION ==========
  signUp: authModule.signUp,
  signIn: authModule.signIn,
  signOut: authModule.signOut,
  onAuthStateChange: authModule.onAuthStateChange,
  getCurrentUser: authModule.getCurrentUser,
  getProfile: authModule.getProfile,
  updateProfile: authModule.updateProfile,
  markOnboardingComplete: authModule.markOnboardingComplete,
  
  // ========== HOMES AND ZONES ==========
  createHome: (userId: string, homeData: any) => 
    homesModule.createHome(userId, homeData, authModule.getProfile),
  getHomesByUser: homesModule.getHomesByUser,
  getHome: homesModule.getHome,
  updateHome: homesModule.updateHome,
  createZone: homesModule.createZone,
  getZones: homesModule.getZones,
  updateZone: homesModule.updateZone,
  deleteZone: homesModule.deleteZone,
  
  // ========== MEMBERS ==========
  inviteMember: membersModule.inviteMember,
  getInvitationByToken: membersModule.getInvitationByToken,
  acceptInvitation: (token: string, userId: string) =>
    membersModule.acceptInvitation(token, userId, authModule.getProfile, authModule.markOnboardingComplete),
  getActiveInvitations: membersModule.getActiveInvitations,
  cancelInvitation: membersModule.cancelInvitation,
  getPendingInvitationByEmail: membersModule.getPendingInvitationByEmail,
  changeHome: async (userId: string, newHomeToken: string) => {
    const result = await membersModule.changeHome(userId, newHomeToken)
    return membersModule.acceptInvitation(result.token, result.userId, authModule.getProfile, authModule.markOnboardingComplete)
  },
  getHomeMembers: membersModule.getHomeMembers,
  updateMember: membersModule.updateMember,
  getCurrentMember: membersModule.getCurrentMember,
  removeMember: membersModule.removeMember,
  updateMemberRole: membersModule.updateMemberRole,
  updateMemberProfile: membersModule.updateMemberProfile,
  changePassword: membersModule.changePassword,
  updateMemberPreferences: membersModule.updateMemberPreferences,
  getMemberMetrics: membersModule.getMemberMetrics,
  
  // ========== TASKS (All task-related functions) ==========
  ...tasksModule,
  
  // Override completeTask to trigger challenge updates
  completeTask: async (assignmentId: number, memberId: number, notes?: string, evidenceUrl?: string) => {
    // 1. Complete the task
    const result = await tasksModule.completeTask(assignmentId, memberId, notes, evidenceUrl)
    
    // 2. Trigger challenge updates in background
    try {
      // Get active challenges for this user (individual) and home (group)
      // We use the home_id returned by the modified completeTask
      if (result.home_id && result.task_id) {
        const challenges = await challengesModule.getActiveChallenges(result.home_id, memberId)
        
        let challengesUpdated = false
        
        // Update progress for each challenge
        for (const challenge of challenges) {
          // We only update if the user is a participant (progress exists)
          // completeChallengeTask checks this internally
          try {
              await challengesModule.completeChallengeTask(challenge.id, result.task_id, memberId)
              challengesUpdated = true
          } catch (e) {
              // Ignore errors for challenges the user isn't part of or other minor issues
          }
        }
        
        // 3. Refresh challengesStore if any challenges were updated
        if (challengesUpdated) {
          // Dynamically import to avoid circular dependency
          const { useChallengesStore } = await import('../../stores/challengesStore')
          const store = useChallengesStore.getState()
          
          // Reload challenge data to reflect updated progress
          await store.loadData(result.home_id, memberId)
        }
      }
    } catch (error) {
      console.error('Error updating challenge progress:', error)
      // Don't fail the task completion just because challenge update failed
    }
    
    return result
  },
  
  // ========== CHALLENGES (New System) ==========
  getChallengeTemplates: challengesModule.getChallengeTemplates,
  getAvailableChallengeTemplates: challengesModule.getAvailableChallengeTemplates,
  getActiveChallenges: challengesModule.getActiveChallenges,
  getChallengeProgress: challengesModule.getChallengeProgress,
  createChallengeFromTemplate: challengesModule.createChallengeFromTemplate,
  generateDailyChallenges: challengesModule.generateDailyChallenges,
  generateCycleChallenge: challengesModule.generateCycleChallenge,
  updateChallengeProgress: challengesModule.updateChallengeProgress,
  completeChallengeTask: challengesModule.completeChallengeTask,
  claimChallengeReward: (challengeId: number, memberId: number) => 
    challengesModule.claimChallengeReward(challengeId, memberId, achievementsModule.awardXP),
  expireOldChallenges: challengesModule.expireOldChallenges,
  getChallengeStats: challengesModule.getChallengeStats,
  
  // ========== ACHIEVEMENTS AND XP ==========
  getAchievements: achievementsModule.getAchievements,
  getMemberAchievements: achievementsModule.getMemberAchievements,
  unlockAchievement: achievementsModule.unlockAchievement,
  awardXP: achievementsModule.awardXP,
  getXPTransactions: achievementsModule.getXPTransactions,
  getMemberXPProgress: achievementsModule.getMemberXPProgress,
  checkLevelUp: achievementsModule.checkLevelUp,
  checkAndUnlockAchievements: achievementsModule.checkAndUnlockAchievements,
  updateMasteryLevel: achievementsModule.updateMasteryLevel,
  updateMemberMasteryLevel: achievementsModule.updateMemberMasteryLevel,
  getMemberAchievementsCount: achievementsModule.getMemberAchievementsCount,
}
