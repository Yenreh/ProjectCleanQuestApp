-- Datos iniciales para CleanQuest
-- Este archivo contiene todos los datos semilla necesarios para la aplicación

-- ========== ACHIEVEMENTS (Insignias) ==========
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

-- ========== ZONE PRESETS (Zonas predefinidas para onboarding) ==========
-- Tabla temporal para almacenar zonas comunes que los usuarios pueden seleccionar
CREATE TABLE IF NOT EXISTS zone_presets (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL,
  display_order INTEGER DEFAULT 0
);

INSERT INTO zone_presets (name, icon, display_order) VALUES
  ('cocina', 'utensils', 1),
  ('sala', 'home', 2),
  ('baño', 'droplet', 3),
  ('habitaciones', 'bed', 4),
  ('entrada', 'door-open', 5)
ON CONFLICT (name) DO NOTHING;

-- ========== TASK TEMPLATES (Plantillas de tareas predefinidas) ==========
-- Estas son las templates que se usan en el onboarding
INSERT INTO task_templates (name, title, description, icon, zone, frequency, effort_points, is_public) VALUES
  ('trash', 'Sacar la basura', 'Recoger y llevar la basura al contenedor exterior', 'trash', 'cocina', 'daily', 1, TRUE),
  ('dishes', 'Lavar los platos', 'Lavar, secar y guardar los platos', 'utensils', 'cocina', 'daily', 3, TRUE),
  ('sweep', 'Barrer', 'Barrer todas las habitaciones y desechar la basura', 'sparkles', 'sala', 'weekly', 3, TRUE),
  ('bathroom', 'Limpiar baño', 'Limpieza completa del baño incluyendo inodoro, lavabo, regadera y piso', 'sparkles', 'baño', 'weekly', 5, TRUE),
  ('rooms', 'Ordenar cuartos', 'Recoger objetos, tender cama y organizar muebles', 'sparkles', 'habitaciones', 'weekly', 3, TRUE)
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
