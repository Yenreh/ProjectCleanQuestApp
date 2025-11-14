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

-- 6. Tablas de completaciones
DROP TABLE IF EXISTS task_step_completions CASCADE;
DROP TABLE IF EXISTS task_completions CASCADE;

-- 7. Tablas de asignaciones
DROP TABLE IF EXISTS task_assignments CASCADE;

-- 8. Tablas de pasos de tareas
DROP TABLE IF EXISTS task_steps CASCADE;
DROP TABLE IF EXISTS task_template_steps CASCADE;

-- 9. Tablas de tareas y templates
DROP TABLE IF EXISTS special_templates CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS task_templates CASCADE;

-- 10. Tabla de zonas predefinidas
DROP TABLE IF EXISTS zone_presets CASCADE;

-- 11. Tablas de zonas del hogar
DROP TABLE IF EXISTS zones CASCADE;

-- 12. Tablas de miembros
DROP TABLE IF EXISTS home_members CASCADE;

-- 13. Tablas de hogares
DROP TABLE IF EXISTS homes CASCADE;

-- 13. Perfiles - COMENTADO para no eliminar
-- DROP TABLE IF EXISTS profiles CASCADE;

-- ========== NOTA IMPORTANTE ==========
-- Después de ejecutar este script, debes ejecutar en orden:
-- 1. scripts/01-create-tables.sql (recrear schema)
-- 2. scripts/02-seed-data.sql (cargar datos semilla)
-- 3. scripts/03-functions.sql (crear funciones)
-- 
-- Los usuarios de auth.users y sus profiles se mantienen intactos.
