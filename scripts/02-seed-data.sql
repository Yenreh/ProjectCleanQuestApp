-- Datos iniciales para CleanQuest
-- Este archivo contiene todos los datos semilla necesarios para la aplicación

-- ========== ACHIEVEMENTS (Insignias) ==========
INSERT INTO achievements (name, title, description, icon, color, achievement_type, requirement_type, requirement_value) VALUES
  -- Logros de Bienvenida
  ('onboarding_complete', 'Primer Paso', 'Completaste la configuración inicial de tu hogar', 'check-circle', '#6fbd9d', 'individual', 'onboarding', 1),
  ('first_task', 'Primera Tarea', 'Completaste tu primera tarea', 'check-circle', '#89a7c4', 'individual', 'collaborations', 1),
  ('first_week', 'Primera Semana', 'Completaste tu primera semana en CleanQuest', 'sparkles', '#6fbd9d', 'individual', 'weeks_active', 1),
  
  -- Logros por Tareas Completadas (Progresión)
  ('team_player', 'Jugador de Equipo', 'Completaste 5 tareas', 'users', '#89a7c4', 'individual', 'collaborations', 5),
  ('task_master', 'Maestro de las Tareas', 'Completaste 10 tareas', 'target', '#6fbd9d', 'individual', 'collaborations', 10),
  ('dedicated_member', 'Miembro Dedicado', 'Completaste 25 tareas', 'award', '#d4a574', 'individual', 'collaborations', 25),
  ('super_cleaner', 'Super Limpiador', 'Completaste 50 tareas', 'sparkles', '#c8b5d3', 'individual', 'collaborations', 50),
  ('cleaning_legend', 'Leyenda de la Limpieza', 'Completaste 100 tareas', 'trophy', '#d4a574', 'individual', 'collaborations', 100),
  
  -- Logros por Racha
  ('clean_streak_3', 'Racha de 3 Días', 'Completaste tareas 3 días seguidos', 'sparkles', '#89a7c4', 'individual', 'streak_days', 3),
  ('clean_streak_7', 'Racha Limpia', 'Completaste tareas 7 días seguidos', 'sparkles', '#d4a574', 'individual', 'streak_days', 7),
  ('clean_streak_14', 'Compromiso Total', 'Completaste tareas 14 días seguidos', 'trophy', '#6fbd9d', 'individual', 'streak_days', 14),
  ('clean_streak_30', 'Hábito Perfecto', 'Completaste tareas 30 días seguidos', 'star', '#c8b5d3', 'individual', 'streak_days', 30),
  
  -- Logros de Equipo
  ('equity_circle', 'Círculo de Equidad', 'Tu hogar logró rotación equitativa', 'users', '#6fbd9d', 'team', 'equity_weeks', 1),
  ('home_harmony', 'Hogar en Armonía', '4 semanas consecutivas con +80% de cumplimiento', 'trophy', '#d4a574', 'home', 'consecutive_weeks_80', 4),
  ('master_living', 'Maestros de la Convivencia', 'Excelencia en colaboración y organización', 'sparkles', '#c8b5d3', 'home', 'master_level', 1),
  
  -- Logros por Tiempo Activo
  ('two_weeks', 'Dos Semanas', 'Llevas 2 semanas en CleanQuest', 'clock', '#89a7c4', 'individual', 'weeks_active', 2),
  ('one_month', 'Un Mes', 'Llevas 4 semanas en CleanQuest', 'calendar', '#6fbd9d', 'individual', 'weeks_active', 4),
  ('veteran', 'Veterano', 'Llevas 8 semanas en CleanQuest', 'award', '#d4a574', 'individual', 'weeks_active', 8),
  
  -- Logros de Niveles de Maestría
  ('solver', 'Solucionador', 'Alcanzaste el nivel Solucionador', 'lightbulb', '#89a7c4', 'individual', 'level_reached', 2),
  ('expert', 'Experto', 'Alcanzaste el nivel Experto', 'target', '#6fbd9d', 'individual', 'level_reached', 3),
  ('master', 'Maestro', 'Alcanzaste el nivel Maestro', 'crown', '#d4a574', 'individual', 'level_reached', 4),
  ('visionary', 'Visionario', 'Alcanzaste el nivel Visionario', 'star', '#c8b5d3', 'individual', 'level_reached', 5)
