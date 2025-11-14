-- Datos iniciales para CleanQuest

-- Insignias predefinidas
INSERT INTO achievements (name, title, description, icon, color, achievement_type, requirement_type, requirement_value) VALUES
  ('first_week', 'Primera Semana', 'Completaste tu primera semana en CleanQuest', 'check-circle', '#6fbd9d', 'individual', 'weeks_active', 1),
  ('team_player', 'Jugador de Equipo', 'Colaboraste con tu equipo', 'users', '#89a7c4', 'individual', 'collaborations', 5),
  ('clean_streak', 'Racha Limpia', 'Completaste tareas 7 días seguidos', 'sparkles', '#d4a574', 'individual', 'streak_days', 7),
  ('equity_circle', 'Círculo de Equidad', 'Todos los miembros contribuyeron equitativamente', 'users', '#6fbd9d', 'team', 'equity_weeks', 1),
  ('home_harmony', 'Hogar en Armonía', '4 semanas consecutivas con +80% de cumplimiento', 'trophy', '#d4a574', 'home', 'consecutive_weeks_80', 4),
  ('master_living', 'Maestros de la Convivencia', 'Excelencia en colaboración y organización', 'sparkles', '#c8b5d3', 'home', 'master_level', 1),
  ('solver', 'Solucionador', 'Alcanzaste el nivel Solucionador', 'lightbulb', '#89a7c4', 'individual', 'level_reached', 2),
  ('expert', 'Experto', 'Alcanzaste el nivel Experto', 'target', '#6fbd9d', 'individual', 'level_reached', 3),
  ('master', 'Maestro', 'Alcanzaste el nivel Maestro', 'crown', '#d4a574', 'individual', 'level_reached', 4),
  ('visionary', 'Visionario', 'Alcanzaste el nivel Visionario', 'star', '#c8b5d3', 'individual', 'level_reached', 5)
ON CONFLICT (name) DO NOTHING;

-- ========== DATOS DE PRUEBA ==========
-- NOTA: Para que funcione correctamente, primero debes crear el usuario en Supabase Auth
-- Puedes hacerlo desde la interfaz de Supabase Dashboard > Authentication > Users
-- O desde el registro de la app

-- Usuario de prueba (debes crear este usuario en Supabase Auth primero)
-- Email: test@cleanquest.com
-- Password: Test123456!
-- El perfil se creará automáticamente por el trigger

-- Hogar de prueba
INSERT INTO homes (name, created_by, rotation_policy, auto_rotation, reminder_time)
VALUES (
  'Casa Demo',
  NULL, -- Se debe actualizar con el user_id real después de crear el usuario
  'weekly',
  true,
  '09:00:00'
) ON CONFLICT DO NOTHING;

-- Zonas del hogar de prueba
INSERT INTO zones (home_id, name, icon)
SELECT h.id, 'Cocina', 'utensils'
FROM homes h WHERE h.name = 'Casa Demo'
ON CONFLICT DO NOTHING;

INSERT INTO zones (home_id, name, icon)
SELECT h.id, 'Baño', 'droplet'
FROM homes h WHERE h.name = 'Casa Demo'
ON CONFLICT DO NOTHING;

INSERT INTO zones (home_id, name, icon)
SELECT h.id, 'Sala', 'sofa'
FROM homes h WHERE h.name = 'Casa Demo'
ON CONFLICT DO NOTHING;

INSERT INTO zones (home_id, name, icon)
SELECT h.id, 'Habitaciones', 'bed'
FROM homes h WHERE h.name = 'Casa Demo'
ON CONFLICT DO NOTHING;

-- Miembros del hogar de prueba (se debe actualizar user_id manualmente)
-- INSERT INTO home_members (user_id, home_id, email, role, status, total_points, weeks_active, tasks_completed)
-- SELECT 
--   'USER_ID_AQUI', -- Reemplazar con el ID real del usuario
--   h.id,
--   'test@cleanquest.com',
--   'owner',
--   'active',
--   150,
--   3,
--   25
-- FROM homes h WHERE h.name = 'Casa Demo';

