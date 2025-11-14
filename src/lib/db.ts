import { createClient } from '@supabase/supabase-js'
import type {
  Profile,
  Home,
  Zone,
  HomeMember,
  Task,
  TaskAssignment,
  TaskCompletion,
  Challenge,
  Achievement,
  ImprovementProposal,
  HomeMetrics,
  MemberMetrics,
  WeeklyProgress,
  CreateHomeInput,
  UpdateHomeInput,
  CreateTaskInput,
  CreateZoneInput,
  InviteMemberInput,
  CreateTaskTemplateInput,
  CreateTaskStepInput,
  TaskStep,
  AssignmentWithDetails,
  ChallengeWithParticipants,
  ProposalWithAuthor
} from './types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  Supabase credentials not found. Using mock data mode.')
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Database queries
export const db = {
  // ========== AUTH ==========
  
  async signUp(email: string, password: string, fullName?: string) {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    })
    
    if (error) throw error
    
    // Create profile
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        email: data.user.email!,
        full_name: fullName
      })
    }
    
    return data
  },

  async signIn(email: string, password: string) {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    return data
  },

  async signOut() {
    if (!supabase) throw new Error('Supabase not configured')
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  onAuthStateChange(callback: (userId: string | null) => void) {
    if (!supabase) {
      return { unsubscribe: () => {} };
    }
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user?.id || null);
    });
    
    return subscription;
  },

  async getCurrentUser() {
    if (!supabase) return null
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  async getProfile(userId: string): Promise<Profile | null> {
    if (!supabase) return null
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return data
  },

  async updateProfile(userId: string, updates: Partial<Profile>) {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async markOnboardingComplete(userId: string): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { error } = await supabase
      .from('profiles')
      .update({ has_completed_onboarding: true })
      .eq('id', userId)
    
    if (error) throw error
  },

  // ========== HOMES ==========

  async createHome(userId: string, homeData: CreateHomeInput): Promise<Home> {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { data, error } = await supabase
      .from('homes')
      .insert({
        ...homeData,
        created_by: userId
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Get user profile first
    const profile = await this.getProfile(userId)
    if (!profile || !profile.email) {
      throw new Error('User profile or email not found')
    }
    
    // Create owner as member
    const { error: memberError } = await supabase.from('home_members').insert({
      home_id: data.id,
      user_id: userId,
      email: profile.email,
      role: 'owner',
      status: 'active',
      mastery_level: 'novice',
      weeks_active: 0,
      tasks_completed: 0,
      current_streak: 0
    })
    
    if (memberError) throw memberError
    
    return data
  },

  async getHomesByUser(userId: string): Promise<Home[]> {
    if (!supabase) return []
    
    const { data, error } = await supabase
      .from('home_members')
      .select('home_id, homes(*)')
      .eq('user_id', userId)
      .eq('status', 'active')
    
    if (error) throw error
    return data.map(item => item.homes as any as Home)
  },

  async getHome(homeId: number): Promise<Home | null> {
    if (!supabase) return null
    
    const { data, error } = await supabase
      .from('homes')
      .select('*')
      .eq('id', homeId)
      .single()
    
    if (error) throw error
    return data
  },

  async updateHome(homeId: number, updates: UpdateHomeInput) {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { data, error } = await supabase
      .from('homes')
      .update(updates)
      .eq('id', homeId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // ========== ZONES ==========

  async createZone(homeId: number, zoneData: CreateZoneInput) {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { data, error } = await supabase
      .from('zones')
      .insert({
        ...zoneData,
        home_id: homeId
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getZones(homeId: number): Promise<Zone[]> {
    if (!supabase) return []
    
    const { data, error } = await supabase
      .from('zones')
      .select('*')
      .eq('home_id', homeId)
    
    if (error) throw error
    return data
  },

  // ========== MEMBERS ==========

  async inviteMember(homeId: number, invitation: InviteMemberInput) {
    if (!supabase) throw new Error('Supabase not configured')
    
    const token = crypto.randomUUID()
    
    const { data, error } = await supabase
      .from('home_members')
      .insert({
        home_id: homeId,
        email: invitation.email,
        role: invitation.role || 'member',
        status: 'pending',
        invitation_token: token,
        mastery_level: 'novice'
      })
      .select()
      .single()
    
    if (error) throw error
    
    // TODO: Send invitation email with token
    
    return data
  },

  async getHomeMembers(homeId: number): Promise<HomeMember[]> {
    if (!supabase) return []
    
    const { data, error } = await supabase
      .from('home_members')
      .select(`
        *,
        profiles!home_members_user_id_fkey(full_name)
      `)
      .eq('home_id', homeId)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    
    // Map the data to include full_name directly in the HomeMember object
    return data.map(member => ({
      ...member,
      full_name: member.profiles?.full_name
    }))
  },

  async updateMember(memberId: number, updates: Partial<HomeMember>) {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { data, error } = await supabase
      .from('home_members')
      .update(updates)
      .eq('id', memberId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getCurrentMember(homeId: number, userId: string): Promise<HomeMember | null> {
    if (!supabase) return null
    
    const { data, error } = await supabase
      .from('home_members')
      .select('*')
      .eq('home_id', homeId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data
  },

  // ========== TASKS ==========

  async createTask(homeId: number, taskData: CreateTaskInput) {
    if (!supabase) throw new Error('Supabase not configured')
    
    const user = await this.getCurrentUser()
    
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...taskData,
        home_id: homeId,
        created_by: user?.id
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getTasks(homeId: number, activeOnly = true): Promise<Task[]> {
    if (!supabase) return []
    
    let query = supabase
      .from('tasks')
      .select('*')
      .eq('home_id', homeId)
    
    if (activeOnly) {
      query = query.eq('is_active', true)
    }
    
    const { data, error } = await query.order('created_at', { ascending: true })
    
    if (error) throw error
    return data
  },

  async getTasksWithDetails(homeId: number, activeOnly = true) {
    if (!supabase) return []

    let query = supabase
      .from('tasks')
      .select(`
        *,
        zones (
          name,
          icon
        )
      `)
      .eq('home_id', homeId)

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    const { data: tasks, error } = await query.order('created_at', { ascending: true })
    if (error) throw error
    if (!tasks) return []

    // Enrich each task with its steps
    const tasksWithDetails = await Promise.all(
      tasks.map(async (task) => {
        const steps = await this.getTaskSteps(task.id)
        return {
          ...task,
          zone_name: (task.zones as any)?.name,
          zone_icon: (task.zones as any)?.icon,
          steps,
          total_steps: steps.length
        }
      })
    )

    return tasksWithDetails
  },

  async updateTask(taskId: number, updates: Partial<Task>) {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // ========== TASK TEMPLATES ==========

  async createTaskTemplate(templateData: CreateTaskTemplateInput) {
    if (!supabase) throw new Error('Supabase not configured')

    const user = await this.getCurrentUser()

    const { data, error } = await supabase
      .from('task_templates')
      .insert({
        ...templateData,
        created_by: user?.id
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getTaskTemplates(publicOnly = true) {
    if (!supabase) return []

    let query = supabase.from('task_templates').select('*')
    if (publicOnly) query = query.eq('is_public', true)

    const { data, error } = await query.order('created_at', { ascending: true })
    if (error) throw error
    return data
  },

  async createSpecialTemplate(homeId: number, templateData: any) {
    if (!supabase) throw new Error('Supabase not configured')

    const user = await this.getCurrentUser()

    const { data, error } = await supabase
      .from('special_templates')
      .insert({
        home_id: homeId,
        name: templateData.name || 'Personalizada',
        description: templateData.description || null,
        modifications: templateData.modifications || {},
        is_active: templateData.is_active || false,
        created_by: user?.id
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // ========== TASK STEPS (Subtareas) ==========

  async createTaskStep(taskId: number, stepData: CreateTaskStepInput) {
    if (!supabase) throw new Error('Supabase not configured')

    const { data, error } = await supabase
      .from('task_steps')
      .insert({
        ...stepData,
        task_id: taskId
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getTaskSteps(taskId: number): Promise<TaskStep[]> {
    if (!supabase) return []

    const { data, error } = await supabase
      .from('task_steps')
      .select('*')
      .eq('task_id', taskId)
      .order('step_order', { ascending: true })

    if (error) throw error
    return data
  },

  async completeTaskStep(stepId: number, assignmentId: number, memberId: number) {
    if (!supabase) throw new Error('Supabase not configured')

    const { data, error } = await supabase
      .from('task_step_completions')
      .insert({
        step_id: stepId,
        assignment_id: assignmentId,
        completed_by: memberId
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async uncompleteTaskStep(stepId: number, assignmentId: number) {
    if (!supabase) throw new Error('Supabase not configured')

    const { error } = await supabase
      .from('task_step_completions')
      .delete()
      .eq('step_id', stepId)
      .eq('assignment_id', assignmentId)

    if (error) throw error
  },

  async getStepCompletions(assignmentId: number) {
    if (!supabase) return []

    const { data, error } = await supabase
      .from('task_step_completions')
      .select('*')
      .eq('assignment_id', assignmentId)

    if (error) throw error
    return data
  },

  // ========== TASK ASSIGNMENTS ==========

  async getMyAssignments(memberId: number, status?: string): Promise<AssignmentWithDetails[]> {
    if (!supabase) return []
    
    let query = supabase
      .from('task_assignments')
      .select(`
        *,
        tasks (
          title,
          icon,
          effort_points,
          zones (
            name,
            icon
          )
        ),
        home_members (
          email,
          user_id,
          profiles (
            full_name
          )
        )
      `)
      .eq('member_id', memberId)
    
    if (status) {
      query = query.eq('status', status)
    }
    
    const { data, error } = await query.order('assigned_date', { ascending: false })
    
    if (error) throw error
    if (!data) return []
    
    // Enrich with steps info
    const enriched = await Promise.all(
      data.map(async (item) => {
        const taskId = (item.tasks as any).id || item.task_id
        const steps = await this.getTaskSteps(taskId)
        const completions = await this.getStepCompletions(item.id)
        
        return {
          ...item,
          task_title: (item.tasks as any).title,
          task_icon: (item.tasks as any).icon,
          task_effort: (item.tasks as any).effort_points,
          task_zone_name: (item.tasks as any).zones?.name,
          task_zone_icon: (item.tasks as any).zones?.icon,
          member_email: (item.home_members as any).email,
          member_name: (item.home_members as any).profiles?.full_name,
          task_steps: steps,
          completed_steps_count: completions.length
        }
      })
    )
    
    return enriched
  },

  async completeTask(assignmentId: number, memberId: number, notes?: string, evidenceUrl?: string) {
    if (!supabase) throw new Error('Supabase not configured')
    
    // Get assignment details
    const { data: assignment } = await supabase
      .from('task_assignments')
      .select('*, tasks(effort_points)')
      .eq('id', assignmentId)
      .single()
    
    if (!assignment) throw new Error('Assignment not found')
    
    const pointsEarned = (assignment.tasks as any).effort_points || 1
    
    // Create completion record
    const { data: completion, error: completionError } = await supabase
      .from('task_completions')
      .insert({
        assignment_id: assignmentId,
        member_id: memberId,
        notes,
        evidence_url: evidenceUrl,
        points_earned: pointsEarned
      })
      .select()
      .single()
    
    if (completionError) throw completionError
    
    // Update assignment status
    await supabase
      .from('task_assignments')
      .update({ status: 'completed' })
      .eq('id', assignmentId)
    
    // Update member points directly (no stored procedure)
    const { data: member } = await supabase
      .from('home_members')
      .select('total_points, tasks_completed')
      .eq('id', memberId)
      .single()
    
    if (member) {
      await supabase
        .from('home_members')
        .update({ 
          total_points: (member.total_points || 0) + pointsEarned,
          tasks_completed: (member.tasks_completed || 0) + 1
        })
        .eq('id', memberId)
    }
    
    return completion
  },

  async createTaskAssignment(taskId: number, memberId: number, assignedDate?: Date, dueDate?: Date) {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { data, error } = await supabase
      .from('task_assignments')
      .insert({
        task_id: taskId,
        member_id: memberId,
        assigned_date: assignedDate?.toISOString() || new Date().toISOString(),
        due_date: dueDate?.toISOString(),
        status: 'pending'
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async autoAssignTasks(homeId: number, startDate?: Date) {
    if (!supabase) throw new Error('Supabase not configured')
    
    const assignDate = startDate || new Date()
    
    // Get all active tasks for this home
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('home_id', homeId)
      .eq('is_active', true)
    
    if (!tasks || tasks.length === 0) return []
    
    // Get active members ordered by total points (for equitable distribution)
    const { data: members } = await supabase
      .from('home_members')
      .select('id')
      .eq('home_id', homeId)
      .eq('status', 'active')
      .order('total_points', { ascending: true })
    
    if (!members || members.length === 0) return []
    
    const assignments = []
    let memberIndex = 0
    
    for (const task of tasks) {
      const member = members[memberIndex]
      
      // Calculate due date based on frequency
      let dueDate = new Date(assignDate)
      switch (task.frequency) {
        case 'daily':
          dueDate.setDate(dueDate.getDate() + 1)
          break
        case 'weekly':
          dueDate.setDate(dueDate.getDate() + 7)
          break
        case 'biweekly':
          dueDate.setDate(dueDate.getDate() + 14)
          break
        case 'monthly':
          dueDate.setMonth(dueDate.getMonth() + 1)
          break
      }
      
      const assignment = await this.createTaskAssignment(
        task.id,
        member.id,
        assignDate,
        dueDate
      )
      
      assignments.push(assignment)
      
      // Rotate to next member
      memberIndex = (memberIndex + 1) % members.length
    }
    
    return assignments
  },

  async requestTaskExchange(requesterId: number, taskAssignmentId: number, requestType: 'swap' | 'help', targetMemberId?: number, message?: string) {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { data, error } = await supabase
      .from('task_exchange_requests')
      .insert({
        requester_id: requesterId,
        task_assignment_id: taskAssignmentId,
        request_type: requestType,
        target_member_id: targetMemberId,
        message,
        status: 'pending'
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async respondToExchangeRequest(requestId: number, responderId: number, accept: boolean) {
    if (!supabase) throw new Error('Supabase not configured')
    
    const status = accept ? 'accepted' : 'rejected'
    
    const { data, error } = await supabase
      .from('task_exchange_requests')
      .update({
        responder_id: responderId,
        status,
        responded_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select()
      .single()
    
    if (error) throw error
    
    // If accepted and it's a swap, reassign the task
    if (accept) {
      const { data: request } = await supabase
        .from('task_exchange_requests')
        .select('*, task_assignments(*)')
        .eq('id', requestId)
        .single()
      
      if (request && request.task_assignments) {
        await supabase
          .from('task_assignments')
          .update({ member_id: responderId })
          .eq('id', request.task_assignment_id)
      }
    }
    
    return data
  },

  async getExchangeRequests(memberId: number, includeResponded = false) {
    if (!supabase) return []
    
    let query = supabase
      .from('task_exchange_requests')
      .select(`
        *,
        task_assignments (
          *,
          tasks (*)
        ),
        requester:home_members!requester_id (
          email,
          profiles (full_name)
        )
      `)
      .or(`requester_id.eq.${memberId},target_member_id.eq.${memberId}`)
    
    if (!includeResponded) {
      query = query.eq('status', 'pending')
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // ========== CHALLENGES ==========

  async getChallenges(homeId: number, activeOnly = true): Promise<ChallengeWithParticipants[]> {
    if (!supabase) return []
    
    let query = supabase
      .from('challenges')
      .select(`
        *,
        challenge_participants (
          count
        )
      `)
      .eq('home_id', homeId)
    
    if (activeOnly) {
      query = query.eq('is_active', true)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) throw error
    
    return data.map(item => ({
      ...item,
      participant_count: (item.challenge_participants as any)?.length || 0
    }))
  },

  async joinChallenge(challengeId: number, memberId: number) {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { data, error } = await supabase
      .from('challenge_participants')
      .insert({
        challenge_id: challengeId,
        member_id: memberId,
        status: 'joined'
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // ========== ACHIEVEMENTS ==========

  async getAchievements(): Promise<Achievement[]> {
    if (!supabase) return []
    
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data
  },

  async getMemberAchievements(memberId: number): Promise<Achievement[]> {
    if (!supabase) return []
    
    const { data, error } = await supabase
      .from('member_achievements')
      .select('*, achievements(*)')
      .eq('member_id', memberId)
    
    if (error) throw error
    return data.map(item => item.achievements as any as Achievement)
  },

  async checkAndUnlockAchievements(memberId: number) {
    if (!supabase) throw new Error('Supabase not configured')
    
    // Get member stats
    const { data: member } = await supabase
      .from('home_members')
      .select('*')
      .eq('id', memberId)
      .single()
    
    if (!member) return []
    
    // Get all achievements
    const { data: allAchievements } = await supabase
      .from('achievements')
      .select('*')
    
    if (!allAchievements) return []
    
    // Get already unlocked achievements
    const { data: unlockedAchievements } = await supabase
      .from('member_achievements')
      .select('achievement_id')
      .eq('member_id', memberId)
    
    const unlockedIds = new Set(unlockedAchievements?.map(a => a.achievement_id) || [])
    
    const newlyUnlocked = []
    
    for (const achievement of allAchievements) {
      // Skip if already unlocked
      if (unlockedIds.has(achievement.id)) continue
      
      let shouldUnlock = false
      
      // Check requirements based on type
      switch (achievement.requirement_type) {
        case 'weeks_active':
          shouldUnlock = member.weeks_active >= achievement.requirement_value
          break
        case 'streak_days':
          shouldUnlock = member.current_streak >= achievement.requirement_value
          break
        case 'level_reached':
          const levelOrder = ['novice', 'solver', 'expert', 'master', 'visionary']
          const currentLevelIndex = levelOrder.indexOf(member.mastery_level)
          shouldUnlock = currentLevelIndex + 1 >= achievement.requirement_value
          break
        // Add more cases as needed
      }
      
      if (shouldUnlock) {
        // Unlock achievement
        await supabase
          .from('member_achievements')
          .insert({
            member_id: memberId,
            achievement_id: achievement.id
          })
        
        newlyUnlocked.push(achievement)
      }
    }
    
    return newlyUnlocked
  },

  // ========== PROPOSALS (Visionary) ==========

  async getProposals(homeId: number, status?: string): Promise<ProposalWithAuthor[]> {
    if (!supabase) return []
    
    let query = supabase
      .from('improvement_proposals')
      .select(`
        *,
        home_members (
          email,
          user_id,
          profiles (
            full_name
          )
        )
      `)
      .eq('home_id', homeId)
    
    if (status) {
      query = query.eq('status', status)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) throw error
    
    return data.map(item => ({
      ...item,
      author_email: (item.home_members as any).email,
      author_name: (item.home_members as any).profiles?.full_name
    }))
  },

  async createProposal(homeId: number, memberId: number, proposalData: any) {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { data, error } = await supabase
      .from('improvement_proposals')
      .insert({
        ...proposalData,
        home_id: homeId,
        proposed_by: memberId
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async voteProposal(proposalId: number, memberId: number, vote: boolean) {
    if (!supabase) throw new Error('Supabase not configured')
    
    // Insert vote
    const { error: voteError } = await supabase
      .from('proposal_votes')
      .insert({
        proposal_id: proposalId,
        member_id: memberId,
        vote
      })
    
    if (voteError) throw voteError
    
    // Update vote counts directly (no stored procedure)
    const { data: proposal } = await supabase
      .from('improvement_proposals')
      .select('votes_yes, votes_no')
      .eq('id', proposalId)
      .single()
    
    if (proposal) {
      const updates = vote 
        ? { votes_yes: (proposal.votes_yes || 0) + 1 }
        : { votes_no: (proposal.votes_no || 0) + 1 }
      
      await supabase
        .from('improvement_proposals')
        .update(updates)
        .eq('id', proposalId)
    }
  },

  // ========== METRICS & ANALYTICS ==========

  async getHomeMetrics(homeId: number): Promise<HomeMetrics> {
    if (!supabase) {
      return {
        completion_percentage: 0,
        rotation_percentage: 0,
        total_tasks: 0,
        completed_tasks: 0,
        pending_tasks: 0,
        active_members: 0,
        total_points_earned: 0,
        consecutive_weeks: 0
      }
    }
    
    // Get completion stats
    const today = new Date().toISOString().split('T')[0]
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const weekStartStr = weekStart.toISOString().split('T')[0]
    
    const { data: assignments } = await supabase
      .from('task_assignments')
      .select('*, home_members!inner(home_id)')
      .eq('home_members.home_id', homeId)
      .gte('assigned_date', weekStartStr)
    
    const totalTasks = assignments?.length || 0
    const completedTasks = assignments?.filter(a => a.status === 'completed').length || 0
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    
    // Get member count
    const { data: members } = await supabase
      .from('home_members')
      .select('id, total_points')
      .eq('home_id', homeId)
      .eq('status', 'active')
    
    const totalPoints = members?.reduce((sum, m) => sum + m.total_points, 0) || 0
    
    // Calculate rotation percentage (equitable distribution)
    const rotationPercentage = await this.calculateRotationPercentage(homeId, weekStartStr, today)
    
    return {
      completion_percentage: completionPercentage,
      rotation_percentage: rotationPercentage,
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      pending_tasks: totalTasks - completedTasks,
      active_members: members?.length || 0,
      total_points_earned: totalPoints,
      consecutive_weeks: 4 // TODO: Calculate from history
    }
  },

  async calculateRotationPercentage(homeId: number, startDate: string, endDate: string): Promise<number> {
    if (!supabase) return 0
    
    // Get task counts per member for the period
    const { data: assignments } = await supabase
      .from('task_assignments')
      .select('member_id, home_members!inner(home_id)')
      .eq('home_members.home_id', homeId)
      .gte('assigned_date', startDate)
      .lte('assigned_date', endDate)
    
    if (!assignments || assignments.length === 0) return 100
    
    // Count tasks per member
    const taskCounts: { [key: number]: number } = {}
    assignments.forEach(a => {
      taskCounts[a.member_id] = (taskCounts[a.member_id] || 0) + 1
    })
    
    const counts = Object.values(taskCounts)
    if (counts.length === 0) return 100
    
    const maxTasks = Math.max(...counts)
    const minTasks = Math.min(...counts)
    
    if (maxTasks === 0) return 100
    
    // Calculate equity: 100% means perfect distribution, lower means imbalance
    const equityPercentage = 100 - Math.round(((maxTasks - minTasks) / maxTasks) * 100)
    
    return Math.max(0, equityPercentage)
  },

  async getMemberMetrics(memberId: number): Promise<MemberMetrics> {
    if (!supabase) {
      return {
        member_id: memberId,
        member_email: '',
        tasks_completed: 0,
        tasks_pending: 0,
        points_earned: 0,
        completion_rate: 0
      }
    }
    
    const { data: member } = await supabase
      .from('home_members')
      .select('*, profiles(full_name)')
      .eq('id', memberId)
      .single()
    
    const { data: assignments } = await supabase
      .from('task_assignments')
      .select('*')
      .eq('member_id', memberId)
    
    const completed = assignments?.filter(a => a.status === 'completed').length || 0
    const pending = assignments?.filter(a => a.status === 'pending').length || 0
    const total = assignments?.length || 0
    
    return {
      member_id: memberId,
      member_name: (member?.profiles as any)?.full_name,
      member_email: member?.email || '',
      tasks_completed: completed,
      tasks_pending: pending,
      points_earned: member?.total_points || 0,
      completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0
    }
  },

  // ========== ZONE PRESETS ==========
  
  async getZonePresets(): Promise<string[]> {
    if (!supabase) {
      return ["cocina", "sala", "baño", "habitaciones", "entrada"];
    }
    
    try {
      const { data, error } = await supabase
        .from('zone_presets')
        .select('name')
        .order('display_order');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        return data.map((z: any) => z.name);
      }
      
      // Fallback to hardcoded zones
      return ["cocina", "sala", "baño", "habitaciones", "entrada"];
    } catch (error) {
      console.error('Error loading zone presets:', error);
      return ["cocina", "sala", "baño", "habitaciones", "entrada"];
    }
  },

  // ========== TASK TEMPLATES WITH STEPS ==========
  
  async getTaskTemplatesWithSteps(publicOnly = true) {
    if (!supabase) return [];

    try {
      let query = supabase
        .from('task_templates')
        .select(`
          id,
          name,
          title,
          icon,
          zone,
          frequency,
          effort_points,
          task_template_steps (
            step_order,
            title,
            is_optional
          )
        `)
        .order('id');

      if (publicOnly) {
        query = query.eq('is_public', true);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      return (data || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        title: t.title,
        icon: t.icon,
        zone: t.zone,
        frequency: t.frequency,
        effort_points: t.effort_points,
        steps: (t.task_template_steps || []).sort((a: any, b: any) => a.step_order - b.step_order)
      }));
    } catch (error) {
      console.error('Error loading task templates with steps:', error);
      return [];
    }
  },

  // ========== USER HOME MEMBERSHIP ==========
  
  async getUserHomeMembership(userId: string): Promise<{ member: HomeMember | null; home: Home | null }> {
    if (!supabase) {
      return { member: null, home: null };
    }

    try {
      const { data, error } = await supabase
        .from('home_members')
        .select('*, homes(*)')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data && data.homes) {
        return {
          member: data as HomeMember,
          home: data.homes as any as Home
        };
      }
      
      return { member: null, home: null };
    } catch (error) {
      console.error('Error loading user home membership:', error);
      return { member: null, home: null };
    }
  },

  // ========== MEMBER ACHIEVEMENTS COUNT ==========
  
  async getMemberAchievementsCount(memberId: number): Promise<number> {
    if (!supabase) return 0;

    try {
      const { data, error } = await supabase
        .from('member_achievements')
        .select('id')
        .eq('member_id', memberId);
      
      if (error) throw error;
      
      return data?.length || 0;
    } catch (error) {
      console.error('Error counting member achievements:', error);
      return 0;
    }
  },

  // ========== UPDATE MEMBER MASTERY LEVEL ==========
  
  async updateMemberMasteryLevel(memberId: number, masteryLevel: string): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');

    try {
      const { error } = await supabase
        .from('home_members')
        .update({ mastery_level: masteryLevel })
        .eq('id', memberId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating mastery level:', error);
      throw error;
    }
  },

  // ========== TASK FAVORITES ==========
  
  async addTaskFavorite(taskId: number, memberId: number): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');

    try {
      const { error } = await supabase
        .from('task_favorites')
        .insert({
          task_id: taskId,
          member_id: memberId
        });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error adding favorite:', error);
      throw error;
    }
  },

  async removeTaskFavorite(taskId: number, memberId: number): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');

    try {
      const { error } = await supabase
        .from('task_favorites')
        .delete()
        .eq('task_id', taskId)
        .eq('member_id', memberId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error removing favorite:', error);
      throw error;
    }
  },

  async getMemberFavorites(memberId: number): Promise<number[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('task_favorites')
        .select('task_id')
        .eq('member_id', memberId);
      
      if (error) throw error;
      
      return data?.map(f => f.task_id) || [];
    } catch (error) {
      console.error('Error loading favorites:', error);
      return [];
    }
  }
}

export default db
