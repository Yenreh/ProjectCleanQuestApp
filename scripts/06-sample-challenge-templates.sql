-- Sample Challenge Templates
-- Run this after 04-challenge-system.sql to populate the database with example challenges

-- Individual Daily Challenges
INSERT INTO challenge_templates (
  name,
  title,
  description,
  challenge_type,
  category,
  requirements,
  duration_type,
  duration_multiplier,
  base_xp,
  difficulty_multiplier,
  min_mastery_level,
  requires_min_tasks,
  is_active
) VALUES
-- Limpieza Rápida (Complete 1 task today)
(
  'quick_clean',
  'Limpieza Rápida',
  'Completa 1 tarea hoy',
  'individual',
  'task_completion',
  '{"task_count": 1}'::jsonb,
  'daily',
  1.0,
  20,
  1.0,
  'novice',
  1,
  true
),
-- Racha de 3 (Complete tasks 3 days in a row)
(
  'streak_3',
  'Racha de 3',
  'Completa al menos 1 tarea durante 3 días seguidos',
  'individual',
  'streak',
  '{"days": 3}'::jsonb,
  'multi_cycle',
  3.0,
  50,
  1.5,
  'solver',
  3,
  true
),
-- Maestro de Zona (Complete 3 tasks in different zones)
(
  'zone_master',
  'Maestro de Zona',
  'Completa 3 tareas en zonas diferentes',
  'individual',
  'variety',
  '{"zone_count": 3, "task_count": 3}'::jsonb,
  'full_cycle',
  1.0,
  40,
  1.2,
  'expert',
  3,
  true
);

-- Group Challenges
INSERT INTO challenge_templates (
  name,
  title,
  description,
  challenge_type,
  category,
  requirements,
  duration_type,
  duration_multiplier,
  base_xp,
  difficulty_multiplier,
  min_mastery_level,
  requires_min_tasks,
  is_active
) VALUES
-- Equipo Limpio (Team completes 10 tasks this cycle)
(
  'clean_team',
  'Equipo Limpio',
  'El equipo completa 10 tareas en total este ciclo',
  'group',
  'collective',
  '{"total_tasks": 10}'::jsonb,
  'full_cycle',
  1.0,
  30,
  2.0,
  'novice',
  5,
  true
),
-- Meta Grupal (Everyone completes at least 2 tasks)
(
  'team_goal',
  'Meta Grupal',
  'Cada miembro completa al menos 2 tareas este ciclo',
  'group',
  'team_goal',
  '{"min_tasks_per_member": 2}'::jsonb,
  'full_cycle',
  1.0,
  40,
  2.5,
  'solver',
  5,
  true
);

-- Verify insertion
SELECT 
  name, 
  title, 
  challenge_type, 
  category,
  duration_type,
  base_xp,
  is_active
FROM challenge_templates
ORDER BY challenge_type, name;