-- Tareas de ejemplo para el hogar de prueba
INSERT INTO tasks (home_id, zone_id, title, description, frequency, effort_points, icon, is_active)
SELECT 
  h.id,
  z.id,
  'Lavar platos',
  'Lavar todos los platos y cubiertos',
  'daily',
  3,
  'utensils',
  true
FROM homes h
CROSS JOIN zones z
WHERE h.name = 'Casa Demo' AND z.name = 'Cocina'
ON CONFLICT DO NOTHING;

INSERT INTO tasks (home_id, zone_id, title, description, frequency, effort_points, icon, is_active)
SELECT 
  h.id,
  z.id,
  'Limpiar mesón',
  'Limpiar y desinfectar el mesón de la cocina',
  'daily',
  2,
  'sparkles',
  true
FROM homes h
CROSS JOIN zones z
WHERE h.name = 'Casa Demo' AND z.name = 'Cocina'
ON CONFLICT DO NOTHING;

INSERT INTO tasks (home_id, zone_id, title, description, frequency, effort_points, icon, is_active)
SELECT 
  h.id,
  z.id,
  'Sacar basura',
  'Sacar la basura y poner bolsa nueva',
  'daily',
  1,
  'trash',
  true
FROM homes h
CROSS JOIN zones z
WHERE h.name = 'Casa Demo' AND z.name = 'Cocina'
ON CONFLICT DO NOTHING;

INSERT INTO tasks (home_id, zone_id, title, description, frequency, effort_points, icon, is_active)
SELECT 
  h.id,
  z.id,
  'Limpiar baño',
  'Limpiar sanitario, lavamanos y ducha',
  'weekly',
  5,
  'droplet',
  true
FROM homes h
CROSS JOIN zones z
WHERE h.name = 'Casa Demo' AND z.name = 'Baño'
ON CONFLICT DO NOTHING;

INSERT INTO tasks (home_id, zone_id, title, description, frequency, effort_points, icon, is_active)
SELECT 
  h.id,
  z.id,
  'Aspirar sala',
  'Aspirar alfombra y limpiar muebles',
  'weekly',
  4,
  'sofa',
  true
FROM homes h
CROSS JOIN zones z
WHERE h.name = 'Casa Demo' AND z.name = 'Sala'
ON CONFLICT DO NOTHING;

INSERT INTO tasks (home_id, zone_id, title, description, frequency, effort_points, icon, is_active)
SELECT 
  h.id,
  z.id,
  'Ordenar habitaciones',
  'Recoger ropa y ordenar objetos',
  'weekly',
  3,
  'bed',
  true
FROM homes h
CROSS JOIN zones z
WHERE h.name = 'Casa Demo' AND z.name = 'Habitaciones'
ON CONFLICT DO NOTHING;

-- Desafío de ejemplo
INSERT INTO challenges (home_id, title, description, challenge_type, start_date, end_date, points_reward, is_active)
SELECT 
  h.id,
  'Semana Impecable',
  'Completa todas las tareas de la semana',
  'group',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '7 days',
  50,
  true
FROM homes h WHERE h.name = 'Casa Demo'
ON CONFLICT DO NOTHING;

-- Propuesta de mejora de ejemplo (solo visible para visionarios)
INSERT INTO improvement_proposals (home_id, proposed_by, title, hypothesis, expected_impact, status, votes_yes, votes_no)
SELECT 
  h.id,
  NULL, -- Se debe actualizar con member_id real
  'Reducir frecuencia de baño',
  'Cambiar limpieza de baño de semanal a quincenal puede reducir carga sin afectar higiene',
  'Medir satisfacción después de 1 mes',
  'voting',
  0,
  0
FROM homes h WHERE h.name = 'Casa Demo'
ON CONFLICT DO NOTHING;

-- Plantillas especiales globales
INSERT INTO special_templates (home_id, name, description, modifications)
SELECT 
  h.id,
  'Tareas básicas',
  'Configuración inicial de tareas para empezar',
  '{"tasks": [{"title": "Lavar platos", "zone": "Cocina", "frequency": "daily", "effort": 3}]}'::jsonb
FROM homes h WHERE h.name = 'Casa Demo'
ON CONFLICT DO NOTHING;
