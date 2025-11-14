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
