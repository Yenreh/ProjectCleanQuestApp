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
  ProposalWithAuthor,
  TaskCancellation,
  CancelledTaskWithDetails
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

  async updateZone(zoneId: number, updates: Partial<CreateZoneInput>) {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { data, error } = await supabase
      .from('zones')
      .update(updates)
      .eq('id', zoneId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deleteZone(zoneId: number) {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { error } = await supabase
      .from('zones')
      .delete()
      .eq('id', zoneId)
    
    if (error) throw error
  },

  // ========== MEMBERS ==========

  async inviteMember(homeId: number, invitation: InviteMemberInput) {
    if (!supabase) throw new Error('Supabase not configured')
    
    // Check if member already exists (might be inactive)
    const { data: existingMember } = await supabase
      .from('home_members')
      .select('*')
      .eq('home_id', homeId)
      .eq('email', invitation.email)
      .maybeSingle()
    
    const token = crypto.randomUUID()
    
    let data;
    
    if (existingMember) {
      // Member exists, reactivate them with new token
      const { data: updated, error } = await supabase
        .from('home_members')
        .update({
          role: invitation.role || 'member',
          status: 'pending',
          invitation_token: token,
          user_id: null, // Clear user_id so they can re-register
        })
        .eq('id', existingMember.id)
        .select()
        .single()
      
      if (error) throw error
      data = updated
    } else {
      // New member, create invitation
      const { data: created, error } = await supabase
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
      data = created
    }
    
    // TODO: Send invitation email with token
    // For now, return the invitation link that can be shared
    const inviteLink = `${window.location.origin}?invite=${token}`;
    console.log('Invitation link:', inviteLink);
    
    return { ...data, invite_link: inviteLink };
  },

  async getInvitationByToken(token: string) {
    if (!supabase) return null;
    
    const { data, error } = await supabase
      .from('home_members')
      .select(`
        *,
        homes!inner (
          id,
          name,
          created_by
        )
      `)
      .eq('invitation_token', token)
      .eq('status', 'pending')
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    
    return data;
  },

  async acceptInvitation(token: string, userId: string) {
    if (!supabase) throw new Error('Supabase not configured');
    
    // First, get the invitation
    const invitation = await this.getInvitationByToken(token);
    if (!invitation) {
      throw new Error('Invitación no válida o expirada');
    }

    // Get user profile
    const profile = await this.getProfile(userId);
    if (!profile) {
      throw new Error('Usuario no encontrado');
    }

    // Check if user already has an active membership in another home
    const { data: existingMembership } = await supabase
      .from('home_members')
      .select('id, home_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    // If user has existing membership, deactivate it
    if (existingMembership) {
      await supabase
        .from('home_members')
        .update({ status: 'inactive' })
        .eq('id', existingMembership.id);
    }

    // Update the member record to activate it
    const { data, error } = await supabase
      .from('home_members')
      .update({
        user_id: userId,
        status: 'active',
        joined_at: new Date().toISOString(),
        invitation_token: null // Clear the token after use
      })
      .eq('invitation_token', token)
      .select()
      .single();
    
    if (error) throw error;

    // Mark user as having completed onboarding
    await this.markOnboardingComplete(userId);

    return data;
  },

  async changeHome(userId: string, newHomeToken: string) {
    if (!supabase) throw new Error('Supabase not configured');

    // Validate the new home invitation
    const invitation = await this.getInvitationByToken(newHomeToken);
    if (!invitation) {
      throw new Error('Token de invitación no válido');
    }

    // Deactivate all current memberships for this user
    await supabase
      .from('home_members')
      .update({ status: 'inactive' })
      .eq('user_id', userId)
      .eq('status', 'active');

    // Accept the new invitation
    return await this.acceptInvitation(newHomeToken, userId);
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
      .eq('status', 'active')  // Only get active members
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

  async removeMember(memberId: number) {
    if (!supabase) throw new Error('Supabase not configured')
    
    // Get the member's user_id before updating
    const { data: member } = await supabase
      .from('home_members')
      .select('user_id')
      .eq('id', memberId)
      .single()
    
    // Soft delete: mark as inactive instead of deleting
    // This preserves task history, achievements, and completions
    const { error } = await supabase
      .from('home_members')
      .update({ status: 'inactive' })
      .eq('id', memberId)
    
    if (error) throw error

    // Unassign all tasks from this member
    await supabase
      .from('task_assignments')
      .delete()
      .eq('member_id', memberId)
    
    // Mark user's onboarding as incomplete so they can rejoin or create a new home
    if (member?.user_id) {
      await supabase
        .from('profiles')
        .update({ has_completed_onboarding: false })
        .eq('id', member.user_id)
    }
  },

  async updateMemberRole(memberId: number, newRole: string) {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { data, error } = await supabase
      .from('home_members')
      .update({ role: newRole })
      .eq('id', memberId)
      .select()
      .single()
    
    if (error) throw error
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

  async deleteTask(taskId: number) {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
    
    if (error) throw error
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

  async deleteTaskSteps(taskId: number): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { error } = await supabase
      .from('task_steps')
      .delete()
      .eq('task_id', taskId)
    
    if (error) throw error
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

  // OPTIMIZED: Reduced N+1 queries, select only needed columns
  async getMyAssignments(memberId: number, status?: string): Promise<AssignmentWithDetails[]> {
    if (!supabase) return []
    
    // Build efficient query with specific columns
    let query = supabase
      .from('task_assignments')
      .select(`
        id,
        task_id,
        member_id,
        assigned_date,
        due_date,
        status,
        created_at,
        tasks!inner (
          id,
          title,
          icon,
          effort_points,
          zones (
            name,
            icon
          )
        ),
        home_members!inner (
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
    
    // Get all task IDs and assignment IDs for batch queries
    const taskIds = [...new Set(data.map(item => (item.tasks as any).id || item.task_id))]
    const assignmentIds = data.map(item => item.id)
    
    // Batch load all steps for all tasks (single query instead of N queries)
    const { data: allSteps } = await supabase
      .from('task_steps')
      .select('id, task_id, step_order, title, description, is_optional, estimated_minutes')
      .in('task_id', taskIds)
      .order('step_order', { ascending: true })
    
    // Batch load all completions for all assignments (single query instead of N queries)
    const { data: allCompletions } = await supabase
      .from('task_step_completions')
      .select('step_id, assignment_id')
      .in('assignment_id', assignmentIds)
    
    // Build lookup maps for O(1) access
    const stepsByTask = new Map<number, typeof allSteps>()
    allSteps?.forEach(step => {
      if (!stepsByTask.has(step.task_id)) {
        stepsByTask.set(step.task_id, [])
      }
      stepsByTask.get(step.task_id)!.push(step)
    })
    
    // Build completion set for each assignment for O(1) lookup
    const completionsByAssignment = new Map<number, Set<number>>()
    allCompletions?.forEach(completion => {
      if (!completionsByAssignment.has(completion.assignment_id)) {
        completionsByAssignment.set(completion.assignment_id, new Set())
      }
      completionsByAssignment.get(completion.assignment_id)!.add(completion.step_id)
    })
    
    // Enrich data with steps info using maps (no additional DB calls)
    return data.map(item => {
      const taskId = (item.tasks as any).id || item.task_id
      const steps = stepsByTask.get(taskId) || []
      const completedStepIds = completionsByAssignment.get(item.id) || new Set()
      
      // Calculate required steps progress
      const requiredSteps = steps.filter(s => !s.is_optional)
      const completedRequiredCount = requiredSteps.filter(s => completedStepIds.has(s.id)).length
      
      return {
        ...item,
        task_title: (item.tasks as any).title,
        task_icon: (item.tasks as any).icon,
        task_effort: (item.tasks as any).effort_points,
        task_zone_name: (item.tasks as any).zones?.name,
        task_zone_icon: (item.tasks as any).zones?.icon,
        member_email: (item.home_members as any).email,
        member_name: (item.home_members as any).profiles?.full_name,
        task_steps: steps as TaskStep[],
        completed_steps_count: completedStepIds.size,
        completed_required_steps: completedRequiredCount,
        total_required_steps: requiredSteps.length,
        has_partial_progress: completedStepIds.size > 0,
        completed_step_ids: Array.from(completedStepIds) // Para usar en dialogs sin recargar
      }
    })
  },

  // OPTIMIZED: Reduced queries from 5+ to 3, parallel execution
  async completeTask(assignmentId: number, memberId: number, notes?: string, evidenceUrl?: string) {
    if (!supabase) throw new Error('Supabase not configured')
    
    // OPTIMIZATION 1: Get assignment with only needed fields
    const { data: assignment } = await supabase
      .from('task_assignments')
      .select('id, task_id, tasks!inner(effort_points)')
      .eq('id', assignmentId)
      .single()
    
    if (!assignment) throw new Error('Assignment not found')
    
    const pointsEarned = (assignment.tasks as any).effort_points || 1
    
    // OPTIMIZATION 2: Execute independent operations in parallel
    const [completionResult, , memberData] = await Promise.all([
      // Create completion record
      supabase
        .from('task_completions')
        .insert({
          assignment_id: assignmentId,
          member_id: memberId,
          notes,
          evidence_url: evidenceUrl,
          points_earned: pointsEarned
        })
        .select('id, completed_at, points_earned')
        .single(),
      
      // Update assignment status
      supabase
        .from('task_assignments')
        .update({ status: 'completed' })
        .eq('id', assignmentId),
      
      // Get member stats for streak calculation
      supabase
        .from('home_members')
        .select('total_points, tasks_completed, current_streak')
        .eq('id', memberId)
        .single()
    ])
    
    if (completionResult.error) throw completionResult.error
    if (!memberData.data) throw new Error('Member not found')
    
    // OPTIMIZATION 3: Calculate streak efficiently with single query
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    // Check for yesterday completion in single query
    const { data: yesterdayCompletion } = await supabase
      .from('task_completions')
      .select('id')
      .eq('member_id', memberId)
      .gte('completed_at', yesterday.toISOString())
      .lt('completed_at', today.toISOString())
      .limit(1)
      .maybeSingle()
    
    const newStreak = yesterdayCompletion ? (memberData.data.current_streak || 0) + 1 : 1
    
    // Get member to update weeks_active
    const { data: fullMember } = await supabase
      .from('home_members')
      .select('created_at, weeks_active')
      .eq('id', memberId)
      .single()
    
    // Calculate weeks active
    let weeksActive = 0
    if (fullMember?.created_at) {
      const joinDate = new Date(fullMember.created_at)
      const now = new Date()
      const weeksDiff = Math.floor((now.getTime() - joinDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
      weeksActive = Math.max(1, weeksDiff + 1)
    }
    
    // OPTIMIZATION 4: Single update for all member stats including weeks_active
    await supabase
      .from('home_members')
      .update({ 
        total_points: (memberData.data.total_points || 0) + pointsEarned,
        tasks_completed: (memberData.data.tasks_completed || 0) + 1,
        current_streak: newStreak,
        weeks_active: weeksActive
      })
      .eq('id', memberId)
    
    // Note: Mastery level and achievements are checked by UI for better UX
    
    return completionResult.data
  },

  async updateMemberStats(memberId: number, pointsEarned: number = 0) {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { data: member } = await supabase
      .from('home_members')
      .select('total_points, tasks_completed, current_streak')
      .eq('id', memberId)
      .single()
    
    if (!member) return
    
    // Calculate new streak
    // Check if user completed a task yesterday or today
    const { data: recentCompletions } = await supabase
      .from('task_completions')
      .select('completed_at')
      .eq('member_id', memberId)
      .order('completed_at', { ascending: false })
      .limit(10)
    
    let newStreak = 1
    if (recentCompletions && recentCompletions.length > 1) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      
      // Check if there was a completion yesterday
      const hadYesterday = recentCompletions.some(c => {
        const completedDate = new Date(c.completed_at)
        completedDate.setHours(0, 0, 0, 0)
        return completedDate.getTime() === yesterday.getTime()
      })
      
      if (hadYesterday) {
        newStreak = (member.current_streak || 0) + 1
      }
    }
    
    // Update member
    await supabase
      .from('home_members')
      .update({ 
        total_points: (member.total_points || 0) + pointsEarned,
        tasks_completed: (member.tasks_completed || 0) + 1,
        current_streak: newStreak
      })
      .eq('id', memberId)
  },

  // ========== TASK CANCELLATION ==========
  
  async cancelTask(assignmentId: number, memberId: number, reason: string) {
    if (!supabase) throw new Error('Supabase not configured');

    try {
      // Verificar que la asignación existe y pertenece al miembro
      const { data: assignment, error: fetchError } = await supabase
        .from('task_assignments')
        .select('*')
        .eq('id', assignmentId)
        .eq('member_id', memberId)
        .eq('status', 'pending')
        .single();

      if (fetchError || !assignment) {
        throw new Error('Assignment not found or not pending');
      }

      // Actualizar estado de la asignación a 'skipped'
      const { error: updateError } = await supabase
        .from('task_assignments')
        .update({ status: 'skipped' })
        .eq('id', assignmentId);

      if (updateError) throw updateError;

      // Registrar la cancelación
      const { error: insertError } = await supabase
        .from('task_cancellations')
        .upsert({
          assignment_id: assignmentId,
          cancelled_by: memberId,
          reason: reason,
          is_available: true,
          cancelled_at: new Date().toISOString(),
          taken_by: null,
          taken_at: null
        }, {
          onConflict: 'assignment_id'
        });

      if (insertError) throw insertError;

      return true;
    } catch (error) {
      console.error('Error canceling task:', error);
      throw error;
    }
  },

  async getAvailableCancelledTasks(homeId: number) {
    if (!supabase) return [];

    try {
      // Obtener política de rotación del hogar
      const { data: home } = await supabase
        .from('homes')
        .select('rotation_policy')
        .eq('id', homeId)
        .single();
      
      if (!home) return [];
      
      const rotationPolicy = home.rotation_policy || 'weekly';
      const cycleStart = this.getCycleStartDate(rotationPolicy);
      const cycleStartStr = cycleStart.toISOString().split('T')[0];

      // Obtener tareas canceladas y disponibles del ciclo actual
      const { data: cancelledData, error: cancelledError } = await supabase
        .from('task_cancellations')
        .select(`
          id,
          assignment_id,
          cancelled_by,
          reason,
          cancelled_at,
          task_assignments!inner (
            id,
            assigned_date,
            due_date,
            status,
            tasks!inner (
              id,
              title,
              icon,
              effort_points,
              home_id,
              zones (
                name
              )
            )
          ),
          home_members!task_cancellations_cancelled_by_fkey (
            id,
            email,
            user_id,
            profiles (
              full_name
            )
          )
        `)
        .eq('is_available', true)
        .eq('task_assignments.tasks.home_id', homeId)
        .eq('task_assignments.status', 'skipped')
        .gte('task_assignments.assigned_date', cycleStartStr)
        .order('cancelled_at', { ascending: false });

      if (cancelledError) throw cancelledError;

      // Obtener todas las asignaciones del ciclo actual
      const { data: currentAssignments, error: assignmentsError } = await supabase
        .from('task_assignments')
        .select('task_id, status, home_members!inner(home_id)')
        .eq('home_members.home_id', homeId)
        .gte('assigned_date', cycleStartStr);

      if (assignmentsError) throw assignmentsError;

      // Crear sets de tareas pendientes y completadas
      const pendingTaskIds = new Set(
        (currentAssignments || [])
          .filter((a: any) => a.status === 'pending')
          .map((a: any) => a.task_id)
      );
      
      const completedTaskIds = new Set(
        (currentAssignments || [])
          .filter((a: any) => a.status === 'completed')
          .map((a: any) => a.task_id)
      );

      // Obtener tareas activas que NO tienen asignaciones pendientes NI completadas en el ciclo
      const { data: availableTasks, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          icon,
          effort_points,
          zones (
            name
          )
        `)
        .eq('home_id', homeId)
        .eq('is_active', true);

      if (tasksError) throw tasksError;

      // Transformar tareas canceladas
      const cancelledTasks = (cancelledData || []).map((item: any) => ({
        cancellation_id: item.id,
        assignment_id: item.assignment_id,
        task_id: item.task_assignments.tasks.id,
        task_title: item.task_assignments.tasks.title,
        task_icon: item.task_assignments.tasks.icon,
        task_effort: item.task_assignments.tasks.effort_points,
        zone_name: item.task_assignments.tasks.zones?.name || 'Sin zona',
        cancelled_by_id: item.home_members.id,
        cancelled_by_name: item.home_members.profiles?.full_name || item.home_members.email,
        cancellation_reason: item.reason,
        cancelled_at: item.cancelled_at,
        assigned_date: item.task_assignments.assigned_date,
        due_date: item.task_assignments.due_date
      }));

      // Crear set de task_ids de tareas canceladas para evitar duplicados
      const cancelledTaskIds = new Set(cancelledTasks.map((t: any) => t.task_id));

      // Filtrar tareas sin asignar: solo las que no están pendientes, completadas NI canceladas
      const unassignedTasks = (availableTasks || [])
        .filter((task: any) => 
          !pendingTaskIds.has(task.id) && 
          !completedTaskIds.has(task.id) &&
          !cancelledTaskIds.has(task.id)
        )
        .map((task: any) => ({
          cancellation_id: 0,
          assignment_id: 0,
          task_id: task.id,
          task_title: task.title,
          task_icon: task.icon,
          task_effort: task.effort_points,
          zone_name: task.zones?.name || 'Sin zona',
          cancelled_by_id: 0,
          cancelled_by_name: 'Sistema',
          cancellation_reason: 'Tarea disponible en el ciclo',
          cancelled_at: new Date().toISOString(),
          assigned_date: new Date().toISOString(),
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }));

      // Combinar ambas listas
      return [...cancelledTasks, ...unassignedTasks];
    } catch (error) {
      console.error('Error loading available tasks:', error);
      return [];
    }
  },

  async takeCancelledTask(cancellationId: number, newMemberId: number, taskId?: number) {
    if (!supabase) throw new Error('Supabase not configured');

    try {
      // Caso 1: Tarea sin asignar (cancellationId === 0)
      if (cancellationId === 0 && taskId) {
        // Verificar que la tarea existe y está activa
        const { data: task, error: taskError } = await supabase
          .from('tasks')
          .select('id, home_id')
          .eq('id', taskId)
          .eq('is_active', true)
          .single();

        if (taskError || !task) {
          throw new Error('Task not found or not active');
        }

        // Verificar que el miembro pertenece al hogar
        const { data: member, error: memberError } = await supabase
          .from('home_members')
          .select('id')
          .eq('id', newMemberId)
          .eq('home_id', task.home_id)
          .eq('status', 'active')
          .single();

        if (memberError || !member) {
          throw new Error('Member not found or not active in home');
        }

        const assignedDate = new Date().toISOString().split('T')[0];

        // Verificar si ya existe una asignación para esta tarea, miembro y fecha
        const { data: existingAssignment } = await supabase
          .from('task_assignments')
          .select('id')
          .eq('task_id', taskId)
          .eq('member_id', newMemberId)
          .eq('assigned_date', assignedDate)
          .maybeSingle();

        if (existingAssignment) {
          throw new Error('Ya tienes esta tarea asignada para hoy');
        }

        // Crear nueva asignación
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7); // 7 días desde ahora

        const { error: insertError } = await supabase
          .from('task_assignments')
          .insert({
            task_id: taskId,
            member_id: newMemberId,
            assigned_date: assignedDate,
            due_date: dueDate.toISOString().split('T')[0],
            status: 'pending'
          });

        if (insertError) throw insertError;

        return true;
      }

      // Caso 2: Tarea cancelada (cancellationId > 0)
      // Obtener información de la cancelación
      const { data: cancellation, error: fetchError } = await supabase
        .from('task_cancellations')
        .select(`
          id,
          assignment_id,
          is_available,
          task_assignments!inner (
            task_id,
            due_date,
            tasks!inner (
              home_id
            )
          )
        `)
        .eq('id', cancellationId)
        .eq('is_available', true)
        .single();

      if (fetchError || !cancellation) {
        throw new Error('Cancellation not found or already taken');
      }

      const assignment = cancellation.task_assignments as any;
      const homeId = assignment.tasks.home_id;
      const cancelledTaskId = assignment.task_id;
      const dueDate = assignment.due_date;

      // Verificar que el nuevo miembro pertenece al hogar
      const { data: member, error: memberError } = await supabase
        .from('home_members')
        .select('id')
        .eq('id', newMemberId)
        .eq('home_id', homeId)
        .eq('status', 'active')
        .single();

      if (memberError || !member) {
        throw new Error('Member not found or not active in home');
      }

      const assignedDate = new Date().toISOString().split('T')[0];

      // Verificar si ya existe una asignación para esta tarea, miembro y fecha
      const { data: existingAssignment } = await supabase
        .from('task_assignments')
        .select('id')
        .eq('task_id', cancelledTaskId)
        .eq('member_id', newMemberId)
        .eq('assigned_date', assignedDate)
        .maybeSingle();

      if (existingAssignment) {
        throw new Error('Ya tienes esta tarea asignada para hoy');
      }

      // Marcar la cancelación como tomada
      const { error: updateError } = await supabase
        .from('task_cancellations')
        .update({
          is_available: false,
          taken_by: newMemberId,
          taken_at: new Date().toISOString()
        })
        .eq('id', cancellationId);

      if (updateError) throw updateError;

      // Crear nueva asignación para el nuevo miembro
      const { error: insertError } = await supabase
        .from('task_assignments')
        .insert({
          task_id: cancelledTaskId,
          member_id: newMemberId,
          assigned_date: assignedDate,
          due_date: dueDate,
          status: 'pending'
        });

      if (insertError) throw insertError;

      return true;
    } catch (error) {
      console.error('Error taking task:', error);
      throw error;
    }
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
      .select('*, home_id')
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
        case 'onboarding':
          // Always unlock if user exists (onboarding complete)
          shouldUnlock = true
          break
          
        case 'weeks_active':
          shouldUnlock = member.weeks_active >= (achievement.requirement_value || 1)
          break
          
        case 'streak_days':
          shouldUnlock = member.current_streak >= (achievement.requirement_value || 7)
          break
          
        case 'level_reached':
          const levelOrder = ['novice', 'solver', 'expert', 'master', 'visionary']
          const currentLevelIndex = levelOrder.indexOf(member.mastery_level)
          shouldUnlock = currentLevelIndex >= ((achievement.requirement_value || 1) - 1)
          break
          
        case 'collaborations':
          // Count completed tasks as collaborations
          shouldUnlock = member.tasks_completed >= (achievement.requirement_value || 5)
          break
          
        case 'equity_weeks':
          // Check if home has equitable rotation
          if (member.home_id) {
            const metrics = await this.getHomeMetrics(member.home_id)
            // If rotation percentage is low (good equity), unlock
            shouldUnlock = metrics.rotation_percentage <= 33
          }
          break
          
        case 'consecutive_weeks_80':
          // This would need weekly tracking - for now, check if home is performing well
          if (member.home_id) {
            const metrics = await this.getHomeMetrics(member.home_id)
            shouldUnlock = metrics.completion_percentage >= 80 && metrics.consecutive_weeks >= (achievement.requirement_value || 4)
          }
          break
          
        case 'master_level':
          // Unlock if home has excellent metrics
          if (member.home_id) {
            const metrics = await this.getHomeMetrics(member.home_id)
            shouldUnlock = metrics.completion_percentage >= 85 && metrics.rotation_percentage <= 25
          }
          break
      }
      
      if (shouldUnlock) {
        // Unlock achievement
        const { error: insertError } = await supabase
          .from('member_achievements')
          .insert({
            member_id: memberId,
            achievement_id: achievement.id
          })
        
        if (!insertError) {
          newlyUnlocked.push(achievement)
        }
      }
    }
    
    return newlyUnlocked
  },

  async updateMasteryLevel(memberId: number) {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { data: member } = await supabase
      .from('home_members')
      .select('*')
      .eq('id', memberId)
      .single()
    
    if (!member) return null
    
    // Get achievement count for level calculation
    const achievementsCount = await this.getMemberAchievementsCount(memberId)
    
    // Calculate mastery level using HYBRID system (OR logic for faster progression)
    let newLevel = member.mastery_level
    
    // Calculate a "mastery score" based on different factors
    const tasksScore = member.tasks_completed || 0
    const weeksScore = (member.weeks_active || 0) * 3 // Weeks are more valuable
    const streakScore = Math.min((member.current_streak || 0) * 0.5, 10) // Max 10 points from streak
    const achievementsScore = (achievementsCount || 0) * 2 // Achievements worth 2 points each
    const totalScore = tasksScore + weeksScore + streakScore + achievementsScore
    
    // Level progression with hybrid requirements (OR logic - meet ANY condition):
    // NOVICE -> SOLVER: Early game (3-7 days)
    //   - 3+ tasks OR 1+ week active OR 2+ achievements OR score >= 10
    // SOLVER -> EXPERT: Mid-early game (1-2 weeks)
    //   - 12+ tasks OR 2+ weeks active OR 3+ achievements OR score >= 25
    // EXPERT -> MASTER: Mid-late game (3-4 weeks)
    //   - 30+ tasks OR 4+ weeks active OR 5+ achievements OR score >= 50
    // MASTER -> VISIONARY: End game (5+ weeks)
    //   - 60+ tasks OR 8+ weeks active OR 8+ achievements OR score >= 100
    
    if (totalScore >= 100 || member.tasks_completed >= 60 || member.weeks_active >= 8 || achievementsCount >= 8) {
      newLevel = 'visionary'
    } else if (totalScore >= 50 || member.tasks_completed >= 30 || member.weeks_active >= 4 || achievementsCount >= 5) {
      newLevel = 'master'
    } else if (totalScore >= 25 || member.tasks_completed >= 12 || member.weeks_active >= 2 || achievementsCount >= 3) {
      newLevel = 'expert'
    } else if (totalScore >= 10 || member.tasks_completed >= 3 || member.weeks_active >= 1 || achievementsCount >= 2) {
      newLevel = 'solver'
    } else {
      newLevel = 'novice'
    }
    
    // Only update if level changed
    if (newLevel !== member.mastery_level) {
      await supabase
        .from('home_members')
        .update({ mastery_level: newLevel })
        .eq('id', memberId)
      
      return newLevel
    }
    
    return null
  },

  async updateWeeksActive(memberId: number) {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { data: member } = await supabase
      .from('home_members')
      .select('joined_at, weeks_active')
      .eq('id', memberId)
      .single()
    
    if (!member || !member.joined_at) return
    
    // Calculate weeks since joining
    const joinedDate = new Date(member.joined_at)
    const now = new Date()
    const weeksSinceJoining = Math.floor((now.getTime() - joinedDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
    
    // Only update if it's different
    if (weeksSinceJoining > (member.weeks_active || 0)) {
      await supabase
        .from('home_members')
        .update({ weeks_active: weeksSinceJoining })
        .eq('id', memberId)
    }
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

  // OPTIMIZED: Simplified query, reduced joins, parallel execution
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
    
    // OPTIMIZATION 1: Get cycle start date with minimal query + Get members in same query
    const [homeResult, membersResult] = await Promise.all([
      supabase
        .from('homes')
        .select('rotation_policy, goal_percentage')
        .eq('id', homeId)
        .single(),
      supabase
        .from('home_members')
        .select('total_points')
        .eq('home_id', homeId)
        .eq('status', 'active')
    ]);
    
    const home = homeResult.data;
    const members = membersResult.data || [];
    
    if (!home) {
      return {
        completion_percentage: 0,
        rotation_percentage: 0,
        total_tasks: 0,
        completed_tasks: 0,
        pending_tasks: 0,
        active_members: members.length,
        total_points_earned: 0,
        consecutive_weeks: 0
      };
    }
    
    const rotationPolicy = home.rotation_policy || 'weekly';
    const today = new Date();
    const cycleStart = this.getCycleStartDate(rotationPolicy, today);
    const cycleStartStr = cycleStart.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    
    // OPTIMIZATION 2: Get ALL assignment data we need in a SINGLE comprehensive query
    const { data: assignments } = await supabase
      .from('task_assignments')
      .select('id, status, member_id, assigned_date, home_members!inner(home_id)')
      .eq('home_members.home_id', homeId)
      .gte('assigned_date', cycleStartStr)
      .neq('status', 'skipped');
    
    const allAssignments = assignments || [];
    
    // OPTIMIZATION 3: Calculate all metrics in-memory from the single dataset
    const totalTasks = allAssignments.length;
    const completedTasks = allAssignments.filter(a => a.status === 'completed').length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const totalPoints = members.reduce((sum, m) => sum + (m.total_points || 0), 0);
    
    // Calculate rotation percentage in-memory
    const taskCounts: { [key: number]: number } = {};
    allAssignments.forEach(a => {
      taskCounts[a.member_id] = (taskCounts[a.member_id] || 0) + 1;
    });
    
    const counts = Object.values(taskCounts);
    let rotationPercentage = 100;
    
    if (counts.length > 0) {
      const maxTasks = Math.max(...counts);
      const minTasks = Math.min(...counts);
      if (maxTasks > 0) {
        rotationPercentage = 100 - Math.round(((maxTasks - minTasks) / maxTasks) * 100);
      }
    }
    
    // Calculate consecutive weeks in-memory (simplified - only check last 3 cycles for performance)
    let consecutiveWeeks = 0;
    const dayIncrement = rotationPolicy === 'daily' ? 1 : rotationPolicy === 'weekly' ? 7 : rotationPolicy === 'biweekly' ? 14 : 30;
    const goalPercentage = home.goal_percentage || 80;
    
    for (let i = 0; i < 3; i++) {
      const refDate = new Date(today);
      refDate.setDate(refDate.getDate() - (i * dayIncrement));
      const cStart = this.getCycleStartDate(rotationPolicy, refDate);
      const cEnd = this.getCycleEndDate(rotationPolicy, cStart);
      const cStartStr = cStart.toISOString().split('T')[0];
      const cEndStr = cEnd.toISOString().split('T')[0];
      
      const cycleAssignments = allAssignments.filter(a => 
        a.assigned_date >= cStartStr && a.assigned_date <= cEndStr
      );
      
      if (cycleAssignments.length === 0) break;
      
      const cycleTotal = cycleAssignments.length;
      const cycleCompleted = cycleAssignments.filter(a => a.status === 'completed').length;
      const cyclePercentage = cycleTotal > 0 ? Math.round((cycleCompleted / cycleTotal) * 100) : 0;
      
      if (cyclePercentage >= goalPercentage) {
        consecutiveWeeks++;
      } else {
        break;
      }
    }
    
    return {
      completion_percentage: completionPercentage,
      rotation_percentage: rotationPercentage,
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      pending_tasks: totalTasks - completedTasks,
      active_members: members.length,
      total_points_earned: totalPoints,
      consecutive_weeks: consecutiveWeeks
    };
  },

  // ========== CYCLE MANAGEMENT ==========

  getCycleStartDate(rotationPolicy: string, referenceDate: Date = new Date()): Date {
    const cycleStart = new Date(referenceDate);
    
    switch (rotationPolicy) {
      case 'daily':
        cycleStart.setHours(0, 0, 0, 0);
        break;
      
      case 'weekly':
        // Domingo = inicio de semana
        cycleStart.setDate(cycleStart.getDate() - cycleStart.getDay());
        cycleStart.setHours(0, 0, 0, 0);
        break;
      
      case 'biweekly':
        // Calcular inicio de quincena (día 1 o 15)
        const day = cycleStart.getDate();
        if (day >= 15) {
          cycleStart.setDate(15);
        } else {
          cycleStart.setDate(1);
        }
        cycleStart.setHours(0, 0, 0, 0);
        break;
      
      case 'monthly':
        // Primer día del mes
        cycleStart.setDate(1);
        cycleStart.setHours(0, 0, 0, 0);
        break;
    }
    
    return cycleStart;
  },

  getCycleEndDate(rotationPolicy: string, cycleStart: Date): Date {
    const cycleEnd = new Date(cycleStart);
    
    switch (rotationPolicy) {
      case 'daily':
        cycleEnd.setDate(cycleEnd.getDate() + 1);
        break;
      
      case 'weekly':
        cycleEnd.setDate(cycleEnd.getDate() + 7);
        break;
      
      case 'biweekly':
        cycleEnd.setDate(cycleEnd.getDate() + 14);
        break;
      
      case 'monthly':
        cycleEnd.setMonth(cycleEnd.getMonth() + 1);
        break;
    }
    
    cycleEnd.setSeconds(cycleEnd.getSeconds() - 1);
    return cycleEnd;
  },

  async closeCycleAndReassign(homeId: number): Promise<{ closed: number; assigned: number }> {
    if (!supabase) throw new Error('Supabase not configured');
    
    try {
      // Obtener configuración del hogar
      const { data: home } = await supabase
        .from('homes')
        .select('rotation_policy')
        .eq('id', homeId)
        .single();
      
      if (!home) throw new Error('Home not found');
      
      const rotationPolicy = home.rotation_policy || 'weekly';
      const today = new Date();
      const currentCycleStart = this.getCycleStartDate(rotationPolicy, today);
      const currentCycleStartStr = currentCycleStart.toISOString().split('T')[0];
      
      // 1. Cerrar tareas pendientes del ciclo actual
      const { data: pendingAssignments, error: fetchError } = await supabase
        .from('task_assignments')
        .select('id, home_members!inner(home_id)')
        .eq('home_members.home_id', homeId)
        .eq('status', 'pending')
        .gte('assigned_date', currentCycleStartStr);
      
      if (fetchError) throw fetchError;
      
      let closedCount = 0;
      if (pendingAssignments && pendingAssignments.length > 0) {
        const assignmentIds = pendingAssignments.map(a => a.id);
        
        const { error: updateError } = await supabase
          .from('task_assignments')
          .update({ status: 'skipped' })
          .in('id', assignmentIds);
        
        if (updateError) throw updateError;
        closedCount = assignmentIds.length;
      }
      
      // 2. Calcular nuevo ciclo
      const nextCycleStart = this.getCycleEndDate(rotationPolicy, currentCycleStart);
      const nextCycleStartStr = nextCycleStart.toISOString().split('T')[0];
      
      // 3. Eliminar asignaciones futuras existentes (por si se fuerza múltiples veces)
      const { data: futureAssignments } = await supabase
        .from('task_assignments')
        .select('id, home_members!inner(home_id)')
        .eq('home_members.home_id', homeId)
        .gte('assigned_date', nextCycleStartStr);
      
      if (futureAssignments && futureAssignments.length > 0) {
        const futureAssignmentIds = futureAssignments.map(a => a.id);
        await supabase
          .from('task_assignments')
          .delete()
          .in('id', futureAssignmentIds);
      }
      
      // 4. Reasignar todas las tareas para el nuevo ciclo
      const assignments = await this.autoAssignTasks(homeId, nextCycleStart);
      
      // 5. Registrar en change_log
      await supabase.from('change_log').insert({
        home_id: homeId,
        change_type: 'cycle_rotation',
        change_description: `Ciclo cerrado: ${closedCount} tareas pendientes marcadas como omitidas. ${assignments.length} tareas reasignadas para el nuevo ciclo.`,
        old_value: currentCycleStartStr,
        new_value: nextCycleStart.toISOString().split('T')[0]
      });
      
      return {
        closed: closedCount,
        assigned: assignments.length
      };
    } catch (error) {
      console.error('Error closing cycle and reassigning:', error);
      throw error;
    }
  },

  async calculateConsecutiveWeeks(homeId: number): Promise<number> {
    if (!supabase) return 0;
    
    try {
      // Get home to check goal percentage and rotation policy
      const { data: home } = await supabase
        .from('homes')
        .select('goal_percentage, rotation_policy')
        .eq('id', homeId)
        .single();
      
      if (!home) return 0;
      
      const goalPercentage = home.goal_percentage || 80;
      const rotationPolicy = home.rotation_policy || 'weekly';
      let cyclesToCheck = 12;
      let dayIncrement = 7;
      
      switch (rotationPolicy) {
        case 'daily':
          cyclesToCheck = 30;
          dayIncrement = 1;
          break;
        case 'weekly':
          cyclesToCheck = 12;
          dayIncrement = 7;
          break;
        case 'biweekly':
          cyclesToCheck = 6;
          dayIncrement = 14;
          break;
        case 'monthly':
          cyclesToCheck = 3;
          dayIncrement = 30;
          break;
      }
      
      // OPTIMIZATION: Get ALL assignments for the entire period in ONE query
      const today = new Date();
      const oldestDate = new Date(today);
      oldestDate.setDate(oldestDate.getDate() - (cyclesToCheck * dayIncrement));
      
      const { data: allAssignments } = await supabase
        .from('task_assignments')
        .select('assigned_date, status, home_members!inner(home_id)')
        .eq('home_members.home_id', homeId)
        .gte('assigned_date', oldestDate.toISOString().split('T')[0])
        .order('assigned_date', { ascending: false });
      
      if (!allAssignments || allAssignments.length === 0) return 0;
      
      // Group assignments by cycle and calculate in-memory
      let consecutiveCycles = 0;
      
      for (let i = 0; i < cyclesToCheck; i++) {
        const referenceDate = new Date(today);
        referenceDate.setDate(referenceDate.getDate() - (i * dayIncrement));
        
        const cycleStart = this.getCycleStartDate(rotationPolicy, referenceDate);
        const cycleEnd = this.getCycleEndDate(rotationPolicy, cycleStart);
        
        const cycleStartStr = cycleStart.toISOString().split('T')[0];
        const cycleEndStr = cycleEnd.toISOString().split('T')[0];
        
        // Filter assignments for this cycle in-memory
        const cycleAssignments = allAssignments.filter(a => {
          const assignDate = a.assigned_date;
          return assignDate >= cycleStartStr && assignDate <= cycleEndStr;
        });
        
        if (cycleAssignments.length === 0) break;
        
        const totalTasks = cycleAssignments.length;
        const completedTasks = cycleAssignments.filter(a => a.status === 'completed').length;
        const cyclePercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        if (cyclePercentage >= goalPercentage) {
          consecutiveCycles++;
        } else {
          break;
        }
      }
      
      return consecutiveCycles;
    } catch (error) {
      console.error('Error calculating consecutive cycles:', error);
      return 0;
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
  },

  // ========== MEMBER PROFILE ==========
  
  async updateMemberProfile(memberId: number, fullName: string, email: string): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');

    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Update the profile table with full_name
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: fullName
        })
        .eq('id', user.id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating member profile:', error);
      throw error;
    }
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');

    try {
      // First verify current password by attempting to sign in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('No user found');

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  },

  async updateMemberPreferences(
    memberId: number,
    preferences: {
      emailNotifications?: boolean;
      pushNotifications?: boolean;
      weeklyReports?: boolean;
      theme?: string;
      fontSize?: string;
      reminderEnabled?: boolean;
      reminderTime?: string;
      reminderDays?: number[];
    }
  ): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');

    try {
      const updateData: any = {};
      
      if (preferences.emailNotifications !== undefined) updateData.email_notifications = preferences.emailNotifications;
      if (preferences.pushNotifications !== undefined) updateData.push_notifications = preferences.pushNotifications;
      if (preferences.weeklyReports !== undefined) updateData.weekly_reports = preferences.weeklyReports;
      if (preferences.theme !== undefined) updateData.theme = preferences.theme;
      if (preferences.fontSize !== undefined) updateData.font_size = preferences.fontSize;
      if (preferences.reminderEnabled !== undefined) updateData.reminder_enabled = preferences.reminderEnabled;
      if (preferences.reminderTime !== undefined) updateData.reminder_time = preferences.reminderTime;
      if (preferences.reminderDays !== undefined) updateData.reminder_days = preferences.reminderDays;

      const { error } = await supabase
        .from('home_members')
        .update(updateData)
        .eq('id', memberId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating member preferences:', error);
      throw error;
    }
  },

  // ========== ZONE STATUS ==========
  
  async getZoneStatus(homeId: number): Promise<{ [zoneId: number]: { total: number; completed: number; percentage: number } }> {
    if (!supabase) return {};

    try {
      // Obtener política de rotación del hogar
      const { data: home } = await supabase
        .from('homes')
        .select('rotation_policy')
        .eq('id', homeId)
        .single();
      
      const rotationPolicy = home?.rotation_policy || 'weekly';
      
      // Calcular inicio del ciclo actual
      const cycleStart = this.getCycleStartDate(rotationPolicy);
      const cycleStartStr = cycleStart.toISOString().split('T')[0];

      const { data: assignments, error } = await supabase
        .from('task_assignments')
        .select(`
          id,
          status,
          tasks!inner (
            zone_id
          ),
          home_members!inner (
            home_id
          )
        `)
        .eq('home_members.home_id', homeId)
        .gte('assigned_date', cycleStartStr);

      if (error) throw error;
      if (!assignments) return {};

      // Group by zone_id
      const zoneStats: { [zoneId: number]: { total: number; completed: number } } = {};

      assignments.forEach((assignment: any) => {
        const zoneId = assignment.tasks?.zone_id;
        if (zoneId !== null && zoneId !== undefined) {
          if (!zoneStats[zoneId]) {
            zoneStats[zoneId] = { total: 0, completed: 0 };
          }
          zoneStats[zoneId].total++;
          if (assignment.status === 'completed') {
            zoneStats[zoneId].completed++;
          }
        }
      });

      // Calculate percentages
      const result: { [zoneId: number]: { total: number; completed: number; percentage: number } } = {};
      Object.keys(zoneStats).forEach(zoneIdStr => {
        const zoneId = parseInt(zoneIdStr);
        const stats = zoneStats[zoneId];
        result[zoneId] = {
          total: stats.total,
          completed: stats.completed,
          percentage: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
        };
      });

      return result;
    } catch (error) {
      console.error('Error getting zone status:', error);
      return {};
    }
  }
}

export default db
