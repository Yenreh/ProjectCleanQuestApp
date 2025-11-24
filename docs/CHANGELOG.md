# Changelog

Todos los cambios notables del proyecto serán documentados aquí.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [0.8.0] - 2025-11-24

### Added
- Sistema de versionado automático con GitHub Actions
- Versión visible en pantalla de login
- Enlace a repositorio GitHub en login
- Documentación estructurada en carpeta `docs/`
- Guía de contribución

### Changed
- Reestructurado README principal
- Mejorada organización de documentación
- Actualizado `.gitignore` para incluir `package-lock.json`

### Fixed
- Reemplazado ícono GitHub deprecado por SVG personalizado
- Corregido workflow de versionado

## [0.7.0] - 2025-11-22

### Added
- Sistema de notificaciones en tiempo real
- Hook `useNotifications` para gestión de alertas
- Vista de notificaciones con filtros y marcado como leído

### Changed
- Mejorada UI de notificaciones
- Optimizado rendimiento de queries a Supabase

## [0.6.0] - 2025-11-20

### Added
- Sistema de maestría para tareas
- Cálculo de nivel de experiencia por tipo de tarea
- Vista de progreso individual
- Indicadores visuales de maestría

### Changed
- Refactorizado `masteryService.ts`
- Mejorado sistema de puntos

## [0.5.0] - 2025-11-18

### Added
- Vista de onboarding para nuevos usuarios
- Pasos guiados para crear hogar y agregar tareas
- Invitaciones para unirse a hogares existentes

### Changed
- Mejorada experiencia de primer uso
- Simplificado flujo de registro

## [0.4.0] - 2025-11-15

### Added
- Sistema de desafíos colaborativos
- Vista de desafíos activos y completados
- Recompensas por completar desafíos

### Fixed
- Corregido cálculo de puntos en desafíos de equipo

## [0.3.0] - 2025-11-12

### Added
- Gestión de hogares múltiples
- Cambio entre hogares activos
- Administración de miembros del hogar

### Changed
- Reestructurado store de hogares
- Mejorada navegación

## [0.2.0] - 2025-11-08

### Added
- Sistema de tareas con asignación
- Completar y verificar tareas
- Historial de tareas completadas
- Vista de estadísticas básicas

### Changed
- Refactorizado sistema de puntos
- Mejorada UI de tarjetas de tareas

## [0.1.0] - 2025-11-05

### Added
- Autenticación con Supabase
- Registro y login de usuarios
- Vista principal de hogar
- Estructura base del proyecto
- Configuración de Vite + React + TypeScript
- Integración de Tailwind CSS y shadcn/ui
- Scripts SQL para base de datos

---

## Categorías de Cambios

- **Added**: Nuevas funcionalidades
- **Changed**: Cambios en funcionalidades existentes
- **Deprecated**: Funcionalidades que serán removidas
- **Removed**: Funcionalidades removidas
- **Fixed**: Corrección de bugs
- **Security**: Mejoras de seguridad
