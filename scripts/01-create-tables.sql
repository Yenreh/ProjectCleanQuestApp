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

-- Tabla de miembros del hogar
CREATE TABLE IF NOT EXISTS home_members (
  id SERIAL PRIMARY KEY,
  home_id INTEGER NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  invitation_token TEXT,
  mastery_level TEXT NOT NULL DEFAULT 'novice' CHECK (mastery_level IN ('novice', 'solver', 'expert', 'master', 'visionary')),
  total_points INTEGER NOT NULL DEFAULT 0,
  weeks_active INTEGER NOT NULL DEFAULT 0,
  tasks_completed INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
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
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
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
  responder_id INTEGER REFERENCES home_members(id) ON DELETE SET NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('help', 'swap')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_homes_created_by ON homes(created_by);
CREATE INDEX IF NOT EXISTS idx_zones_home ON zones(home_id);
CREATE INDEX IF NOT EXISTS idx_home_members_home ON home_members(home_id);
CREATE INDEX IF NOT EXISTS idx_home_members_user ON home_members(user_id);
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

-- Habilitar Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE homes ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE improvement_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_exchange_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_template_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_step_completions ENABLE ROW LEVEL SECURITY;

-- ========== POLÍTICAS RLS ==========
-- Políticas completas y centralizadas para todas las tablas
-- Diseñadas para permitir el flujo de onboarding sin consultas circulares

-- ========== PROFILES ==========
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ========== HOMES ==========
-- Usuarios autenticados pueden crear hogares
DROP POLICY IF EXISTS "Users can create homes" ON homes;
CREATE POLICY "Users can create homes" ON homes
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Los creadores pueden ver sus hogares creados
DROP POLICY IF EXISTS "Creators can view their homes" ON homes;
CREATE POLICY "Creators can view their homes" ON homes
  FOR SELECT USING (auth.uid() = created_by);

-- Los miembros activos pueden ver sus hogares
DROP POLICY IF EXISTS "Members can view their homes" ON homes;
CREATE POLICY "Members can view their homes" ON homes
  FOR SELECT USING (
    id IN (
      SELECT home_id FROM home_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Los creadores pueden actualizar sus hogares
DROP POLICY IF EXISTS "Creators can update their homes" ON homes;
CREATE POLICY "Creators can update their homes" ON homes
  FOR UPDATE USING (auth.uid() = created_by);

-- ========== HOME_MEMBERS ==========
-- Los creadores de hogares pueden agregar miembros (incluido ellos mismos durante onboarding)
DROP POLICY IF EXISTS "Home creators can add members" ON home_members;
CREATE POLICY "Home creators can add members" ON home_members
  FOR INSERT WITH CHECK (
    home_id IN (SELECT id FROM homes WHERE created_by = auth.uid())
  );

-- Los admins pueden agregar miembros
DROP POLICY IF EXISTS "Admins can add members" ON home_members;
CREATE POLICY "Admins can add members" ON home_members
  FOR INSERT WITH CHECK (
    home_id IN (
      SELECT home_id FROM home_members 
      WHERE user_id = auth.uid() 
      AND status = 'active'
      AND role IN ('owner', 'admin')
    )
  );

-- Los miembros pueden ver otros miembros del mismo hogar
DROP POLICY IF EXISTS "Members can view home members" ON home_members;
CREATE POLICY "Members can view home members" ON home_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR home_id IN (
      SELECT home_id FROM home_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Los miembros pueden actualizar su propio registro
DROP POLICY IF EXISTS "Members can update own record" ON home_members;
CREATE POLICY "Members can update own record" ON home_members
  FOR UPDATE USING (user_id = auth.uid());

-- Los admins pueden actualizar registros de miembros
DROP POLICY IF EXISTS "Admins can update members" ON home_members;
CREATE POLICY "Admins can update members" ON home_members
  FOR UPDATE USING (
    home_id IN (
      SELECT home_id FROM home_members 
      WHERE user_id = auth.uid() 
      AND status = 'active'
      AND role IN ('owner', 'admin')
    )
  );

-- ========== ZONES ==========
-- Los creadores de hogares pueden crear zonas durante onboarding
DROP POLICY IF EXISTS "Home creators can create zones" ON zones;
CREATE POLICY "Home creators can create zones" ON zones
  FOR INSERT WITH CHECK (
    home_id IN (SELECT id FROM homes WHERE created_by = auth.uid())
  );

-- Los admins pueden crear zonas
DROP POLICY IF EXISTS "Admins can create zones" ON zones;
CREATE POLICY "Admins can create zones" ON zones
  FOR INSERT WITH CHECK (
    home_id IN (
      SELECT home_id FROM home_members 
      WHERE user_id = auth.uid() 
      AND status = 'active'
      AND role IN ('owner', 'admin')
    )
  );

-- Los miembros pueden ver zonas de su hogar
DROP POLICY IF EXISTS "Members can view zones" ON zones;
CREATE POLICY "Members can view zones" ON zones
  FOR SELECT USING (
    home_id IN (SELECT id FROM homes WHERE created_by = auth.uid())
    OR home_id IN (
      SELECT home_id FROM home_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- ========== TASKS ==========
-- Los creadores de hogares pueden crear tareas durante onboarding
DROP POLICY IF EXISTS "Home creators can create tasks" ON tasks;
CREATE POLICY "Home creators can create tasks" ON tasks
  FOR INSERT WITH CHECK (
    home_id IN (SELECT id FROM homes WHERE created_by = auth.uid())
  );

-- Los admins pueden crear tareas
DROP POLICY IF EXISTS "Admins can create tasks" ON tasks;
CREATE POLICY "Admins can create tasks" ON tasks
  FOR INSERT WITH CHECK (
    home_id IN (
      SELECT home_id FROM home_members 
      WHERE user_id = auth.uid() 
      AND status = 'active'
      AND role IN ('owner', 'admin')
    )
  );

-- Los miembros pueden ver tareas de su hogar
DROP POLICY IF EXISTS "Members can view tasks" ON tasks;
CREATE POLICY "Members can view tasks" ON tasks
  FOR SELECT USING (
    home_id IN (SELECT id FROM homes WHERE created_by = auth.uid())
    OR home_id IN (
      SELECT home_id FROM home_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Los admins pueden actualizar tareas
DROP POLICY IF EXISTS "Admins can update tasks" ON tasks;
CREATE POLICY "Admins can update tasks" ON tasks
  FOR UPDATE USING (
    home_id IN (SELECT id FROM homes WHERE created_by = auth.uid())
    OR home_id IN (
      SELECT home_id FROM home_members 
      WHERE user_id = auth.uid() 
      AND status = 'active'
      AND role IN ('owner', 'admin')
    )
  );

-- ========== TASK_STEPS ==========
-- Los creadores de hogares pueden crear pasos de tareas durante onboarding
DROP POLICY IF EXISTS "Home creators can create task steps" ON task_steps;
CREATE POLICY "Home creators can create task steps" ON task_steps
  FOR INSERT WITH CHECK (
    task_id IN (
      SELECT id FROM tasks WHERE home_id IN (
        SELECT id FROM homes WHERE created_by = auth.uid()
      )
    )
  );

-- Los admins pueden crear pasos de tareas
DROP POLICY IF EXISTS "Admins can create task steps" ON task_steps;
CREATE POLICY "Admins can create task steps" ON task_steps
  FOR INSERT WITH CHECK (
    task_id IN (
      SELECT t.id FROM tasks t
      JOIN home_members hm ON hm.home_id = t.home_id
      WHERE hm.user_id = auth.uid() 
      AND hm.status = 'active'
      AND hm.role IN ('owner', 'admin')
    )
  );

-- Los miembros pueden ver pasos de tareas de su hogar
DROP POLICY IF EXISTS "Members can view task steps" ON task_steps;
CREATE POLICY "Members can view task steps" ON task_steps
  FOR SELECT USING (
    task_id IN (
      SELECT id FROM tasks WHERE home_id IN (
        SELECT id FROM homes WHERE created_by = auth.uid()
      )
    )
    OR task_id IN (
      SELECT t.id FROM tasks t
      JOIN home_members hm ON hm.home_id = t.home_id
      WHERE hm.user_id = auth.uid() AND hm.status = 'active'
    )
  );

-- ========== TASK_ASSIGNMENTS ==========
-- Los creadores de hogares pueden crear asignaciones durante onboarding
DROP POLICY IF EXISTS "Home creators can create assignments" ON task_assignments;
CREATE POLICY "Home creators can create assignments" ON task_assignments
  FOR INSERT WITH CHECK (
    task_id IN (
      SELECT id FROM tasks WHERE home_id IN (
        SELECT id FROM homes WHERE created_by = auth.uid()
      )
    )
  );

-- Los admins pueden crear asignaciones
DROP POLICY IF EXISTS "Admins can create assignments" ON task_assignments;
CREATE POLICY "Admins can create assignments" ON task_assignments
  FOR INSERT WITH CHECK (
    task_id IN (
      SELECT t.id FROM tasks t
      JOIN home_members hm ON hm.home_id = t.home_id
      WHERE hm.user_id = auth.uid() 
      AND hm.status = 'active'
      AND hm.role IN ('owner', 'admin')
    )
  );

-- Los miembros pueden ver sus asignaciones
DROP POLICY IF EXISTS "Members can view assignments" ON task_assignments;
CREATE POLICY "Members can view assignments" ON task_assignments
  FOR SELECT USING (
    member_id IN (
      SELECT id FROM home_members WHERE user_id = auth.uid()
    )
  );

-- Los miembros pueden actualizar sus propias asignaciones
DROP POLICY IF EXISTS "Members can update own assignments" ON task_assignments;
CREATE POLICY "Members can update own assignments" ON task_assignments
  FOR UPDATE USING (
    member_id IN (
      SELECT id FROM home_members WHERE user_id = auth.uid()
    )
  );

-- ========== TASK_COMPLETIONS ==========
-- Los miembros pueden ver sus completaciones
DROP POLICY IF EXISTS "Members can view completions" ON task_completions;
CREATE POLICY "Members can view completions" ON task_completions
  FOR SELECT USING (
    member_id IN (
      SELECT id FROM home_members WHERE user_id = auth.uid()
    )
  );

-- Los miembros pueden crear completaciones
DROP POLICY IF EXISTS "Members can create completions" ON task_completions;
CREATE POLICY "Members can create completions" ON task_completions
  FOR INSERT WITH CHECK (
    member_id IN (
      SELECT id FROM home_members WHERE user_id = auth.uid()
    )
  );

-- ========== TASK_STEP_COMPLETIONS ==========
-- Los miembros pueden ver sus completaciones de pasos
DROP POLICY IF EXISTS "Members can view step completions" ON task_step_completions;
CREATE POLICY "Members can view step completions" ON task_step_completions
  FOR SELECT USING (
    completed_by IN (
      SELECT id FROM home_members WHERE user_id = auth.uid()
    )
  );

-- Los miembros pueden crear completaciones de pasos
DROP POLICY IF EXISTS "Members can create step completions" ON task_step_completions;
CREATE POLICY "Members can create step completions" ON task_step_completions
  FOR INSERT WITH CHECK (
    completed_by IN (
      SELECT id FROM home_members WHERE user_id = auth.uid()
    )
  );

-- ========== TASK_TEMPLATES ==========
-- Todos pueden ver plantillas públicas
DROP POLICY IF EXISTS "Anyone can view public templates" ON task_templates;
CREATE POLICY "Anyone can view public templates" ON task_templates
  FOR SELECT USING (is_public = true OR created_by = auth.uid());

-- Usuarios autenticados pueden crear plantillas
DROP POLICY IF EXISTS "Authenticated users can create templates" ON task_templates;
CREATE POLICY "Authenticated users can create templates" ON task_templates
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ========== TASK_TEMPLATE_STEPS ==========
-- Todos pueden ver pasos de plantillas públicas
DROP POLICY IF EXISTS "Anyone can view template steps" ON task_template_steps;
CREATE POLICY "Anyone can view template steps" ON task_template_steps
  FOR SELECT USING (
    template_id IN (
      SELECT id FROM task_templates WHERE is_public = true OR created_by = auth.uid()
    )
  );

-- Los creadores pueden agregar pasos a sus plantillas
DROP POLICY IF EXISTS "Template creators can add steps" ON task_template_steps;
CREATE POLICY "Template creators can add steps" ON task_template_steps
  FOR INSERT WITH CHECK (
    template_id IN (
      SELECT id FROM task_templates WHERE created_by = auth.uid()
    )
  );

-- ========== CHALLENGES ==========
-- Los miembros pueden ver desafíos de su hogar
DROP POLICY IF EXISTS "Members can view challenges" ON challenges;
CREATE POLICY "Members can view challenges" ON challenges
  FOR SELECT USING (
    home_id IN (
      SELECT home_id FROM home_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Los miembros pueden crear desafíos
DROP POLICY IF EXISTS "Members can create challenges" ON challenges;
CREATE POLICY "Members can create challenges" ON challenges
  FOR INSERT WITH CHECK (
    home_id IN (
      SELECT home_id FROM home_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- ========== CHALLENGE_PARTICIPANTS ==========
-- Los miembros pueden ver participantes de desafíos de su hogar
DROP POLICY IF EXISTS "Members can view participants" ON challenge_participants;
CREATE POLICY "Members can view participants" ON challenge_participants
  FOR SELECT USING (
    challenge_id IN (
      SELECT c.id FROM challenges c
      JOIN home_members hm ON hm.home_id = c.home_id
      WHERE hm.user_id = auth.uid() AND hm.status = 'active'
    )
  );

-- Los miembros pueden unirse a desafíos
DROP POLICY IF EXISTS "Members can join challenges" ON challenge_participants;
CREATE POLICY "Members can join challenges" ON challenge_participants
  FOR INSERT WITH CHECK (
    member_id IN (
      SELECT id FROM home_members WHERE user_id = auth.uid()
    )
  );

-- ========== ACHIEVEMENTS ==========
-- Todos pueden ver achievements
DROP POLICY IF EXISTS "Anyone can view achievements" ON achievements;
CREATE POLICY "Anyone can view achievements" ON achievements
  FOR SELECT USING (true);

-- ========== MEMBER_ACHIEVEMENTS ==========
-- Los miembros pueden ver sus propios achievements
DROP POLICY IF EXISTS "Members can view own achievements" ON member_achievements;
CREATE POLICY "Members can view own achievements" ON member_achievements
  FOR SELECT USING (
    member_id IN (
      SELECT id FROM home_members WHERE user_id = auth.uid()
    )
  );

-- Sistema puede crear achievements (para desbloqueos automáticos)
DROP POLICY IF EXISTS "System can create achievements" ON member_achievements;
CREATE POLICY "System can create achievements" ON member_achievements
  FOR INSERT WITH CHECK (
    member_id IN (
      SELECT id FROM home_members WHERE user_id = auth.uid()
    )
  );

-- ========== IMPROVEMENT_PROPOSALS ==========
-- Los miembros pueden ver propuestas de su hogar
DROP POLICY IF EXISTS "Members can view proposals" ON improvement_proposals;
CREATE POLICY "Members can view proposals" ON improvement_proposals
  FOR SELECT USING (
    home_id IN (
      SELECT home_id FROM home_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Los visionarios pueden crear propuestas
DROP POLICY IF EXISTS "Visionaries can create proposals" ON improvement_proposals;
CREATE POLICY "Visionaries can create proposals" ON improvement_proposals
  FOR INSERT WITH CHECK (
    proposed_by IN (
      SELECT id FROM home_members 
      WHERE user_id = auth.uid() 
      AND status = 'active'
      AND mastery_level = 'visionary'
    )
  );

-- Los miembros pueden actualizar propuestas de su hogar
DROP POLICY IF EXISTS "Members can update proposals" ON improvement_proposals;
CREATE POLICY "Members can update proposals" ON improvement_proposals
  FOR UPDATE USING (
    home_id IN (
      SELECT home_id FROM home_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- ========== PROPOSAL_VOTES ==========
-- Los miembros pueden ver votos de su hogar
DROP POLICY IF EXISTS "Members can view votes" ON proposal_votes;
CREATE POLICY "Members can view votes" ON proposal_votes
  FOR SELECT USING (
    proposal_id IN (
      SELECT p.id FROM improvement_proposals p
      JOIN home_members hm ON hm.home_id = p.home_id
      WHERE hm.user_id = auth.uid() AND hm.status = 'active'
    )
  );

-- Los miembros pueden votar
DROP POLICY IF EXISTS "Members can vote" ON proposal_votes;
CREATE POLICY "Members can vote" ON proposal_votes
  FOR INSERT WITH CHECK (
    member_id IN (
      SELECT id FROM home_members WHERE user_id = auth.uid()
    )
  );

-- ========== TASK_EXCHANGE_REQUESTS ==========
-- Los miembros pueden ver solicitudes relacionadas con ellos
DROP POLICY IF EXISTS "Members can view exchange requests" ON task_exchange_requests;
CREATE POLICY "Members can view exchange requests" ON task_exchange_requests
  FOR SELECT USING (
    requester_id IN (
      SELECT id FROM home_members WHERE user_id = auth.uid()
    )
    OR target_member_id IN (
      SELECT id FROM home_members WHERE user_id = auth.uid()
    )
    OR responder_id IN (
      SELECT id FROM home_members WHERE user_id = auth.uid()
    )
  );

-- Los miembros pueden crear solicitudes
DROP POLICY IF EXISTS "Members can create exchange requests" ON task_exchange_requests;
CREATE POLICY "Members can create exchange requests" ON task_exchange_requests
  FOR INSERT WITH CHECK (
    requester_id IN (
      SELECT id FROM home_members WHERE user_id = auth.uid()
    )
  );

-- Los miembros pueden responder a solicitudes dirigidas a ellos
DROP POLICY IF EXISTS "Members can respond to requests" ON task_exchange_requests;
CREATE POLICY "Members can respond to requests" ON task_exchange_requests
  FOR UPDATE USING (
    target_member_id IN (
      SELECT id FROM home_members WHERE user_id = auth.uid()
    )
    OR requester_id IN (
      SELECT id FROM home_members WHERE user_id = auth.uid()
    )
  );

-- ========== SPECIAL_TEMPLATES ==========
-- Los miembros pueden ver plantillas especiales de su hogar
DROP POLICY IF EXISTS "Members can view special templates" ON special_templates;
CREATE POLICY "Members can view special templates" ON special_templates
  FOR SELECT USING (
    home_id IN (
      SELECT home_id FROM home_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Los admins pueden crear plantillas especiales
DROP POLICY IF EXISTS "Admins can create special templates" ON special_templates;
CREATE POLICY "Admins can create special templates" ON special_templates
  FOR INSERT WITH CHECK (
    home_id IN (
      SELECT home_id FROM home_members 
      WHERE user_id = auth.uid() 
      AND status = 'active'
      AND role IN ('owner', 'admin')
    )
  );

-- ========== CHANGE_LOG ==========
-- Los miembros pueden ver el log de su hogar
DROP POLICY IF EXISTS "Members can view change log" ON change_log;
CREATE POLICY "Members can view change log" ON change_log
  FOR SELECT USING (
    home_id IN (
      SELECT home_id FROM home_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Los miembros pueden crear entradas de log
DROP POLICY IF EXISTS "Members can create log entries" ON change_log;
CREATE POLICY "Members can create log entries" ON change_log
  FOR INSERT WITH CHECK (
    home_id IN (
      SELECT home_id FROM home_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );
