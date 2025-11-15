# Scripts SQL de CleanQuest

Este directorio contiene los scripts SQL necesarios para configurar y mantener la base de datos de CleanQuest.

## Orden de Ejecución (Primera Instalación)

Para configurar la base de datos desde cero, ejecuta los scripts en este orden:

1. **`01-create-tables.sql`** - Crea todas las tablas del sistema
   - Incluye columnas de preferencias en `home_members`
   - Incluye tabla `task_cancellations` para el sistema de cancelación
   - Incluye índices optimizados para reminders, favoritos y cancelaciones
   - Todas las tablas con estructura completa

2. **`02-seed-data.sql`** - Carga datos semilla
   - Logros predefinidos
   - Zonas comunes del hogar
   - Templates de tareas recomendadas

3. **`03-functions.sql`** - Crea funciones y triggers mínimos
   - Trigger para crear perfil automático al registrarse
   - **NOTA**: Toda la lógica de negocio se maneja en `src/lib/db.ts`

## Scripts de Desarrollo

### `05-reset-database.sql`
**⚠️ ADVERTENCIA**: Elimina TODAS las tablas excepto `profiles`.

Útil cuando necesitas recrear el schema desde cero durante desarrollo. Después de ejecutarlo, debes volver a ejecutar los scripts 01, 02 y 03.

**NO ejecutar en producción**.

## Arquitectura de Datos

### Lógica de Negocio
- ✅ Toda la lógica de negocio se maneja en TypeScript (`src/lib/db.ts`)
- ✅ Las funciones RPC son mínimas (solo triggers y casos especiales)
- ✅ Las actualizaciones, validaciones y cálculos se hacen desde la aplicación

### Nuevas Características

#### Preferencias de Usuario (en `home_members`)
- `email_notifications` - Notificaciones por email
- `push_notifications` - Notificaciones push
- `weekly_reports` - Reportes semanales
- `theme` - Tema de interfaz (light/dark/system)
- `font_size` - Tamaño de fuente (small/medium/large)
- `reminder_enabled` - Activar/desactivar recordatorios
- `reminder_time` - Hora del recordatorio diario
- `reminder_days` - Días de la semana para recordatorios

#### Sistema de Cancelación de Tareas
- Los miembros con nivel Solucionador+ pueden cancelar tareas asignadas
- Las tareas canceladas quedan disponibles para que otros las tomen
- Rastreo de quién canceló y cuándo
- Cleanup automático de tareas canceladas antiguas

#### Favoritos de Tareas
- Los usuarios pueden marcar tareas como favoritas
- Acceso rápido a tareas frecuentes

## Migraciones

**No usamos migraciones** en este proyecto. Cuando hay cambios en el schema:

1. Se actualizan directamente en `01-create-tables.sql`
2. En desarrollo: ejecutar `05-reset-database.sql` y luego recrear
3. En producción: se crea el schema completo desde cero

Esta estrategia es apropiada para proyectos en fase temprana donde el schema aún está en evolución.

## Supabase

Estos scripts deben ejecutarse en el SQL Editor de Supabase en el orden indicado. Asegúrate de tener permisos adecuados en la base de datos.

Para conectar Supabase:
1. Crea un proyecto en https://supabase.com
2. Copia las credenciales (URL y Anon Key)
3. Configura las variables de entorno en `.env`:
   ```
   VITE_SUPABASE_URL=tu_url
   VITE_SUPABASE_ANON_KEY=tu_key
   ```
4. Ejecuta los scripts en el SQL Editor de Supabase
