-- Script rápido para agregar tareas de prueba
-- Ejecuta esto DESPUÉS de tener un usuario registrado
-- Este script usa el primer usuario que encuentre y su hogar

-- Crear tareas para el hogar existente
DO $$
DECLARE
  v_home_id INTEGER;
  v_member_id INTEGER;
  v_zone_kitchen INTEGER;
  v_zone_bathroom INTEGER;
  v_task1 INTEGER;
  v_task2 INTEGER;
  v_task3 INTEGER;
BEGIN
  -- Obtener el primer hogar activo
  SELECT h.id INTO v_home_id
  FROM homes h
  LIMIT 1;
  
  IF v_home_id IS NULL THEN
    RAISE EXCEPTION 'No hay hogares creados. Por favor completa el onboarding primero.';
  END IF;
  
  RAISE NOTICE 'Usando hogar ID: %', v_home_id;
  
  -- Obtener el primer miembro activo del hogar
  SELECT id INTO v_member_id
  FROM home_members
  WHERE home_id = v_home_id
  AND status = 'active'
  LIMIT 1;
  
  IF v_member_id IS NULL THEN
    RAISE EXCEPTION 'No hay miembros activos en el hogar.';
  END IF;
  
  RAISE NOTICE 'Usando miembro ID: %', v_member_id;
  
  -- Crear zonas si no existen
  INSERT INTO zones (home_id, name, icon)
  VALUES (v_home_id, 'Cocina', 'utensils')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_zone_kitchen;
  
  IF v_zone_kitchen IS NULL THEN
    SELECT id INTO v_zone_kitchen FROM zones WHERE home_id = v_home_id AND name = 'Cocina';
  END IF;
  
  INSERT INTO zones (home_id, name, icon)
  VALUES (v_home_id, 'Baño', 'droplet')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_zone_bathroom;
  
  IF v_zone_bathroom IS NULL THEN
    SELECT id INTO v_zone_bathroom FROM zones WHERE home_id = v_home_id AND name = 'Baño';
  END IF;
  
  -- Crear tareas
  INSERT INTO tasks (home_id, zone_id, title, description, frequency, effort_points, icon, is_active)
  VALUES 
    (v_home_id, v_zone_kitchen, 'Lavar platos', 'Lavar todos los platos y cubiertos', 'daily', 3, 'utensils', true),
    (v_home_id, v_zone_kitchen, 'Limpiar mesón', 'Limpiar y desinfectar el mesón', 'daily', 2, 'sparkles', true),
    (v_home_id, v_zone_kitchen, 'Sacar basura', 'Sacar la basura y poner bolsa nueva', 'daily', 1, 'trash', true),
    (v_home_id, v_zone_bathroom, 'Limpiar baño', 'Limpiar sanitario, lavamanos y ducha', 'weekly', 5, 'sparkles', true)
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'Tareas creadas';
  
  -- Obtener IDs de las tareas recién creadas
  SELECT id INTO v_task1 FROM tasks WHERE home_id = v_home_id AND title = 'Lavar platos' LIMIT 1;
  SELECT id INTO v_task2 FROM tasks WHERE home_id = v_home_id AND title = 'Limpiar mesón' LIMIT 1;
  SELECT id INTO v_task3 FROM tasks WHERE home_id = v_home_id AND title = 'Sacar basura' LIMIT 1;
  
  -- Asignar tareas para HOY
  IF v_task1 IS NOT NULL THEN
    INSERT INTO task_assignments (task_id, member_id, assigned_date, due_date, status)
    VALUES (v_task1, v_member_id, CURRENT_DATE, CURRENT_DATE + 1, 'pending')
    ON CONFLICT DO NOTHING;
    RAISE NOTICE 'Asignada: Lavar platos';
  END IF;
  
  IF v_task2 IS NOT NULL THEN
    INSERT INTO task_assignments (task_id, member_id, assigned_date, due_date, status)
    VALUES (v_task2, v_member_id, CURRENT_DATE, CURRENT_DATE + 1, 'pending')
    ON CONFLICT DO NOTHING;
    RAISE NOTICE 'Asignada: Limpiar mesón';
  END IF;
  
  IF v_task3 IS NOT NULL THEN
    INSERT INTO task_assignments (task_id, member_id, assigned_date, due_date, status)
    VALUES (v_task3, v_member_id, CURRENT_DATE, CURRENT_DATE + 1, 'pending')
    ON CONFLICT DO NOTHING;
    RAISE NOTICE 'Asignada: Sacar basura';
  END IF;
  
  RAISE NOTICE '✅ Configuración completada exitosamente!';
  RAISE NOTICE 'Recarga la aplicación para ver las tareas.';
END $$;

-- Verificar resultados
SELECT 
  t.title as tarea,
  t.frequency as frecuencia,
  t.effort_points as puntos,
  z.name as zona,
  ta.status as estado,
  ta.assigned_date as asignada
FROM task_assignments ta
JOIN tasks t ON t.id = ta.task_id
LEFT JOIN zones z ON z.id = t.zone_id
JOIN home_members hm ON hm.id = ta.member_id
WHERE hm.status = 'active'
AND ta.assigned_date >= CURRENT_DATE - 1
ORDER BY ta.assigned_date DESC, t.title;
