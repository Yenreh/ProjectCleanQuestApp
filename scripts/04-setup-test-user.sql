-- Script de configuración rápida del usuario de prueba
-- Ejecuta este script DESPUÉS de crear el usuario en Supabase Auth
-- Reemplaza el UUID con el ID real del usuario creado

-- Variables (actualiza estas)
\set user_id '00000000-0000-0000-0000-000000000000'
\set user_email 'test@cleanquest.com'

-- 1. Crear el hogar de prueba
INSERT INTO homes (name, created_by, rotation_policy, auto_rotation, reminder_time)
VALUES (
  'Casa Demo',
  :'user_id',
  'weekly',
  true,
  '09:00:00'
) ON CONFLICT DO NOTHING;

-- 2. Crear zonas del hogar
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

-- 3. Crear el miembro del hogar
INSERT INTO home_members (user_id, home_id, email, role, status, total_points, weeks_active, tasks_completed, current_streak, mastery_level, joined_at)
SELECT 
  :'user_id',
  h.id,
  :'user_email',
  'owner',
  'active',
  150,
  3,
  25,
  5,
  'solver',
  NOW() - INTERVAL '3 weeks'
FROM homes h 
WHERE h.name = 'Casa Demo'
ON CONFLICT (home_id, email) DO UPDATE
SET 
  user_id = EXCLUDED.user_id,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  total_points = EXCLUDED.total_points,
  weeks_active = EXCLUDED.weeks_active,
  tasks_completed = EXCLUDED.tasks_completed,
  current_streak = EXCLUDED.current_streak,
  mastery_level = EXCLUDED.mastery_level;

-- 4. Crear tareas de ejemplo
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

-- 5. Crear desafío activo
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

-- 6. Obtener el member_id para los siguientes pasos
DO $$
DECLARE
  v_member_id INTEGER;
  v_home_id INTEGER;
  v_task_id INTEGER;
BEGIN
  -- Obtener member_id y home_id
  SELECT id, home_id INTO v_member_id, v_home_id
  FROM home_members 
  WHERE email = 'test@cleanquest.com';
  
  RAISE NOTICE 'Member ID: %', v_member_id;
  RAISE NOTICE 'Home ID: %', v_home_id;
  
  -- 7. Asignar tareas para hoy (3 tareas diarias)
  FOR v_task_id IN 
    SELECT t.id 
    FROM tasks t
    WHERE t.home_id = v_home_id
    AND t.frequency = 'daily'
    AND t.is_active = true
    LIMIT 3
  LOOP
    INSERT INTO task_assignments (task_id, member_id, assigned_date, due_date, status)
    VALUES (
      v_task_id,
      v_member_id,
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '1 day',
      'pending'
    )
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Assigned task: %', v_task_id;
  END LOOP;
  
  -- 8. Asignar 1 tarea semanal
  SELECT t.id INTO v_task_id
  FROM tasks t
  WHERE t.home_id = v_home_id
  AND t.frequency = 'weekly'
  AND t.is_active = true
  LIMIT 1;
  
  IF v_task_id IS NOT NULL THEN
    INSERT INTO task_assignments (task_id, member_id, assigned_date, due_date, status)
    VALUES (
      v_task_id,
      v_member_id,
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '7 days',
      'pending'
    )
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Assigned weekly task: %', v_task_id;
  END IF;
  
  -- 9. Completar algunas tareas del pasado (para histórico)
  FOR v_task_id IN 
    SELECT t.id 
    FROM tasks t
    WHERE t.home_id = v_home_id
    AND t.is_active = true
    LIMIT 5
  LOOP
    -- Crear asignación del pasado
    INSERT INTO task_assignments (task_id, member_id, assigned_date, due_date, status)
    VALUES (
      v_task_id,
      v_member_id,
      CURRENT_DATE - INTERVAL '7 days',
      CURRENT_DATE - INTERVAL '6 days',
      'completed'
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_task_id;
    
    -- Si se creó la asignación, crear el completion
    IF v_task_id IS NOT NULL THEN
      INSERT INTO task_completions (assignment_id, member_id, points_earned, completed_at)
      SELECT 
        v_task_id,
        v_member_id,
        t.effort_points,
        CURRENT_DATE - INTERVAL '6 days'
      FROM tasks t
      WHERE t.id = (SELECT task_id FROM task_assignments WHERE id = v_task_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
  
  -- 10. Desbloquear algunos logros
  INSERT INTO member_achievements (member_id, achievement_id, unlocked_at)
  SELECT 
    v_member_id,
    a.id,
    NOW() - INTERVAL '2 weeks'
  FROM achievements a
  WHERE a.name IN ('first_week', 'team_player', 'solver')
  ON CONFLICT DO NOTHING;
  
  -- 11. Unir al desafío activo
  INSERT INTO challenge_participants (challenge_id, member_id, status, points_earned)
  SELECT 
    c.id,
    v_member_id,
    'joined',
    20
  FROM challenges c
  WHERE c.home_id = v_home_id
  AND c.is_active = true
  LIMIT 1
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'Setup completado exitosamente!';
END $$;

-- Verificación final
SELECT 
  'Perfil' as tipo,
  email,
  full_name as nombre
FROM profiles 
WHERE email = 'test@cleanquest.com'

UNION ALL

SELECT 
  'Miembro' as tipo,
  hm.email,
  CONCAT('Nivel: ', hm.mastery_level, ' | Puntos: ', hm.total_points) as nombre
FROM home_members hm
WHERE hm.email = 'test@cleanquest.com'

UNION ALL

SELECT 
  'Tareas Asignadas' as tipo,
  CAST(COUNT(*) as TEXT) as email,
  CONCAT(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), ' completadas, ', 
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), ' pendientes') as nombre
FROM task_assignments ta
JOIN home_members hm ON hm.id = ta.member_id
WHERE hm.email = 'test@cleanquest.com'

UNION ALL

SELECT 
  'Logros' as tipo,
  CAST(COUNT(*) as TEXT) as email,
  STRING_AGG(a.title, ', ') as nombre
FROM member_achievements ma
JOIN home_members hm ON hm.id = ma.member_id
JOIN achievements a ON a.id = ma.achievement_id
WHERE hm.email = 'test@cleanquest.com'
GROUP BY hm.id;
