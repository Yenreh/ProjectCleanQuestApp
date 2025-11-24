# CleanQuest

Aplicación web de gamificación para gestión colaborativa de tareas del hogar.

## Descripción

Sistema multiusuario completo con autenticación, gestión de tareas, sistema de puntos y progresión, desafíos colaborativos y notificaciones en tiempo real. Diseñado para hacer más eficiente y motivador el mantenimiento del hogar compartido.

## Características Principales

- **Gestión de Hogares**: Crea y administra hogares compartidos con múltiples miembros
- **Sistema de Tareas**: Asignación, programación y seguimiento de tareas domésticas
- **Gamificación**: Puntos de experiencia, niveles, maestría y desafíos
- **Notificaciones**: Sistema de alertas en tiempo real para eventos importantes
- **Estadísticas**: Visualización del progreso individual y del hogar
- **Multiplataforma**: Responsive design para escritorio y móvil

## Stack Tecnológico

- **Frontend**: React 18, TypeScript, Vite
- **UI**: Tailwind CSS, shadcn/ui, Lucide Icons
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Estado**: Zustand
- **Deploy**: Vercel

## Inicio Rápido

```bash
# Clonar repositorio
git clone https://github.com/Yenreh/ProjectCleanQuestApp.git
cd CleanQuestApp

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Iniciar servidor de desarrollo
npm run dev
```

Visita `http://localhost:5173`

## Documentación

- [Instalación y Configuración](docs/SETUP.md)
- [Estructura del Proyecto](docs/STRUCTURE.md)
- [Despliegue en Vercel](docs/DEPLOYMENT.md)
- [Sistema de Versionado](VERSIONING.md)
- [Historial de Cambios](docs/CHANGELOG.md)

## Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build para producción
npm run preview      # Preview del build
```

## Licencia

[MIT License](LICENSE) - Código abierto para uso libre

## Soporte

Para reportar bugs o solicitar características, abre un [issue](https://github.com/Yenreh/ProjectCleanQuestApp/issues).

## Versión

v0.8.0 - Ver [CHANGELOG](docs/CHANGELOG.md) para historial de cambios

---

Desarrollado como proyecto académico para la Universidad