ON CONFLICT (name) DO NOTHING;

-- ========== ZONE PRESETS (Zonas predefinidas para onboarding) ==========
-- Insertar zonas comunes que los usuarios pueden seleccionar
INSERT INTO zone_presets (name, icon, display_order) VALUES
  ('Cocina', 'utensils', 1),
  ('Sala', 'home', 2),
  ('Baño', 'droplet', 3),
  ('Habitaciones', 'bed', 4),
  ('Entrada', 'door-open', 5)
ON CONFLICT (name) DO NOTHING;

-- ========== TASK TEMPLATES (Plantillas de tareas predefinidas) ==========
-- Estas son las templates que se usan en el onboarding
INSERT INTO task_templates (name, title, description, icon, zone, frequency, effort_points, is_public) VALUES
  ('trash', 'Sacar la basura', 'Recoger y llevar la basura al contenedor exterior', 'trash', 'Cocina', 'daily', 1, TRUE),
  ('dishes', 'Lavar los platos', 'Lavar, secar y guardar los platos', 'utensils', 'Cocina', 'daily', 3, TRUE),
  ('sweep', 'Barrer', 'Barrer todas las habitaciones y desechar la basura', 'sparkles', 'Sala', 'weekly', 3, TRUE),
  ('bathroom', 'Limpiar baño', 'Limpieza completa del baño incluyendo inodoro, lavabo, regadera y piso', 'sparkles', 'Baño', 'weekly', 5, TRUE),
  ('rooms', 'Ordenar cuartos', 'Recoger objetos, tender cama y organizar muebles', 'sparkles', 'Habitaciones', 'weekly', 3, TRUE)
ON CONFLICT (name) DO NOTHING;

-- ========== TASK TEMPLATE STEPS (Pasos de las plantillas) ==========
-- Pasos para "Sacar la basura"
INSERT INTO task_template_steps (template_id, step_order, title, is_optional)
SELECT id, 1, 'Recoger basura de todas las habitaciones', FALSE FROM task_templates WHERE name = 'trash'
UNION ALL
SELECT id, 2, 'Llevar al contenedor exterior', FALSE FROM task_templates WHERE name = 'trash';

-- Pasos para "Lavar los platos"
INSERT INTO task_template_steps (template_id, step_order, title, is_optional)
SELECT id, 1, 'Recoger platos sucios', FALSE FROM task_templates WHERE name = 'dishes'
UNION ALL
SELECT id, 2, 'Lavar con jabón', FALSE FROM task_templates WHERE name = 'dishes'
UNION ALL
SELECT id, 3, 'Secar y guardar', FALSE FROM task_templates WHERE name = 'dishes';

-- Pasos para "Barrer"
INSERT INTO task_template_steps (template_id, step_order, title, is_optional)
SELECT id, 1, 'Barrer sala y pasillos', FALSE FROM task_templates WHERE name = 'sweep'
UNION ALL
SELECT id, 2, 'Barrer habitaciones', TRUE FROM task_templates WHERE name = 'sweep'
UNION ALL
SELECT id, 3, 'Desechar la basura recogida', FALSE FROM task_templates WHERE name = 'sweep';

-- Pasos para "Limpiar baño"
INSERT INTO task_template_steps (template_id, step_order, title, is_optional)
SELECT id, 1, 'Limpiar inodoro', FALSE FROM task_templates WHERE name = 'bathroom'
UNION ALL
SELECT id, 2, 'Limpiar lavabo y espejo', FALSE FROM task_templates WHERE name = 'bathroom'
UNION ALL
SELECT id, 3, 'Limpiar regadera', FALSE FROM task_templates WHERE name = 'bathroom'
UNION ALL
SELECT id, 4, 'Trapear el piso', FALSE FROM task_templates WHERE name = 'bathroom';

