import { supabase } from './client'
import type {
  Task,
  TaskStep,
  TaskAssignment,
  TaskCompletion,
  CreateTaskInput,
  CreateTaskStepInput,
  CreateTaskTemplateInput,
  AssignmentWithDetails,
  TaskCancellation,
  CancelledTaskWithDetails
} from '../types'

/**
 * Tasks module
 * Handles task CRUD, assignments, completions, steps, templates, and favorites
 */

export const tasksModule = {
  async createTask(homeId: number, taskData: CreateTaskInput): Promise<any> {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { data: { user } } = await supabase.auth.getUser()
    
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

    const { data: { user } } = await supabase.auth.getUser()

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

    const { data: { user } } = await supabase.auth.getUser()

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
      .select('id, task_id, tasks!inner(effort_points, home_id)')
      .eq('id', assignmentId)
      .single()
    
    if (!assignment) throw new Error('Assignment not found')
    
    const pointsEarned = (assignment.tasks as any).effort_points || 1
    const homeId = (assignment.tasks as any).home_id
    
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
    
    // Calculate weeks active (only count completed weeks)
    let weeksActive = 0
    if (fullMember?.created_at) {
      const joinDate = new Date(fullMember.created_at)
      const now = new Date()
      const weeksDiff = Math.floor((now.getTime() - joinDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
      weeksActive = weeksDiff
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
    
    return {
      ...completionResult.data,
      task_id: assignment.task_id,
      home_id: homeId
    }
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

      // Actualizar estado de la asignación a 'skipped_cancelled'
      // (NO cuenta en estadísticas porque es una decisión del usuario)
      const { error: updateError } = await supabase
        .from('task_assignments')
        .update({ 
          status: 'skipped_cancelled'
        })
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
      const today = new Date();
      const cycleStart = this.getCycleStartDate(rotationPolicy, today);
      const cycleEnd = this.getCycleEndDate(rotationPolicy, cycleStart);
      const cycleStartStr = cycleStart.toISOString().split('T')[0];
      const cycleEndStr = cycleEnd.toISOString().split('T')[0];

      // Obtener tareas canceladas y disponibles del ciclo actual SOLAMENTE
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
        .in('task_assignments.status', ['skipped_expired', 'skipped_cancelled'])
        .gte('task_assignments.assigned_date', cycleStartStr)
        .lte('task_assignments.assigned_date', cycleEndStr)
        .order('cancelled_at', { ascending: false });

      if (cancelledError) throw cancelledError;

      // Obtener todas las asignaciones del ciclo actual
      const { data: currentAssignments, error: assignmentsError } = await supabase
        .from('task_assignments')
        .select('task_id, status, home_members!inner(home_id)')
        .eq('home_members.home_id', homeId)
        .gte('assigned_date', cycleStartStr)
        .lte('assigned_date', cycleEndStr);

      if (assignmentsError) throw assignmentsError;

      // Crear sets de tareas pendientes, completadas y canceladas (skipped de cualquier tipo)
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
      
      const skippedTaskIds = new Set(
        (currentAssignments || [])
          .filter((a: any) => a.status.startsWith('skipped_'))
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

      // Filtrar tareas sin asignar: solo las que NO están pendientes, completadas NI canceladas en el ciclo
      // Estas son tareas activas que nunca fueron asignadas en este ciclo
      const unassignedTasks = (availableTasks || [])
        .filter((task: any) => 
          !pendingTaskIds.has(task.id) && 
          !completedTaskIds.has(task.id) &&
          !skippedTaskIds.has(task.id)
        )
        .map((task: any) => {
          // Calcular due_date basado en el final del ciclo
          const dueDate = new Date(cycleEnd);
          dueDate.setDate(dueDate.getDate() - 1); // Un día antes del fin del ciclo
          
          return {
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
            cancelled_at: today.toISOString(),
            assigned_date: today.toISOString().split('T')[0],
            due_date: dueDate.toISOString().split('T')[0]
          };
        });

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
    
    // IMPORTANTE: Convertir fechas a formato DATE (YYYY-MM-DD) para consistency
    const assignedDateStr = (assignedDate || new Date()).toISOString().split('T')[0];
    const dueDateStr = dueDate ? dueDate.toISOString().split('T')[0] : null;
    
    const { data, error } = await supabase
      .from('task_assignments')
      .insert({
        task_id: taskId,
        member_id: memberId,
        assigned_date: assignedDateStr,
        due_date: dueDateStr,
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

  async getHomeMetrics(homeId: number): Promise<any> {
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
    
    const rotationPolicy = home?.rotation_policy || 'weekly';
    const today = new Date();
    const cycleStart = this.getCycleStartDate(rotationPolicy, today);
    const cycleEnd = this.getCycleEndDate(rotationPolicy, cycleStart);
    const cycleStartStr = cycleStart.toISOString().split('T')[0];
    const cycleEndStr = cycleEnd.toISOString().split('T')[0];
    
    const { data: assignments } = await supabase
      .from('task_assignments')
      .select('id, status, member_id, assigned_date, home_members!inner(home_id)')
      .eq('home_members.home_id', homeId)
      .gte('assigned_date', cycleStartStr)
      .lte('assigned_date', cycleEndStr)
      .not('status', 'in', '(skipped_cancelled,skipped_reassigned)');
    
    const allAssignments = assignments || [];
    
    const totalTasks = allAssignments.length;
    const completedTasks = allAssignments.filter(a => a.status === 'completed').length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const totalPoints = members.reduce((sum, m) => sum + (m.total_points || 0), 0);
    
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

  async checkAndStartNewCycleIfNeeded(homeId: number): Promise<{ newCycleStarted: boolean; assignments?: number }> {
    if (!supabase) throw new Error('Supabase not configured');

    try {
      const { data: home } = await supabase
        .from('homes')
        .select('rotation_policy')
        .eq('id', homeId)
        .single();
      
      if (!home) throw new Error('Home not found');
      
      const rotationPolicy = home.rotation_policy || 'weekly';
      const today = new Date();
      const cycleStart = this.getCycleStartDate(rotationPolicy, today);
      const cycleEnd = this.getCycleEndDate(rotationPolicy, cycleStart);
      const cycleStartStr = cycleStart.toISOString().split('T')[0];
      const cycleEndStr = cycleEnd.toISOString().split('T')[0];

      const { data: currentCycleAssignments } = await supabase
        .from('task_assignments')
        .select('id, home_members!inner(home_id)')
        .eq('home_members.home_id', homeId)
        .gte('assigned_date', cycleStartStr)
        .lte('assigned_date', cycleEndStr)
        .limit(1);

      if (currentCycleAssignments && currentCycleAssignments.length > 0) {
        return { newCycleStarted: false };
      }

      const previousCycleEnd = new Date(cycleStart);
      previousCycleEnd.setDate(previousCycleEnd.getDate() - 1);
      const previousCycleEndStr = previousCycleEnd.toISOString().split('T')[0];

      const { data: oldPendingAssignments } = await supabase
        .from('task_assignments')
        .select('id, home_members!inner(home_id)')
        .eq('home_members.home_id', homeId)
        .eq('status', 'pending')
        .lte('assigned_date', previousCycleEndStr);

      if (oldPendingAssignments && oldPendingAssignments.length > 0) {
        const oldAssignmentIds = oldPendingAssignments.map(a => a.id);
        
        await supabase
          .from('task_assignments')
          .update({ 
            status: 'skipped_expired'
          })
          .in('id', oldAssignmentIds);
      }

      const newAssignments = await this.autoAssignTasks(homeId, cycleStart);

      return { 
        newCycleStarted: true, 
        assignments: newAssignments.length 
      };
    } catch (error) {
      console.error('Error checking/starting new cycle:', error);
      return { newCycleStarted: false };
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

  // ========== ZONE UTILITIES ==========

  async getZonePresets(): Promise<string[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('zone_presets')
        .select('name')
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      return data?.map(z => z.name) || [];
    } catch (error) {
      console.error('Error loading zone presets:', error);
      return [];
    }
  },

  async getZoneStatus(homeId: number): Promise<{ [zoneId: number]: { total: number; completed: number; percentage: number } }> {
    if (!supabase) return {};

    try {
      const { data: home } = await supabase
        .from('homes')
        .select('rotation_policy')
        .eq('id', homeId)
        .single();
      
      if (!home) return {};
      
      const rotationPolicy = home.rotation_policy || 'weekly';
      const today = new Date();
      const cycleStart = this.getCycleStartDate(rotationPolicy, today);
      const cycleEnd = this.getCycleEndDate(rotationPolicy, cycleStart);
      const cycleStartStr = cycleStart.toISOString().split('T')[0];
      const cycleEndStr = cycleEnd.toISOString().split('T')[0];

      const { data: assignments } = await supabase
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
        .gte('assigned_date', cycleStartStr)
        .lte('assigned_date', cycleEndStr);

      if (!assignments) return {};

      const zoneStats: { [zoneId: number]: { total: number; completed: number } } = {};

      assignments.forEach((a: any) => {
        const zoneId = a.tasks?.zone_id;
        if (!zoneId) return;

        if (!zoneStats[zoneId]) {
          zoneStats[zoneId] = { total: 0, completed: 0 };
        }

        zoneStats[zoneId].total++;
        if (a.status === 'completed') {
          zoneStats[zoneId].completed++;
        }
      });

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
  },

  // ========== TASK TEMPLATES WITH STEPS ==========

  async getTaskTemplatesWithSteps(publicOnly = true) {
    if (!supabase) return [];

    try {
      let query = supabase
        .from('task_templates')
        .select('*');
      
      if (publicOnly) {
        query = query.eq('is_public', true);
      }

      const { data: templates, error } = await query.order('created_at', { ascending: true });
      
      if (error) throw error;
      if (!templates) return [];

      const templatesWithSteps = await Promise.all(
        templates.map(async (template) => {
          const { data: steps } = await supabase!
            .from('task_template_steps')
            .select('*')
            .eq('template_id', template.id)
            .order('step_order', { ascending: true });

          return {
            ...template,
            steps: steps || []
          };
        })
      );

      return templatesWithSteps;
    } catch (error) {
      console.error('Error loading templates with steps:', error);
      return [];
    }
  },

  // ========== USER MEMBERSHIP ==========

  async getUserHomeMembership(userId: string): Promise<{ member: any | null; home: any | null }> {
    if (!supabase) return { member: null, home: null };

    try {
      const { data: member, error: memberError } = await supabase
        .from('home_members')
        .select(`
          *,
          homes (*)
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (memberError) throw memberError;

      if (!member) {
        return { member: null, home: null };
      }

      return {
        member: member,
        home: (member as any).homes
      };
    } catch (error) {
      console.error('Error getting user home membership:', error);
      return { member: null, home: null };
    }
  },

  // ========== PROPOSALS (Visionary Feature) ==========

  async getProposals(homeId: number, status?: string): Promise<any[]> {
    if (!supabase) return [];
    
    let query = supabase
      .from('improvement_proposals')
      .select(`
        *,
        home_members!improvement_proposals_proposed_by_fkey (
          id,
          full_name,
          email
        )
      `)
      .eq('home_id', homeId);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async createProposal(homeId: number, memberId: number, proposalData: any) {
    if (!supabase) throw new Error('Supabase not configured');
    
    const { data, error } = await supabase
      .from('improvement_proposals')
      .insert({
        home_id: homeId,
        proposed_by: memberId,
        ...proposalData
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async voteProposal(proposalId: number, memberId: number, vote: boolean) {
    if (!supabase) throw new Error('Supabase not configured');
    
    const { error } = await supabase
      .from('proposal_votes')
      .upsert({
        proposal_id: proposalId,
        member_id: memberId,
        vote: vote
      });
    
    if (error) throw error;
  },

  // ========== CYCLE MANAGEMENT (Advanced) ==========

  async closeCycleAndReassign(homeId: number): Promise<{ closed: number; assigned: number }> {
    if (!supabase) throw new Error('Supabase not configured');
    
    try {
      const { data: home } = await supabase
        .from('homes')
        .select('rotation_policy')
        .eq('id', homeId)
        .single();
      
      if (!home) throw new Error('Home not found');
      
      const rotationPolicy = home.rotation_policy || 'weekly';
      const today = new Date();
      const cycleStart = this.getCycleStartDate(rotationPolicy, today);
      const previousCycleEnd = new Date(cycleStart);
      previousCycleEnd.setDate(previousCycleEnd.getDate() - 1);
      const previousCycleEndStr = previousCycleEnd.toISOString().split('T')[0];

      const { data: oldPendingAssignments } = await supabase
        .from('task_assignments')
        .select('id, home_members!inner(home_id)')
        .eq('home_members.home_id', homeId)
        .eq('status', 'pending')
        .lte('assigned_date', previousCycleEndStr);

      let closedCount = 0;
      if (oldPendingAssignments && oldPendingAssignments.length > 0) {
        const oldAssignmentIds = oldPendingAssignments.map(a => a.id);
        
        await supabase
          .from('task_assignments')
          .update({ status: 'skipped_expired' })
          .in('id', oldAssignmentIds);
        
        closedCount = oldAssignmentIds.length;
      }

      const newAssignments = await this.autoAssignTasks(homeId, cycleStart);

      return { 
        closed: closedCount, 
        assigned: newAssignments.length 
      };
    } catch (error) {
      console.error('Error closing cycle and reassigning:', error);
      return { closed: 0, assigned: 0 };
    }
  },

  async reassignPendingTasks(homeId: number): Promise<{ reassigned: number }> {
    if (!supabase) throw new Error('Supabase not configured');
    
    try {
      const { data: pendingAssignments } = await supabase
        .from('task_assignments')
        .select('id, task_id, member_id, home_members!inner(home_id)')
        .eq('home_members.home_id', homeId)
        .eq('status', 'pending');

      if (!pendingAssignments || pendingAssignments.length === 0) {
        return { reassigned: 0 };
      }

      const { data: members } = await supabase
        .from('home_members')
        .select('id')
        .eq('home_id', homeId)
        .eq('status', 'active');

      if (!members || members.length === 0) {
        return { reassigned: 0 };
      }

      let reassignedCount = 0;
      for (const assignment of pendingAssignments) {
        const randomMember = members[Math.floor(Math.random() * members.length)];
        
        await supabase
          .from('task_assignments')
          .update({ 
            member_id: randomMember.id,
            status: 'skipped_reassigned'
          })
          .eq('id', assignment.id);
        
        await supabase
          .from('task_assignments')
          .insert({
            task_id: assignment.task_id,
            member_id: randomMember.id,
            assigned_date: new Date().toISOString().split('T')[0],
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'pending'
          });
        
        reassignedCount++;
      }

      return { reassigned: reassignedCount };
    } catch (error) {
      console.error('Error reassigning pending tasks:', error);
      return { reassigned: 0 };
    }
  },

  // ========== OLD CHALLENGE SYSTEM (Deprecated - kept for compatibility) ==========


  async joinChallenge(challengeId: number, memberId: number) {
    if (!supabase) throw new Error('Supabase not configured');
    
    // Get challenge details to initialize progress data
    const { data: challenge, error: challengeError } = await supabase
      .from('active_challenges')
      .select('category, requirements')
      .eq('id', challengeId)
      .single();
    
    if (challengeError) throw challengeError;
    if (!challenge) throw new Error('Challenge not found');
    
    // Initialize progress data based on challenge category
    let progressData: any = {};
    
    switch (challenge.category) {
      case 'task_completion':
        progressData = {
          completed_tasks: [],
          target: challenge.requirements?.task_count || 1
        };
        break;
      case 'streak':
        progressData = {
          current_streak: 0,
          target: challenge.requirements?.days || 3,
          last_completion: null
        };
        break;
      case 'variety':
        progressData = {
          completed_zones: [],
          completed_tasks: [],
          target_zones: challenge.requirements?.zone_count || 3,
          target_tasks: challenge.requirements?.task_count || 3
        };
        break;
      case 'mastery':
        progressData = {
          completed_tasks: [],
          target: challenge.requirements?.task_count || 1,
          all_steps_required: challenge.requirements?.all_steps || false
        };
        break;
      case 'collective':
        progressData = {
          member_contribution: 0,
          team_total: 0,
          target: challenge.requirements?.total_tasks || 10
        };
        break;
      case 'team_goal':
        progressData = {
          member_completed: 0,
          target_per_member: challenge.requirements?.min_tasks_per_member || 1
        };
        break;
      default:
        progressData = {};
    }
    
    // Insert into challenge_progress
    const { error } = await supabase
      .from('challenge_progress')
      .insert({
        challenge_id: challengeId,
        member_id: memberId,
        progress_data: progressData,
        is_completed: false
      });
    
    if (error) throw error;
  },


  // ========== ADVANCED METRICS ==========

  async calculateConsecutiveWeeks(homeId: number): Promise<number> {
    if (!supabase) return 0;
    
    try {
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
      
      let consecutiveCycles = 0;
      
      for (let i = 0; i < cyclesToCheck; i++) {
        const referenceDate = new Date(today);
        referenceDate.setDate(referenceDate.getDate() - (i * dayIncrement));
        
        const cycleStart = this.getCycleStartDate(rotationPolicy, referenceDate);
        const cycleEnd = this.getCycleEndDate(rotationPolicy, cycleStart);
        
        const cycleStartStr = cycleStart.toISOString().split('T')[0];
        const cycleEndStr = cycleEnd.toISOString().split('T')[0];
        
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
    if (!supabase) return 0;
    
    const { data: assignments } = await supabase
      .from('task_assignments')
      .select('member_id, home_members!inner(home_id)')
      .eq('home_members.home_id', homeId)
      .gte('assigned_date', startDate)
      .lte('assigned_date', endDate);
    
    if (!assignments || assignments.length === 0) return 100;
    
    const taskCounts: { [key: number]: number } = {};
    assignments.forEach(a => {
      taskCounts[a.member_id] = (taskCounts[a.member_id] || 0) + 1;
    });
    
    const counts = Object.values(taskCounts);
    if (counts.length === 0) return 100;
    
    const maxTasks = Math.max(...counts);
    const minTasks = Math.min(...counts);
    
    if (maxTasks === 0) return 100;
    
    const equityPercentage = 100 - Math.round(((maxTasks - minTasks) / maxTasks) * 100);
    
    return Math.max(0, equityPercentage);
  },

  async getWeeklyCompletionPercentage(homeId: number, startDate: string, endDate: string): Promise<number> {
    if (!supabase) return 0;
    
    const { data: assignments } = await supabase
      .from('task_assignments')
      .select('status, home_members!inner(home_id)')
      .eq('home_members.home_id', homeId)
      .gte('assigned_date', startDate)
      .lte('assigned_date', endDate)
      .not('status', 'in', '(skipped_cancelled,skipped_reassigned)');
    
    if (!assignments || assignments.length === 0) return 0;
    
    const completed = assignments.filter(a => a.status === 'completed').length;
    const total = assignments.length;
    
    return Math.round((completed / total) * 100);
  },

}
