-- CleanQuest Database Schema
-- Para ejecutar en Supabase SQL Editor

-- Tabla de perfiles de usuario (extiende auth.users de Supabase)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  has_completed_onboarding BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de hogares/casas
CREATE TABLE IF NOT EXISTS homes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  member_count INTEGER NOT NULL DEFAULT 1,
  goal_percentage INTEGER NOT NULL DEFAULT 80,
  rotation_policy TEXT NOT NULL DEFAULT 'weekly' CHECK (rotation_policy IN ('daily', 'weekly', 'biweekly', 'monthly')),
  auto_rotation BOOLEAN NOT NULL DEFAULT TRUE,
  reminder_time TIME DEFAULT '09:00:00',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de zonas del hogar
CREATE TABLE IF NOT EXISTS zones (
  id SERIAL PRIMARY KEY,
  home_id INTEGER NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'home',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de zonas predefinidas (catálogo para onboarding)
CREATE TABLE IF NOT EXISTS zone_presets (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL,
  display_order INTEGER DEFAULT 0
);

-- Tabla de miembros del hogar
CREATE TABLE IF NOT EXISTS home_members (
  id SERIAL PRIMARY KEY,
  home_id INTEGER NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  invitation_token TEXT,
  mastery_level TEXT NOT NULL DEFAULT 'novice' CHECK (mastery_level IN ('novice', 'solver', 'expert', 'master', 'visionary')),
  total_points INTEGER NOT NULL DEFAULT 0,
  weeks_active INTEGER NOT NULL DEFAULT 0,
  tasks_completed INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  -- XP and Stats
  total_xp INTEGER NOT NULL DEFAULT 0,
  challenges_completed INTEGER NOT NULL DEFAULT 0,
  group_challenges_completed INTEGER NOT NULL DEFAULT 0,
  speed_challenges_completed INTEGER NOT NULL DEFAULT 0,
  perfect_challenges INTEGER NOT NULL DEFAULT 0,
  -- Notification and preference columns
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  weekly_reports BOOLEAN DEFAULT true,
  theme VARCHAR(10) DEFAULT 'system',
  font_size VARCHAR(10) DEFAULT 'medium',
  reminder_enabled BOOLEAN DEFAULT true,
  reminder_time TIME DEFAULT '09:00:00',
  reminder_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5],
  joined_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(home_id, email)
);

-- Tabla de tareas del hogar
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  home_id INTEGER NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  zone_id INTEGER REFERENCES zones(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'check-circle',
  frequency TEXT NOT NULL DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly')),
  effort_points INTEGER NOT NULL DEFAULT 1 CHECK (effort_points >= 1 AND effort_points <= 10),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_template BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de asignaciones de tareas
CREATE TABLE IF NOT EXISTS task_assignments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  member_id INTEGER NOT NULL REFERENCES home_members(id) ON DELETE CASCADE,
  assigned_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped_expired', 'skipped_cancelled', 'skipped_reassigned')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, member_id, assigned_date)
);