-- Pasos para "Ordenar cuartos"
INSERT INTO task_template_steps (template_id, step_order, title, is_optional)
SELECT id, 1, 'Recoger ropa y objetos del suelo', FALSE FROM task_templates WHERE name = 'rooms'
UNION ALL
SELECT id, 2, 'Tender la cama', FALSE FROM task_templates WHERE name = 'rooms'
UNION ALL
SELECT id, 3, 'Organizar escritorio/muebles', TRUE FROM task_templates WHERE name = 'rooms';

-- ========== CHALLENGE TEMPLATES (Plantillas de desafíos) ==========
INSERT INTO challenge_templates (name, title, description, challenge_type, category, requirements, duration_type, base_xp, difficulty_multiplier, min_mastery_level, requires_min_tasks) VALUES

-- Individual Challenges - Task Completion
('quick_clean_1', 'Limpieza Rápida', 'Completa 1 tarea hoy', 'individual', 'task_completion', '{"task_count": 1}', 'daily', 20, 1.0, 'novice', 1),
('zone_focus_3', 'Enfoque de Zona', 'Completa 3 tareas de la misma zona', 'individual', 'task_completion', '{"task_count": 3, "same_zone": true}', 'half_cycle', 60, 1.2, 'novice', 3),
('task_master_5', 'Maestro de Tareas', 'Completa 5 tareas diferentes', 'individual', 'task_completion', '{"task_count": 5}', 'full_cycle', 100, 1.3, 'solver', 5),

-- Individual Challenges - Streak
('streak_3', 'Racha de 3', 'Completa al menos 1 tarea durante 3 días seguidos', 'individual', 'streak', '{"days": 3, "min_tasks_per_day": 1}', 'daily', 50, 1.2, 'novice', 1),
('streak_7', 'Semana Perfecta', 'Completa al menos 1 tarea durante 7 días seguidos', 'individual', 'streak', '{"days": 7, "min_tasks_per_day": 1}', 'full_cycle', 150, 1.5, 'solver', 1),

-- Individual Challenges - Variety
('variety_zones', 'Explorador', 'Completa tareas de 3 zonas diferentes', 'individual', 'variety', '{"zone_count": 3, "task_count": 3}', 'full_cycle', 80, 1.3, 'solver', 6),
('all_rounder', 'Todoterreno', 'Completa al menos 1 tarea de cada zona', 'individual', 'variety', '{"all_zones": true}', 'full_cycle', 120, 1.4, 'expert', 5),

-- Individual Challenges - Mastery
('perfect_task', 'Perfeccionista', 'Completa 1 tarea con todos sus pasos', 'individual', 'mastery', '{"task_count": 1, "all_steps": true}', 'half_cycle', 40, 1.2, 'novice', 1),
('mastery_3', 'Maestría Total', 'Completa 3 tareas con todos sus pasos', 'individual', 'mastery', '{"task_count": 3, "all_steps": true}', 'full_cycle', 100, 1.5, 'expert', 3),

-- Individual Challenges - Speed
('speed_demon', 'Demonio de Velocidad', 'Completa una tarea en menos de 30 minutos', 'individual', 'speed', '{"task_count": 1, "time_limit_minutes": 30}', 'daily', 30, 1.1, 'solver', 1),

-- Group Challenges - Team Goal
('team_participation', 'Participación Total', 'Todos los miembros completan al menos 1 tarea', 'group', 'team_goal', '{"min_tasks_per_member": 1}', 'half_cycle', 80, 1.5, 'novice', 2),
('team_effort', 'Esfuerzo en Equipo', 'Todos los miembros completan al menos 2 tareas', 'group', 'team_goal', '{"min_tasks_per_member": 2}', 'full_cycle', 150, 1.8, 'solver', 4),

