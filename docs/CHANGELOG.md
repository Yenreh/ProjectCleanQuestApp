# Changelog

Historial de cambios del proyecto basado en commits.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

## [0.8.5] - 2025-11-27

### Changed
- App Icon in onboarding view

## [0.8.5] - 2025-11-27

### Changed
- App Icon, added custom icon to app and loading screens

## [0.8.4] - 2025-11-25

### Fixed

- Corregido parpadeo de pantalla de onboarding al recargar la página mediante estado de carga intermedio
- Solucionada condición de carrera en la verificación de datos de usuario

## [0.8.2] - 2025-11-25

### Added

- Sistema de auto-gestión de ciclos de rotación
- Función `checkAndStartNewCycleIfNeeded()` para iniciar ciclos automáticamente
- Función `getWeeklyCompletionPercentage()` para estadísticas precisas de completitud semanal
- Nuevos estados de asignación: `skipped_expired`, `skipped_cancelled`, `skipped_reassigned`

### Changed

- Rediseñado sistema de salto/cancelación de tareas usando solo campo `status`
- Mejorado cálculo de métricas para excluir tareas canceladas/reasignadas pero incluir expiradas
- Actualizado filtrado de tareas en `getHomeMetrics()` y `getZoneStatus()`
- Reemplazado uso incorrecto de `calculateRotationPercentage()` por nueva función de completitud
- Vista de Progreso ahora muestra porcentajes correctos de completitud semanal histórica

### Fixed

- Corregido problema de zonas mostrando "sin datos" cuando tenían tareas asignadas
- Solucionado cálculo de ciclos usando solo `cycleStart` (ahora usa también `cycleEnd`)
- Eliminado problema de tareas expiradas apareciendo en lista de tareas disponibles
- Corregido trending semanal mostrando 0% para semanas con tareas completadas

### Removed

- Eliminado campo `skip_reason` (consolidado en `status`)
- Eliminado script de migración `06-add-skip-reason.sql`
- Removidos console.log de debug en producción

## [0.8.1] - 2025-11-24

### Changed

- Revisado y mejorado CHANGELOG con información precisa del historial de commits
- Documentada correctamente la migración masiva a Zustand (v0.6.x)
- Agregados detalles de refactorización de estado global y eliminación de props drilling

## [0.8.0] - 2025-11-24

### Added

- Documentación estructurada en carpeta `docs/`
- Guía de instalación y configuración (SETUP.md)
- Documentación de estructura del proyecto (STRUCTURE.md)
- Guía de despliegue en Vercel (DEPLOYMENT.md)
- Archivo LICENSE con MIT License
- Versión visible en pantalla de login con ícono de GitHub

### Changed

- Reestructurado README principal con enlaces a documentación modular
- Actualizado nombre de la app a lowercase en configuración
- Mejorada organización de documentación

### Fixed

- Reemplazado ícono GitHub deprecado por SVG personalizado
- Corregido flujo de versionado automático

## [0.7.1] - 2025-11-23

### Changed

- Sincronizado package.json con nueva versión
- Actualizado nombre de aplicación a lowercase

## [0.7.0] - 2025-11-22

### Added

- Sistema de versionado automático con GitHub Actions
- Workflow para crear releases desde version.json
- Documentación de sistema de versionado (VERSIONING.md)

### Changed

- Removidos workflows obsoletos de version bump
- Actualizada estructura del proyecto en README

### Fixed

- Corregida estructura de código para mejor legibilidad

## [0.6.x] - 2025-11-20

### Added

- **Migración completa a Zustand para gestión de estado global**
  - `notificationStore`: Gestión de notificaciones de usuario e invitaciones
  - `onboardingStore`: Control del proceso de onboarding completo
  - `uiStore`: Gestión de estados UI y visibilidad de diálogos
  - `unifiedSettingsStore`: Configuración de hogar y preferencias de usuario
  - `authStore`: Estado de autenticación y sesión
  - `homeStore`: Información del hogar actual
  - `assignmentsStore`: Gestión de tareas y asignaciones (389 líneas)
  - `challengesStore`: Control de desafíos (185 líneas)
  - `homeManagementStore`: Administración de hogares (416 líneas)
  - `invitationStore`: Sistema de invitaciones (285 líneas)
  - `masteryStore`: Cálculo de maestría
  - `membersStore`: Gestión de miembros (379 líneas)
  - `achievementsStore`: Sistema de logros