-- Tabla de completitud de tareas
CREATE TABLE IF NOT EXISTS task_completions (
  id SERIAL PRIMARY KEY,
  assignment_id INTEGER NOT NULL REFERENCES task_assignments(id) ON DELETE CASCADE,
  member_id INTEGER NOT NULL REFERENCES home_members(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  evidence_url TEXT,
  notes TEXT,
  points_earned INTEGER NOT NULL DEFAULT 0
);

-- Tabla de plantillas de desafíos
CREATE TABLE IF NOT EXISTS challenge_templates (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('individual', 'group')),
  category TEXT NOT NULL CHECK (category IN ('task_completion', 'streak', 'speed', 'variety', 'mastery', 'team_goal', 'zone_blitz', 'collective', 'perfect_week', 'support')),
  requirements JSONB NOT NULL,
  duration_type TEXT NOT NULL CHECK (duration_type IN ('daily', 'quarter_cycle', 'half_cycle', 'full_cycle', 'multi_cycle')),
  duration_multiplier DECIMAL(3,2) DEFAULT 1.0,
  base_xp INTEGER NOT NULL DEFAULT 50,
  difficulty_multiplier DECIMAL(3,2) DEFAULT 1.0,
  min_mastery_level TEXT CHECK (min_mastery_level IN ('novice', 'solver', 'expert', 'master', 'visionary')),
  requires_min_tasks INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de desafíos del hogar
CREATE TABLE IF NOT EXISTS challenges (
  id SERIAL PRIMARY KEY,
  home_id INTEGER NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('group', 'personal', 'strategic')),
  icon TEXT DEFAULT 'trophy',
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  points_reward INTEGER NOT NULL DEFAULT 50,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  start_date DATE,
  end_date DATE,
  -- New columns for enhanced system
  template_id INTEGER REFERENCES challenge_templates(id) ON DELETE SET NULL,
  duration_type TEXT CHECK (duration_type IN ('daily', 'quarter_cycle', 'half_cycle', 'full_cycle', 'multi_cycle')),
  cycle_aligned BOOLEAN DEFAULT TRUE,
  xp_reward INTEGER,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de participantes en desafíos
CREATE TABLE IF NOT EXISTS challenge_participants (
  id SERIAL PRIMARY KEY,
  challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  member_id INTEGER NOT NULL REFERENCES home_members(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'joined' CHECK (status IN ('joined', 'completed', 'abandoned')),
  points_earned INTEGER NOT NULL DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(challenge_id, member_id)
);

-- Active Challenges: Instances of challenges currently running
CREATE TABLE IF NOT EXISTS active_challenges (
  id SERIAL PRIMARY KEY,
  template_id INTEGER REFERENCES challenge_templates(id) ON DELETE SET NULL,
  home_id INTEGER NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('individual', 'group')),
  category TEXT NOT NULL,
  requirements JSONB NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  cycle_aligned BOOLEAN NOT NULL DEFAULT TRUE,
  xp_reward INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'cancelled')),
  assigned_to INTEGER REFERENCES home_members(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Challenge Progress: Track individual member progress on challenges
CREATE TABLE IF NOT EXISTS challenge_progress (
  id SERIAL PRIMARY KEY,
  challenge_id INTEGER NOT NULL REFERENCES active_challenges(id) ON DELETE CASCADE,
  member_id INTEGER NOT NULL REFERENCES home_members(id) ON DELETE CASCADE,
  progress_data JSONB NOT NULL DEFAULT '{}',
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  xp_awarded INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(challenge_id, member_id)
);

-- XP Transactions: Audit log for all XP gains
CREATE TABLE IF NOT EXISTS xp_transactions (
  id SERIAL PRIMARY KEY,
  member_id INTEGER NOT NULL REFERENCES home_members(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('task_completion', 'challenge_completion', 'achievement_unlock', 'bonus', 'level_up', 'streak_bonus')),
  reference_type TEXT,
  reference_id INTEGER,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de insignias/achievements
CREATE TABLE IF NOT EXISTS achievements (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'trophy',
  color TEXT DEFAULT '#6fbd9d',
  achievement_type TEXT NOT NULL CHECK (achievement_type IN ('individual', 'team', 'home')),
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de insignias desbloqueadas
CREATE TABLE IF NOT EXISTS member_achievements (
  id SERIAL PRIMARY KEY,
  member_id INTEGER NOT NULL REFERENCES home_members(id) ON DELETE CASCADE,
  achievement_id INTEGER NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(member_id, achievement_id)
);

-- Tabla de propuestas de mejora (nivel visionary)
CREATE TABLE IF NOT EXISTS improvement_proposals (
  id SERIAL PRIMARY KEY,
  home_id INTEGER NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  proposed_by INTEGER NOT NULL REFERENCES home_members(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  hypothesis TEXT NOT NULL,
  expected_impact TEXT,
  status TEXT NOT NULL DEFAULT 'voting' CHECK (status IN ('voting', 'approved', 'rejected', 'testing', 'implemented', 'reverted')),
  votes_yes INTEGER NOT NULL DEFAULT 0,
  votes_no INTEGER NOT NULL DEFAULT 0,
  test_start_date DATE,
  test_end_date DATE,
  result_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de votos en propuestas
CREATE TABLE IF NOT EXISTS proposal_votes (
  id SERIAL PRIMARY KEY,
  proposal_id INTEGER NOT NULL REFERENCES improvement_proposals(id) ON DELETE CASCADE,
  member_id INTEGER NOT NULL REFERENCES home_members(id) ON DELETE CASCADE,
  vote BOOLEAN NOT NULL,
  voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(proposal_id, member_id)
);

-- Tabla de plantillas especiales
CREATE TABLE IF NOT EXISTS special_templates (
  id SERIAL PRIMARY KEY,
  home_id INTEGER NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  modifications JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de plantillas de tareas (catálogo global)
CREATE TABLE IF NOT EXISTS task_templates (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'check-circle',
  zone TEXT,
  frequency TEXT NOT NULL DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly')),
  effort_points INTEGER NOT NULL DEFAULT 1 CHECK (effort_points >= 1 AND effort_points <= 10),
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de pasos de plantillas de tareas (catálogo global)
CREATE TABLE IF NOT EXISTS task_template_steps (
  id SERIAL PRIMARY KEY,
  template_id INTEGER NOT NULL REFERENCES task_templates(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_optional BOOLEAN NOT NULL DEFAULT FALSE,
  estimated_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(template_id, step_order)
);

-- Tabla de pasos/subtareas para tareas (progresión)
CREATE TABLE IF NOT EXISTS task_steps (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_optional BOOLEAN NOT NULL DEFAULT FALSE,
  estimated_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, step_order)
);

-- Tabla de completitud de pasos
CREATE TABLE IF NOT EXISTS task_step_completions (
  id SERIAL PRIMARY KEY,
  step_id INTEGER NOT NULL REFERENCES task_steps(id) ON DELETE CASCADE,
  assignment_id INTEGER NOT NULL REFERENCES task_assignments(id) ON DELETE CASCADE,
  completed_by INTEGER NOT NULL REFERENCES home_members(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(step_id, assignment_id)
);

-- Tabla de historial de cambios (audit log)
CREATE TABLE IF NOT EXISTS change_log (
  id SERIAL PRIMARY KEY,
  home_id INTEGER NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  changed_by INTEGER REFERENCES home_members(id) ON DELETE SET NULL,
  change_type TEXT NOT NULL,
  change_description TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de solicitudes de intercambio de tareas
CREATE TABLE IF NOT EXISTS task_exchange_requests (
  id SERIAL PRIMARY KEY,
  task_assignment_id INTEGER NOT NULL REFERENCES task_assignments(id) ON DELETE CASCADE,
  requester_id INTEGER NOT NULL REFERENCES home_members(id) ON DELETE CASCADE,
  target_member_id INTEGER REFERENCES home_members(id) ON DELETE SET NULL,
  target_assignment_id INTEGER REFERENCES task_assignments(id) ON DELETE SET NULL,
  responder_id INTEGER REFERENCES home_members(id) ON DELETE SET NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('help', 'swap')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE
);

-- Tabla de tareas favoritas por miembro
CREATE TABLE IF NOT EXISTS task_favorites (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  member_id INTEGER NOT NULL REFERENCES home_members(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, member_id)
);

-- Tabla de cancelación de tareas
CREATE TABLE IF NOT EXISTS task_cancellations (
  id SERIAL PRIMARY KEY,
  assignment_id INTEGER NOT NULL REFERENCES task_assignments(id) ON DELETE CASCADE,
  cancelled_by INTEGER NOT NULL REFERENCES home_members(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  taken_by INTEGER REFERENCES home_members(id) ON DELETE SET NULL,
  cancelled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  taken_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(assignment_id)
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_homes_created_by ON homes(created_by);
CREATE INDEX IF NOT EXISTS idx_zones_home ON zones(home_id);
CREATE INDEX IF NOT EXISTS idx_home_members_home ON home_members(home_id);
CREATE INDEX IF NOT EXISTS idx_home_members_user ON home_members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_reminder_enabled ON home_members(reminder_enabled) WHERE reminder_enabled = TRUE;
CREATE INDEX IF NOT EXISTS idx_members_reminder_time ON home_members(reminder_time) WHERE reminder_enabled = TRUE;
CREATE INDEX IF NOT EXISTS idx_tasks_home ON tasks(home_id);
CREATE INDEX IF NOT EXISTS idx_tasks_zone ON tasks(zone_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_task ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_member ON task_assignments(member_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_date ON task_assignments(assigned_date);
CREATE INDEX IF NOT EXISTS idx_task_completions_assignment ON task_completions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_challenges_home ON challenges(home_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_member_achievements_member ON member_achievements(member_id);
CREATE INDEX IF NOT EXISTS idx_proposals_home ON improvement_proposals(home_id);
CREATE INDEX IF NOT EXISTS idx_change_log_home ON change_log(home_id);
CREATE INDEX IF NOT EXISTS idx_task_templates_name ON task_templates(name);
CREATE INDEX IF NOT EXISTS idx_task_template_steps_template ON task_template_steps(template_id);
CREATE INDEX IF NOT EXISTS idx_task_steps_task ON task_steps(task_id);
CREATE INDEX IF NOT EXISTS idx_task_step_completions_step ON task_step_completions(step_id);
CREATE INDEX IF NOT EXISTS idx_task_step_completions_assignment ON task_step_completions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_task_favorites_member ON task_favorites(member_id);
CREATE INDEX IF NOT EXISTS idx_task_favorites_task ON task_favorites(task_id);
CREATE INDEX IF NOT EXISTS idx_cancellations_available ON task_cancellations(is_available) WHERE is_available = TRUE;
CREATE INDEX IF NOT EXISTS idx_cancellations_assignment ON task_cancellations(assignment_id);
CREATE INDEX IF NOT EXISTS idx_cancellations_cancelled_by ON task_cancellations(cancelled_by);

-- Challenge System Indexes
CREATE INDEX IF NOT EXISTS idx_challenge_templates_active ON challenge_templates(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_challenge_templates_type ON challenge_templates(challenge_type);
CREATE INDEX IF NOT EXISTS idx_challenge_templates_category ON challenge_templates(category);

CREATE INDEX IF NOT EXISTS idx_active_challenges_home ON active_challenges(home_id);
CREATE INDEX IF NOT EXISTS idx_active_challenges_status ON active_challenges(status);
CREATE INDEX IF NOT EXISTS idx_active_challenges_assigned ON active_challenges(assigned_to);
CREATE INDEX IF NOT EXISTS idx_active_challenges_dates ON active_challenges(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_active_challenges_home_status ON active_challenges(home_id, status) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_challenge_progress_challenge ON challenge_progress(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_member ON challenge_progress(member_id);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_completed ON challenge_progress(is_completed);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_member_active ON challenge_progress(member_id, is_completed) WHERE is_completed = FALSE;

CREATE INDEX IF NOT EXISTS idx_xp_transactions_member ON xp_transactions(member_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_source ON xp_transactions(source);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_created ON xp_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_reference ON xp_transactions(reference_type, reference_id);

CREATE INDEX IF NOT EXISTS idx_home_members_xp ON home_members(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_home_members_challenges ON home_members(challenges_completed DESC);

-- ========== ÍNDICES COMPUESTOS CRÍTICOS PARA PERFORMANCE ==========
-- Estos índices compuestos optimizan las queries más frecuentes de la aplicación

-- CRÍTICO: Optimiza getMyAssignments (query más frecuente - se ejecuta en cada F5)
-- Cubre: WHERE member_id = X AND status = 'pending' ORDER BY assigned_date DESC
CREATE INDEX IF NOT EXISTS idx_task_assignments_member_status_date 
  ON task_assignments(member_id, status, assigned_date DESC)
  WHERE status = 'pending';

-- CRÍTICO: Optimiza batch loading de step completions (elimina N+1 queries)
-- Cubre: WHERE assignment_id IN (...) - usado en getMyAssignments
CREATE INDEX IF NOT EXISTS idx_step_completions_assignment_step 
  ON task_step_completions(assignment_id, step_id);

-- IMPORTANTE: Optimiza filtrado de tareas activas por home
-- Cubre: WHERE home_id = X AND is_active = TRUE
CREATE INDEX IF NOT EXISTS idx_tasks_home_active 
  ON tasks(home_id, is_active)
  WHERE is_active = TRUE;

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_homes_updated_at ON homes;
CREATE TRIGGER update_homes_updated_at BEFORE UPDATE ON homes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_proposals_updated_at ON improvement_proposals;
CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON improvement_proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========== HABILITAR ROW LEVEL SECURITY EN TODAS LAS TABLAS ==========
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE homes ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE zone_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_template_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_step_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_exchange_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_cancellations ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE improvement_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_log ENABLE ROW LEVEL SECURITY;

-- ========== POLITICAS RLS ==========
-- Politicas permisivas para usuarios autenticados (la logica de negocio se controla desde la app)

-- ========== PROFILES ==========
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view home owners" ON profiles;
CREATE POLICY "Users can view home owners" ON profiles
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    id IN (SELECT created_by FROM homes)
  );

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ========== HOMES ==========
DROP POLICY IF EXISTS "Authenticated users can manage homes" ON homes;
CREATE POLICY "Authenticated users can manage homes" ON homes
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ========== HOME_MEMBERS ==========
DROP POLICY IF EXISTS "Authenticated users can manage home_members" ON home_members;
CREATE POLICY "Authenticated users can manage home_members" ON home_members
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ========== ZONES ==========
DROP POLICY IF EXISTS "Authenticated users can manage zones" ON zones;
CREATE POLICY "Authenticated users can manage zones" ON zones
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ========== ZONE_PRESETS ==========
DROP POLICY IF EXISTS "Anyone can view zone_presets" ON zone_presets;
CREATE POLICY "Anyone can view zone_presets" ON zone_presets
  FOR SELECT USING (true);

-- ========== TASK_TEMPLATES ==========
DROP POLICY IF EXISTS "Authenticated users can manage task_templates" ON task_templates;
CREATE POLICY "Authenticated users can manage task_templates" ON task_templates
  FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can view public templates" ON task_templates;
CREATE POLICY "Anyone can view public templates" ON task_templates
  FOR SELECT USING (is_public = true);

-- ========== TASK_TEMPLATE_STEPS ==========
DROP POLICY IF EXISTS "Authenticated users can manage task_template_steps" ON task_template_steps;
CREATE POLICY "Authenticated users can manage task_template_steps" ON task_template_steps
  FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can view template steps" ON task_template_steps;
CREATE POLICY "Anyone can view template steps" ON task_template_steps
  FOR SELECT USING (true);

-- ========== TASKS ==========
DROP POLICY IF EXISTS "Authenticated users can manage tasks" ON tasks;
CREATE POLICY "Authenticated users can manage tasks" ON tasks
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ========== TASK_STEPS ==========
DROP POLICY IF EXISTS "Authenticated users can manage task_steps" ON task_steps;
CREATE POLICY "Authenticated users can manage task_steps" ON task_steps
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ========== TASK_ASSIGNMENTS ==========
DROP POLICY IF EXISTS "Authenticated users can manage task_assignments" ON task_assignments;
CREATE POLICY "Authenticated users can manage task_assignments" ON task_assignments
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ========== TASK_COMPLETIONS ==========
DROP POLICY IF EXISTS "Authenticated users can manage task_completions" ON task_completions;
CREATE POLICY "Authenticated users can manage task_completions" ON task_completions
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ========== TASK_STEP_COMPLETIONS ==========
DROP POLICY IF EXISTS "Authenticated users can manage task_step_completions" ON task_step_completions;
CREATE POLICY "Authenticated users can manage task_step_completions" ON task_step_completions
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ========== TASK_EXCHANGE_REQUESTS ==========
DROP POLICY IF EXISTS "Authenticated users can manage task_exchange_requests" ON task_exchange_requests;
CREATE POLICY "Authenticated users can manage task_exchange_requests" ON task_exchange_requests
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ========== TASK_FAVORITES ==========
DROP POLICY IF EXISTS "Authenticated users can manage task_favorites" ON task_favorites;
CREATE POLICY "Authenticated users can manage task_favorites" ON task_favorites
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ========== TASK_CANCELLATIONS ==========
DROP POLICY IF EXISTS "Authenticated users can manage task_cancellations" ON task_cancellations;
CREATE POLICY "Authenticated users can manage task_cancellations" ON task_cancellations
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ========== CHALLENGES ==========
DROP POLICY IF EXISTS "Authenticated users can manage challenges" ON challenges;
CREATE POLICY "Authenticated users can manage challenges" ON challenges
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ========== CHALLENGE_TEMPLATES ==========
DROP POLICY IF EXISTS "Authenticated users can manage challenge_templates" ON challenge_templates;
CREATE POLICY "Authenticated users can manage challenge_templates" ON challenge_templates
  FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can view challenge_templates" ON challenge_templates;
CREATE POLICY "Anyone can view challenge_templates" ON challenge_templates
  FOR SELECT USING (true);

-- ========== CHALLENGE_PARTICIPANTS ==========
DROP POLICY IF EXISTS "Authenticated users can manage challenge_participants" ON challenge_participants;
CREATE POLICY "Authenticated users can manage challenge_participants" ON challenge_participants
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ========== ACTIVE_CHALLENGES ==========
DROP POLICY IF EXISTS "Authenticated users can manage active_challenges" ON active_challenges;
CREATE POLICY "Authenticated users can manage active_challenges" ON active_challenges
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ========== CHALLENGE_PROGRESS ==========
DROP POLICY IF EXISTS "Authenticated users can manage challenge_progress" ON challenge_progress;
CREATE POLICY "Authenticated users can manage challenge_progress" ON challenge_progress
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ========== XP_TRANSACTIONS ==========
DROP POLICY IF EXISTS "Authenticated users can manage xp_transactions" ON xp_transactions;
CREATE POLICY "Authenticated users can manage xp_transactions" ON xp_transactions
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ========== ACHIEVEMENTS ==========
DROP POLICY IF EXISTS "Anyone can view achievements" ON achievements;
CREATE POLICY "Anyone can view achievements" ON achievements
  FOR SELECT USING (true);

-- ========== MEMBER_ACHIEVEMENTS ==========
DROP POLICY IF EXISTS "Authenticated users can manage member_achievements" ON member_achievements;
CREATE POLICY "Authenticated users can manage member_achievements" ON member_achievements
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ========== IMPROVEMENT_PROPOSALS ==========
DROP POLICY IF EXISTS "Authenticated users can manage improvement_proposals" ON improvement_proposals;
CREATE POLICY "Authenticated users can manage improvement_proposals" ON improvement_proposals
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ========== PROPOSAL_VOTES ==========
DROP POLICY IF EXISTS "Authenticated users can manage proposal_votes" ON proposal_votes;
CREATE POLICY "Authenticated users can manage proposal_votes" ON proposal_votes
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ========== SPECIAL_TEMPLATES ==========
DROP POLICY IF EXISTS "Authenticated users can manage special_templates" ON special_templates;
CREATE POLICY "Authenticated users can manage special_templates" ON special_templates
  FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can view special_templates" ON special_templates;
CREATE POLICY "Anyone can view special_templates" ON special_templates
  FOR SELECT USING (true);

-- ========== CHANGE_LOG ==========
DROP POLICY IF EXISTS "Authenticated users can manage change_log" ON change_log;
CREATE POLICY "Authenticated users can manage change_log" ON change_log
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ========== INDEXES ==========
-- Index for swap request lookups
CREATE INDEX IF NOT EXISTS idx_task_exchange_requests_target_assignment 
ON task_exchange_requests(target_assignment_id);

-- Index for pending requests by target member
CREATE INDEX IF NOT EXISTS idx_task_exchange_requests_target_pending 
ON task_exchange_requests(target_member_id, status) 
WHERE status = 'pending';