-- Group Challenges - Collective
('collective_10', 'Meta Colectiva', 'El equipo completa 10 tareas en total', 'group', 'collective', '{"total_tasks": 10}', 'full_cycle', 100, 1.6, 'novice', 5),
('collective_20', 'Gran Esfuerzo', 'El equipo completa 20 tareas en total', 'group', 'collective', '{"total_tasks": 20}', 'full_cycle', 200, 2.0, 'solver', 10),

-- Group Challenges - Zone Blitz
('zone_blitz', 'Blitz de Zona', 'Completa todas las tareas de una zona específica', 'group', 'zone_blitz', '{"complete_zone": true}', 'full_cycle', 150, 1.8, 'expert', 5),

-- Group Challenges - Perfect Week
('perfect_cycle', 'Ciclo Perfecto', 'Logra 100% de cumplimiento este ciclo', 'group', 'perfect_week', '{"completion_rate": 100}', 'full_cycle', 300, 2.5, 'master', 5),

-- Additional Samples
('quick_clean', 'Limpieza Rápida (Sample)', 'Completa 1 tarea hoy', 'individual', 'task_completion', '{"task_count": 1}', 'daily', 20, 1.0, 'novice', 1),
('zone_master', 'Maestro de Zona', 'Completa 3 tareas en zonas diferentes', 'individual', 'variety', '{"zone_count": 3, "task_count": 3}', 'full_cycle', 60, 1.2, 'expert', 3),
('clean_team', 'Equipo Limpio', 'El equipo completa 10 tareas en total este ciclo', 'group', 'collective', '{"total_tasks": 10}', 'full_cycle', 50, 2.0, 'novice', 5),
('team_goal_sample', 'Meta Grupal (Sample)', 'Cada miembro completa al menos 2 tareas este ciclo', 'group', 'team_goal', '{"min_tasks_per_member": 2}', 'full_cycle', 60, 2.5, 'solver', 5)

ON CONFLICT (name) DO NOTHING;

-- ========== ADDITIONAL ACHIEVEMENTS (Logros de Desafíos) ==========
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

-- Task Milestones (Extended)
('task_150', 'Experto en Limpieza', 'Completaste 150 tareas', 'award', '#c8b5d3', 'individual', 'collaborations', 150),
('task_200', 'Maestro del Orden', 'Completaste 200 tareas', 'crown', '#d4a574', 'individual', 'collaborations', 200),

-- XP Milestones
('xp_100', 'Primeros 100 XP', 'Alcanza 100 XP', 'star', '#89a7c4', 'individual', 'total_xp', 100),
('xp_500', '500 XP', 'Alcanza 500 XP', 'star', '#6fbd9d', 'individual', 'total_xp', 500),
('xp_1000', '1000 XP', 'Alcanza 1000 XP', 'star', '#d4a574', 'individual', 'total_xp', 1000),
('xp_2000', '2000 XP', 'Alcanza 2000 XP y nivel Visionario', 'crown', '#c8b5d3', 'individual', 'total_xp', 2000)

ON CONFLICT (name) DO NOTHING;

-- ========== DATOS DE PRUEBA (OPCIONAL) ==========
-- IMPORTANTE: Los datos de prueba (hogar, zonas, tareas) se deben crear después
-- de tener un usuario real en Supabase Auth.
-- 
-- Para configurar datos de prueba:
-- 1. Crea un usuario en Supabase Dashboard > Authentication > Users
--    Email: test@cleanquest.com
--    Password: Test123456!
-- 2. Ejecuta el script: scripts/04-setup-test-user.sql
--    (reemplaza YOUR_USER_ID_HERE con el UUID del usuario creado)
--
-- El script 04-setup-test-user.sql creará automáticamente:
-- - El hogar "Casa Demo"
-- - 4 zonas (Cocina, Baño, Sala, Habitaciones)
-- - 6 tareas de ejemplo
-- - Asignaciones iniciales
-- - Logros desbloqueados
-- - Unión a desafío activo