- Sistema de notificaciones con manejo de invitaciones
- Funcionalidad de invitaciones activas con cancelación
- Generación y compartición de enlaces de invitación
- Gestión optimista de actualizaciones con rollback
- Componentes modulares de gestión de hogar (tabs separados)

### Changed

- **Refactorización masiva de App.tsx** (reducido de ~3276 a ~456 líneas)
- Separados diálogos de gestión de hogar en módulos (HomeConfigTab, MembersManagementTab, TasksManagementTab, ZonesManagementTab)
- Simplificado OnboardingView (de ~703 a componentes modulares)
- Optimizado HomeView (de ~429 líneas con mejor separación de responsabilidades)
- Mejorado manejo de invitaciones y reasignación de tareas
- Actualizado UI del paso de roommates con skip condicional
- Refactorizados todos los componentes UI para mejor type safety
- Mejorada configuración de TypeScript (tsconfig.json)

### Removed

- Estado local disperso en componentes individuales
- Props drilling innecesario
- Lógica duplicada de gestión de estado
- Componente AchievementsSection redundante

## [0.5.x] - 2025-11-18

### Added

- Tabla zone_presets para onboarding
- Cálculo mejorado de nivel de maestría con scoring híbrido
- Diálogo de siguiente ciclo y estadísticas
- Componentes de configuración de perfil y vista de progreso
- Sistema de logros con completación de onboarding
- Funcionalidad de tareas favoritas con operaciones CRUD

### Changed

- Optimizada carga de datos en onboarding y vistas de progreso
- Mejoradas notificaciones toast con mejor apilamiento y visibilidad
- Ajustados requisitos de progresión de nivel para mejor balance
- Inicializadas zonas seleccionadas con primeros tres presets
- Ajustado cálculo de weeksActive para contar solo semanas completadas
- Mejorado manejo de completación de pasos de tareas

### Fixed

- Agregado botón de cerrar a diálogos de siguiente ciclo y estadísticas
- Mejorados layouts de diálogos disponibles y gestión de hogar

## [0.4.x] - 2025-11-15

### Added

- Estado de carga y spinner para creación de tareas
- Formato de fecha con locale colombiano
- Badge de nivel de maestría condicional basado en modo desarrollo
- Función updateAssignmentProgress para actualizaciones locales
- Función uncompleteTaskStep con feedback UI mejorado
- Configuración vercel.json para rewrites de rutas

### Changed

- Actualizado manejo de asignación de tareas con tracking de pasos
- Mejorado manejo de tareas en HomeScreen con diálogo para pendientes
- Actualizado HomeScreen y ProgressPanel para usar full_name
- Mejorada lógica de creación de tareas con zonas dinámicas

## [0.3.x] - 2025-11-12

### Added

- Favicon.svg y branding mejorado
- Declaración TypeScript para módulos CSS
- Componente InputWithIcon para funcionalidad mejorada
- Templates de tareas y scripts de seeding
- Script de setup de usuario de prueba con datos completos

### Changed

- Actualizado nombre del proyecto a CleanQuest
- Mensajes toast para funcionalidades próximas
- Variables de entorno Supabase opcionales
- Mejorado ProgressPanel con carga y display de datos
- Simplificada UI de ProgressPanel

## [0.2.x] - 2025-11-10

### Added

- Sistema de autenticación completo
- Cliente de base de datos y servicio de maestría
- Schema de base de datos y tipos TypeScript
- Integración con Supabase
- Selector de nivel de maestría
- Variables CSS para mejor styling y responsividad

### Changed

- Refactorizado componente Button con forwardRef
- Actualizada visibilidad de desafíos basada en niveles de maestría

### Removed

- Directorio src/components/figma
- Directorio src/guidelines
- Archivo src/Attributions.md

## [0.1.0] - 2025-11-05

### Added

- Inicialización de aplicación React con Vite
- Estilos globales y soporte de temas
- Estructura base del proyecto
- Configuración de TypeScript
- README inicial

---

## Tipos de Cambios

- **Added**: Nuevas funcionalidades
- **Changed**: Cambios en funcionalidades existentes
- **Fixed**: Corrección de bugs
- **Removed**: Funcionalidades removidas
