-- Script para resetear la base de datos completa
-- ADVERTENCIA: Este script ELIMINA TODAS LAS TABLAS (excepto profiles)
-- Útil para desarrollo cuando necesitas recrear el schema desde cero
-- NO ejecutar en producción.

-- ========== DROP DE TABLAS (en orden inverso a las dependencias) ==========
-- NOTA: profiles NO se elimina para mantener la conexión con auth.users

-- 1. Tablas de propuestas y votaciones
DROP TABLE IF EXISTS proposal_votes CASCADE;
DROP TABLE IF EXISTS improvement_proposals CASCADE;

-- 2. Tablas de desafíos
DROP TABLE IF EXISTS challenge_participants CASCADE;
DROP TABLE IF EXISTS challenges CASCADE;

-- 3. Tablas de logros
DROP TABLE IF EXISTS member_achievements CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;

-- 4. Tablas de favoritos
DROP TABLE IF EXISTS task_favorites CASCADE;

-- 5. Tablas de intercambio de tareas
DROP TABLE IF EXISTS task_exchange_requests CASCADE;

-- 6. Tablas de cancelación de tareas
DROP TABLE IF EXISTS task_cancellations CASCADE;

-- 7. Tablas de completaciones
DROP TABLE IF EXISTS task_step_completions CASCADE;
DROP TABLE IF EXISTS task_completions CASCADE;

-- 8. Tablas de asignaciones
DROP TABLE IF EXISTS task_assignments CASCADE;

-- 9. Tablas de pasos de tareas
DROP TABLE IF EXISTS task_steps CASCADE;
DROP TABLE IF EXISTS task_template_steps CASCADE;

-- 10. Tablas de tareas y templates
DROP TABLE IF EXISTS special_templates CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS task_templates CASCADE;

-- 11. Tablas de zonas del hogar
DROP TABLE IF EXISTS zones CASCADE;

-- 13. Tablas de miembros (incluye columnas de preferencias y notificaciones)
DROP TABLE IF EXISTS home_members CASCADE;

-- 14. Tablas de hogares
DROP TABLE IF EXISTS homes CASCADE;

-- 15. Tabla de registro de cambios
DROP TABLE IF EXISTS change_log CASCADE;

-- 16. Perfiles - COMENTADO para no eliminar
-- DROP TABLE IF EXISTS profiles CASCADE;

-- ========== NOTA IMPORTANTE ==========
-- Después de ejecutar este script, debes ejecutar en orden:
-- 1. scripts/01-create-tables.sql (recrear schema con todas las columnas)
-- 2. scripts/02-seed-data.sql (cargar datos semilla)
-- 3. scripts/03-functions.sql (crear trigger de usuarios)
-- 4. scripts/07-task-cancellations.sql (sistema de cancelación de tareas)
-- 
-- Los usuarios de auth.users y sus profiles se mantienen intactos.
-- 
-- Nuevas características incluidas en 01-create-tables.sql:
-- - home_members: columnas de preferencias (email_notifications, push_notifications, 
--   weekly_reports, theme, font_size, reminder_enabled, reminder_time, reminder_days)
-- - task_cancellations: sistema para cancelar y redistribuir tareas
-- - task_favorites: marcar tareas como favoritas
-- - Índices optimizados para reminders y favoritos
