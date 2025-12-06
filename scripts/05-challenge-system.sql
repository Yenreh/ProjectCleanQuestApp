-- Challenge System Enhancement (Simplified)
-- This script adds comprehensive challenge system with random generation,
-- variable durations, XP-based progression, and cycle alignment
-- Execute after 01-create-tables.sql, 02-seed-data.sql, and 03-functions.sql
--
-- NOTE: All calculation logic (XP, levels, durations) is handled in TypeScript backend

-- ========== NEW TABLES ==========

-- Challenge Templates: Define types of challenges that can be generated
CREATE TABLE IF NOT EXISTS challenge_templates (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('individual', 'group')),
  category TEXT NOT NULL CHECK (category IN ('task_completion', 'streak', 'speed', 'variety', 'mastery', 'team_goal', 'zone_blitz', 'collective', 'perfect_week', 'support')),
  
  -- Requirements (JSON structure varies by category)
  -- Examples:
  -- task_completion: {"task_count": 3, "zone_id": 1}
  -- streak: {"days": 3}
  -- speed: {"task_id": 5, "time_limit_minutes": 30}
  -- variety: {"zone_count": 3, "task_count": 5}
  requirements JSONB NOT NULL,
  
  -- Duration configuration
  duration_type TEXT NOT NULL CHECK (duration_type IN ('daily', 'quarter_cycle', 'half_cycle', 'full_cycle', 'multi_cycle')),
  duration_multiplier DECIMAL(3,2) DEFAULT 1.0, -- For multi_cycle (e.g., 2.0 = 2 cycles)
  
  -- Rewards
  base_xp INTEGER NOT NULL DEFAULT 50,
  difficulty_multiplier DECIMAL(3,2) DEFAULT 1.0,
  
  -- Availability
  min_mastery_level TEXT CHECK (min_mastery_level IN ('novice', 'solver', 'expert', 'master', 'visionary')),
  requires_min_tasks INTEGER DEFAULT 0, -- Minimum tasks in home to generate this challenge
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Active Challenges: Instances of challenges currently running
CREATE TABLE IF NOT EXISTS active_challenges (
  id SERIAL PRIMARY KEY,
  template_id INTEGER REFERENCES challenge_templates(id) ON DELETE SET NULL,
  home_id INTEGER NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  
  -- Challenge details (copied from template for historical accuracy)
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('individual', 'group')),
  category TEXT NOT NULL,
  requirements JSONB NOT NULL,
  
  -- Timing
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  cycle_aligned BOOLEAN NOT NULL DEFAULT TRUE, -- Whether this challenge aligns with rotation cycle
  
  -- Rewards
  xp_reward INTEGER NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'cancelled')),
  
  -- For individual challenges, track which member it's assigned to
  assigned_to INTEGER REFERENCES home_members(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Challenge Progress: Track individual member progress on challenges
CREATE TABLE IF NOT EXISTS challenge_progress (
  id SERIAL PRIMARY KEY,
  challenge_id INTEGER NOT NULL REFERENCES active_challenges(id) ON DELETE CASCADE,
  member_id INTEGER NOT NULL REFERENCES home_members(id) ON DELETE CASCADE,
  
  -- Progress tracking (structure varies by challenge type)
  -- Examples:
  -- task_completion: {"completed_tasks": [1, 5, 7], "target": 3}
  -- streak: {"current_streak": 2, "target": 3, "last_completion": "2024-01-15"}
  -- collective: {"member_contribution": 5, "team_total": 12, "target": 20}
  progress_data JSONB NOT NULL DEFAULT '{}',
  
  -- Completion
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  xp_awarded INTEGER DEFAULT 0,
  
  -- Tracking
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
  
  -- Reference to source (task_id, challenge_id, achievement_id, etc.)
  reference_type TEXT,
  reference_id INTEGER,
  
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========== MODIFY EXISTING TABLES ==========

-- Add XP column to home_members (total_points is deprecated but kept for backward compatibility)
ALTER TABLE home_members ADD COLUMN IF NOT EXISTS total_xp INTEGER NOT NULL DEFAULT 0;

-- Add challenge-related stats to home_members
ALTER TABLE home_members ADD COLUMN IF NOT EXISTS challenges_completed INTEGER NOT NULL DEFAULT 0;
ALTER TABLE home_members ADD COLUMN IF NOT EXISTS group_challenges_completed INTEGER NOT NULL DEFAULT 0;
ALTER TABLE home_members ADD COLUMN IF NOT EXISTS speed_challenges_completed INTEGER NOT NULL DEFAULT 0;
ALTER TABLE home_members ADD COLUMN IF NOT EXISTS perfect_challenges INTEGER NOT NULL DEFAULT 0;

-- Add template reference to existing challenges table
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS template_id INTEGER REFERENCES challenge_templates(id) ON DELETE SET NULL;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS duration_type TEXT CHECK (duration_type IN ('daily', 'quarter_cycle', 'half_cycle', 'full_cycle', 'multi_cycle'));
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS cycle_aligned BOOLEAN DEFAULT TRUE;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS xp_reward INTEGER;

-- ========== INDEXES ==========

-- Challenge Templates
CREATE INDEX IF NOT EXISTS idx_challenge_templates_active ON challenge_templates(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_challenge_templates_type ON challenge_templates(challenge_type);
CREATE INDEX IF NOT EXISTS idx_challenge_templates_category ON challenge_templates(category);

-- Active Challenges
CREATE INDEX IF NOT EXISTS idx_active_challenges_home ON active_challenges(home_id);
CREATE INDEX IF NOT EXISTS idx_active_challenges_status ON active_challenges(status);
CREATE INDEX IF NOT EXISTS idx_active_challenges_assigned ON active_challenges(assigned_to);
CREATE INDEX IF NOT EXISTS idx_active_challenges_dates ON active_challenges(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_active_challenges_home_status ON active_challenges(home_id, status) WHERE status = 'active';

-- Challenge Progress
CREATE INDEX IF NOT EXISTS idx_challenge_progress_challenge ON challenge_progress(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_member ON challenge_progress(member_id);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_completed ON challenge_progress(is_completed);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_member_active ON challenge_progress(member_id, is_completed) WHERE is_completed = FALSE;

-- XP Transactions
CREATE INDEX IF NOT EXISTS idx_xp_transactions_member ON xp_transactions(member_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_source ON xp_transactions(source);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_created ON xp_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_reference ON xp_transactions(reference_type, reference_id);

-- Home Members XP
CREATE INDEX IF NOT EXISTS idx_home_members_xp ON home_members(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_home_members_challenges ON home_members(challenges_completed DESC);

-- ========== SIMPLE TRIGGERS ==========

-- Function to update last_updated timestamp on challenge_progress
CREATE OR REPLACE FUNCTION update_challenge_progress_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for challenge_progress updates
DROP TRIGGER IF EXISTS update_challenge_progress_timestamp ON challenge_progress;
CREATE TRIGGER update_challenge_progress_timestamp
  BEFORE UPDATE ON challenge_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_challenge_progress_timestamp();

-- Function to auto-expire challenges (called from backend)
CREATE OR REPLACE FUNCTION expire_old_challenges() RETURNS void AS $$
BEGIN
  UPDATE active_challenges
  SET status = 'expired'
  WHERE status = 'active'
    AND end_date < NOW();
END;
$$ LANGUAGE plpgsql;

-- ========== SEED CHALLENGE TEMPLATES ==========

INSERT INTO challenge_templates (name, title, description, challenge_type, category, requirements, duration_type, base_xp, difficulty_multiplier, min_mastery_level, requires_min_tasks) VALUES

-- Individual Challenges - Task Completion
('quick_clean_1', 'Limpieza Rápida', 'Completa 1 tarea hoy', 'individual', 'task_completion', '{"task_count": 1}', 'daily', 15, 1.0, 'novice', 1),
('zone_focus_3', 'Enfoque de Zona', 'Completa 3 tareas de la misma zona', 'individual', 'task_completion', '{"task_count": 3, "same_zone": true}', 'half_cycle', 50, 1.2, 'novice', 3),
('task_master_5', 'Maestro de Tareas', 'Completa 5 tareas diferentes', 'individual', 'task_completion', '{"task_count": 5}', 'full_cycle', 75, 1.3, 'solver', 5),

-- Individual Challenges - Streak
('streak_3', 'Racha de 3', 'Completa al menos 1 tarea durante 3 días seguidos', 'individual', 'streak', '{"days": 3, "min_tasks_per_day": 1}', 'daily', 40, 1.2, 'novice', 1),
('streak_7', 'Semana Perfecta', 'Completa al menos 1 tarea durante 7 días seguidos', 'individual', 'streak', '{"days": 7, "min_tasks_per_day": 1}', 'full_cycle', 100, 1.5, 'solver', 1),

-- Individual Challenges - Variety
('variety_zones', 'Explorador', 'Completa tareas de 3 zonas diferentes', 'individual', 'variety', '{"zone_count": 3, "task_count": 3}', 'full_cycle', 60, 1.3, 'solver', 6),
('all_rounder', 'Todoterreno', 'Completa al menos 1 tarea de cada zona', 'individual', 'variety', '{"all_zones": true}', 'full_cycle', 80, 1.4, 'expert', 5),

-- Individual Challenges - Mastery
('perfect_task', 'Perfeccionista', 'Completa 1 tarea con todos sus pasos', 'individual', 'mastery', '{"task_count": 1, "all_steps": true}', 'half_cycle', 35, 1.2, 'novice', 1),
('mastery_3', 'Maestría Total', 'Completa 3 tareas con todos sus pasos', 'individual', 'mastery', '{"task_count": 3, "all_steps": true}', 'full_cycle', 90, 1.5, 'expert', 3),

-- Individual Challenges - Speed
('speed_demon', 'Demonio de Velocidad', 'Completa una tarea en menos de 30 minutos', 'individual', 'speed', '{"task_count": 1, "time_limit_minutes": 30}', 'daily', 25, 1.1, 'solver', 1),

-- Group Challenges - Team Goal
('team_participation', 'Participación Total', 'Todos los miembros completan al menos 1 tarea', 'group', 'team_goal', '{"min_tasks_per_member": 1}', 'half_cycle', 60, 1.5, 'novice', 2),
('team_effort', 'Esfuerzo en Equipo', 'Todos los miembros completan al menos 2 tareas', 'group', 'team_goal', '{"min_tasks_per_member": 2}', 'full_cycle', 100, 1.8, 'solver', 4),

-- Group Challenges - Collective
('collective_10', 'Meta Colectiva', 'El equipo completa 10 tareas en total', 'group', 'collective', '{"total_tasks": 10}', 'full_cycle', 80, 1.6, 'novice', 5),
('collective_20', 'Gran Esfuerzo', 'El equipo completa 20 tareas en total', 'group', 'collective', '{"total_tasks": 20}', 'full_cycle', 150, 2.0, 'solver', 10),

-- Group Challenges - Zone Blitz
('zone_blitz', 'Blitz de Zona', 'Completa todas las tareas de una zona específica', 'group', 'zone_blitz', '{"complete_zone": true}', 'full_cycle', 120, 1.8, 'expert', 5),

-- Group Challenges - Perfect Week
('perfect_cycle', 'Ciclo Perfecto', 'Logra 100% de cumplimiento este ciclo', 'group', 'perfect_week', '{"completion_rate": 100}', 'full_cycle', 200, 2.5, 'master', 5)

ON CONFLICT (name) DO NOTHING;

-- ========== NEW CHALLENGE-RELATED ACHIEVEMENTS ==========

INSERT INTO achievements (name, title, description, icon, color, achievement_type, requirement_type, requirement_value) VALUES

-- Challenge Completion Milestones
('challenge_rookie', 'Retador Novato', 'Completa tu primer desafío', 'target', '#89a7c4', 'individual', 'challenges_completed', 1),
('challenge_enthusiast', 'Entusiasta de Desafíos', 'Completa 5 desafíos', 'trophy', '#6fbd9d', 'individual', 'challenges_completed', 5),
('challenge_veteran', 'Veterano de Desafíos', 'Completa 10 desafíos', 'award', '#d4a574', 'individual', 'challenges_completed', 10),
('challenge_master', 'Maestro de Desafíos', 'Completa 20 desafíos', 'star', '#c8b5d3', 'individual', 'challenges_completed', 20),
('challenge_legend', 'Leyenda de Desafíos', 'Completa 50 desafíos', 'crown', '#d4a574', 'individual', 'challenges_completed', 50),

-- Group Challenge Achievements
('team_challenge', 'Jugador de Equipo', 'Completa tu primer desafío grupal', 'users', '#89a7c4', 'team', 'group_challenges_completed', 1),
('team_champion', 'Campeón de Equipo', 'Completa 10 desafíos grupales', 'trophy', '#c8b5d3', 'team', 'group_challenges_completed', 10),

-- Special Challenge Achievements
('speed_demon_achievement', 'Demonio de Velocidad', 'Completa 3 desafíos de velocidad', 'zap', '#d4a574', 'individual', 'speed_challenges_completed', 3),
('perfectionist', 'Perfeccionista', 'Completa 5 desafíos de maestría perfectamente', 'sparkles', '#c8b5d3', 'individual', 'perfect_challenges', 5),

-- XP Milestones
('xp_100', 'Primeros 100 XP', 'Alcanza 100 XP', 'star', '#89a7c4', 'individual', 'total_xp', 100),
('xp_500', '500 XP', 'Alcanza 500 XP', 'star', '#6fbd9d', 'individual', 'total_xp', 500),
('xp_1000', '1000 XP', 'Alcanza 1000 XP', 'star', '#d4a574', 'individual', 'total_xp', 1000),
('xp_2000', '2000 XP', 'Alcanza 2000 XP y nivel Visionario', 'crown', '#c8b5d3', 'individual', 'total_xp', 2000)

ON CONFLICT (name) DO NOTHING;

-- ========== COMMENTS ==========

COMMENT ON TABLE challenge_templates IS 'Defines types of challenges that can be randomly generated';
COMMENT ON TABLE active_challenges IS 'Currently active challenge instances';
COMMENT ON TABLE challenge_progress IS 'Tracks individual member progress on challenges';
COMMENT ON TABLE xp_transactions IS 'Audit log for all XP gains and losses';

COMMENT ON COLUMN home_members.total_xp IS 'Total experience points earned (replaces total_points for progression)';
COMMENT ON COLUMN home_members.total_points IS 'DEPRECATED: Use total_xp instead. Kept for backward compatibility.';
