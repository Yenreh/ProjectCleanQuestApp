// Tipos de datos para CleanQuest App

export type MasteryLevel = "novice" | "solver" | "expert" | "master" | "visionary"

export type RotationPolicy = "daily" | "weekly" | "biweekly" | "monthly"

export type TaskFrequency = "daily" | "weekly" | "biweekly" | "monthly"

export type MemberRole = "owner" | "admin" | "member"

export type MemberStatus = "pending" | "active" | "inactive"

export type AssignmentStatus = "pending" | "in_progress" | "completed" | "skipped"

export type ChallengeType = "group" | "personal" | "strategic"

export type ChallengeParticipantStatus = "joined" | "completed" | "abandoned"

export type ProposalStatus = "voting" | "approved" | "rejected" | "testing" | "implemented" | "reverted"

export type ExchangeRequestType = "help" | "swap"

export type ExchangeRequestStatus = "pending" | "accepted" | "rejected" | "completed"

export type AchievementType = "individual" | "team" | "home"

// Database types matching SQL schema

export interface Profile {
  id: string // UUID
  email: string
  full_name?: string
  avatar_url?: string
  has_completed_onboarding: boolean
  created_at: string
  updated_at: string
}

export interface Home {
  id: number
  name: string
  created_by: string
  member_count: number
  goal_percentage: number
  rotation_policy: RotationPolicy
  auto_rotation: boolean
  reminder_time: string
  created_at: string
  updated_at: string
}

export interface Zone {
  id: number
  home_id: number
  name: string
  icon: string
  created_at: string
}

export interface HomeMember {
  id: number
  home_id: number
  user_id?: string
  email: string
  full_name?: string
  role: MemberRole
  status: MemberStatus
  invitation_token?: string
  mastery_level: MasteryLevel
  total_points: number
  weeks_active: number
  tasks_completed: number
  current_streak: number
  joined_at?: string
  created_at: string
}

export interface Task {
  id: number
  home_id: number
  zone_id?: number
  title: string
  description?: string
  icon: string
  frequency: TaskFrequency
  effort_points: number
  is_active: boolean
  is_template: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

export interface TaskAssignment {
  id: number
  task_id: number
  member_id: number
  assigned_date: string
  due_date: string
  status: AssignmentStatus
  created_at: string
}

export interface TaskCompletion {
  id: number
  assignment_id: number
  member_id: number
  completed_at: string
  evidence_url?: string
  notes?: string
  points_earned: number
}

export interface Challenge {
  id: number
  home_id: number
  title: string
  description?: string
  challenge_type: ChallengeType
  icon: string
  duration_minutes: number
  points_reward: number
  is_active: boolean
  start_date?: string
  end_date?: string
  created_by?: string
  created_at: string
}

export interface ChallengeParticipant {
  id: number
  challenge_id: number
  member_id: number
  status: ChallengeParticipantStatus
  points_earned: number
  joined_at: string
  completed_at?: string
}

export interface Achievement {
  id: number
  name: string
  title: string
  description?: string
  icon: string
  color: string
  achievement_type: AchievementType
  requirement_type: string
  requirement_value?: number
  created_at: string
}

export interface MemberAchievement {
  id: number
  member_id: number
  achievement_id: number
  unlocked_at: string
}

export interface ImprovementProposal {
  id: number
  home_id: number
  proposed_by: number
  title: string
  hypothesis: string
  expected_impact?: string
  status: ProposalStatus
  votes_yes: number
  votes_no: number
  test_start_date?: string
  test_end_date?: string
  result_data?: any
  created_at: string
  updated_at: string
}

export interface ProposalVote {
  id: number
  proposal_id: number
  member_id: number
  vote: boolean
  voted_at: string
}

export interface SpecialTemplate {
  id: number
  home_id: number
  name: string
  description?: string
  modifications: any
  is_active: boolean
  created_by?: string
  created_at: string
}

export interface TaskTemplate {
  id: number
  name: string
  title: string
  description?: string
  icon?: string
  zone?: string
  frequency: TaskFrequency
  effort_points: number
  is_public: boolean
  created_by?: string
  created_at: string
}

export interface TaskStep {
  id: number
  task_id: number
  step_order: number
  title: string
  description?: string
  is_optional: boolean
  estimated_minutes?: number
  created_at: string
}

export interface TaskStepCompletion {
  id: number
  step_id: number
  assignment_id: number
  completed_by: number
  completed_at: string
}

export interface ChangeLog {
  id: number
  home_id: number
  changed_by?: number
  change_type: string
  change_description: string
  old_value?: string
  new_value?: string
  created_at: string
}

export interface TaskExchangeRequest {
  id: number
  task_assignment_id: number
  requester_id: number
  target_member_id?: number
  responder_id?: number
  request_type: ExchangeRequestType
  status: ExchangeRequestStatus
  message?: string
  created_at: string
  responded_at?: string
}

export interface TaskCancellation {
  id: number
  assignment_id: number
  cancelled_by: number
  reason: string
  is_available: boolean
  taken_by?: number
  cancelled_at: string
  taken_at?: string
}

export interface CancelledTaskWithDetails {
  cancellation_id: number
  assignment_id: number
  task_id: number
  task_title: string
  task_icon: string
  task_effort: number
  zone_name?: string
  cancelled_by_id: number
  cancelled_by_name: string
  cancellation_reason: string
  cancelled_at: string
  assigned_date: string
  due_date: string
}

// Extended types with joins

export interface TaskWithDetails extends Task {
  zone_name?: string
  zone_icon?: string
  steps?: TaskStep[]
  total_steps?: number
  completed_steps?: number
}

export interface AssignmentWithDetails extends TaskAssignment {
  task_title: string
  task_icon: string
  task_effort: number
  member_name?: string
  member_email: string
  task_zone_name?: string
  task_zone_icon?: string
  task_steps?: TaskStep[]
  completed_steps_count?: number
}

export interface ChallengeWithParticipants extends Challenge {
  participant_count: number
  participants?: HomeMember[]
}

export interface ProposalWithAuthor extends ImprovementProposal {
  author_name?: string
  author_email: string
}

export interface MemberWithAchievements extends HomeMember {
  achievements: Achievement[]
}

// Dashboard & Analytics types

export interface HomeMetrics {
  completion_percentage: number
  rotation_percentage: number
  total_tasks: number
  completed_tasks: number
  pending_tasks: number
  active_members: number
  total_points_earned: number
  consecutive_weeks: number
}

export interface MemberMetrics {
  member_id: number
  member_name?: string
  member_email: string
  tasks_completed: number
  tasks_pending: number
  points_earned: number
  completion_rate: number
  last_activity?: string
}

export interface WeeklyProgress {
  week_start: string
  week_end: string
  completion_percentage: number
  tasks_completed: number
  tasks_total: number
  members_active: number
}

// Auth types

export interface AuthUser {
  id: string
  email: string
  profile?: Profile
}

export interface AuthSession {
  user: AuthUser
  access_token: string
  refresh_token: string
}

// Form types for creating/updating

export type CreateHomeInput = Omit<Home, 'id' | 'created_at' | 'updated_at' | 'created_by'>
export type UpdateHomeInput = Partial<CreateHomeInput>

export type CreateTaskInput = Omit<Task, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'home_id'>
export type UpdateTaskInput = Partial<CreateTaskInput>

export type CreateZoneInput = Omit<Zone, 'id' | 'created_at' | 'home_id'>

export type InviteMemberInput = {
  email: string
  role?: MemberRole
}

export type CreateChallengeInput = Omit<Challenge, 'id' | 'created_at' | 'created_by' | 'home_id'>

export type CreateProposalInput = Omit<ImprovementProposal, 'id' | 'created_at' | 'updated_at' | 'proposed_by' | 'home_id' | 'votes_yes' | 'votes_no'>

export type CreateTaskTemplateInput = Omit<TaskTemplate, 'id' | 'created_at' | 'created_by' | 'is_public'>

export type CreateTaskStepInput = Omit<TaskStep, 'id' | 'created_at' | 'task_id'>
