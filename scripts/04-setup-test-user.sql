-- Script de configuración rápida del usuario de prueba
-- Ejecuta este script DESPUÉS de crear el usuario en Supabase Auth
-- Reemplaza 'YOUR_USER_ID_HERE' con el UUID real del usuario

-- Variables (actualiza estas)
\set user_id 'YOUR_USER_ID_HERE'
\set user_email 'test@cleanquest.com'

-- 1. Actualizar el hogar de prueba
UPDATE homes 
SET created_by = :'user_id'
WHERE name = 'Casa Demo';

-- 2. Crear el miembro del hogar
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

-- 3. Obtener el member_id para los siguientes pasos
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
  
  -- 4. Asignar tareas para hoy (3 tareas diarias)
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
  
  -- 5. Asignar 1 tarea semanal
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
  
  -- 6. Completar algunas tareas del pasado (para histórico)
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
  
  -- 7. Desbloquear algunos logros
  INSERT INTO member_achievements (member_id, achievement_id, unlocked_at)
  SELECT 
    v_member_id,
    a.id,
    NOW() - INTERVAL '2 weeks'
  FROM achievements a
  WHERE a.name IN ('first_week', 'team_player', 'solver')
  ON CONFLICT DO NOTHING;
  
  -- 8. Unir al desafío activo
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
