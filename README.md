# CleanQuest App

## Descripción

CleanQuest es una aplicación de gamificación para la gestión colaborativa de tareas del hogar. Utiliza Supabase como backend y está optimizada para despliegue en Vercel.

## Configuración Inicial

### 1. Configurar Supabase

1. Crea un proyecto en [Supabase](https://app.supabase.com/)
2. Ve a `Settings` → `API` y copia:
   - `Project URL` (VITE_SUPABASE_URL)
   - `anon/public key` (VITE_SUPABASE_ANON_KEY)

### 2. Ejecutar Scripts SQL

En el SQL Editor de Supabase, ejecuta los siguientes scripts en orden:

1. **`scripts/01-create-tables.sql`** - Crea todas las tablas y políticas RLS
2. **`scripts/02-seed-data.sql`** - Inserta datos iniciales (insignias)
3. **`scripts/03-functions.sql`** - Crea funciones SQL y triggers

### 3. Configurar Variables de Entorno

Copia el archivo `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales de Supabase:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

### 4. Instalar Dependencias

```bash
npm install
```

### 5. Ejecutar en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## Despliegue en Vercel

### Desde el Dashboard de Vercel

1. Visita [vercel.com](https://vercel.com) e inicia sesión
2. Click en "Add New Project"
3. Importa tu repositorio de GitHub
4. Configura las variables de entorno:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click en "Deploy"

## Estructura del Proyecto

```
CleanQuestApp/
├── scripts/              # Scripts SQL para Supabase
│   ├── 01-create-tables.sql
│   ├── 02-seed-data.sql
│   └── 03-functions.sql
├── src/
│   ├── components/       # Componentes de React
│   │   ├── ui/          # Componentes de UI reutilizables
│   │   ├── OnboardingWizard.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── ProgressPanel.tsx
│   │   ├── ChallengesView.tsx
│   │   └── HarmonyRoom.tsx
│   ├── lib/             # Lógica de negocio
│   │   ├── db.ts        # Cliente de Supabase y queries
│   │   └── types.ts     # Tipos TypeScript
│   ├── App.tsx          # Componente principal
│   └── main.tsx         # Punto de entrada
├── .env.example         # Plantilla de variables de entorno
├── package.json
├── vite.config.ts
└── README.md
```

## Historias de Usuario Implementadas

### Flujo de Onboarding
- Registro mínimo: Email/SSO con Supabase Auth
- Crear casa: Nombre, zonas, integrantes, recordatorios
- Invitar roomies: Por correo con token de invitación
- Agregar tareas: Desde plantillas o personalizadas
- Primera tarea guiada: Tutorial paso a paso

### Gestión de Tareas
- Asignación con rotación: Rotación automática semanal/personalizada
- Marcar y evidenciar: Completar tareas con evidencia opcional
- Progreso personal y del hogar: Métricas en tiempo real
- Intercambiar/pedir ayuda: Sistema de solicitudes de intercambio

### Gamificación
- Puntos: Por acciones clave (completar tareas, colaborar)
- Insignias: Logros individuales, de equipo y del hogar
- Tablero colaborativo: Vista semanal sin ranking competitivo
- Reto del hogar: Desafíos semanales para el equipo

### Funcionalidades Avanzadas
- Recordatorios: Configurables por hogar
- Laboratorio de mejora: Propuestas y votación (nivel visionary)
- Sistema de maestría: 5 niveles (novice → visionary)
- Acuerdos del hogar: Políticas y reglas personalizadas

## Seguridad

### Row Level Security (RLS)

Todas las tablas tienen políticas RLS habilitadas:
- Los usuarios solo pueden ver datos de sus hogares
- Los propietarios pueden modificar configuraciones
- Los miembros pueden completar sus propias tareas

### Autenticación

- Supabase Auth maneja la autenticación
- Tokens JWT seguros
- Soporte para email/password y SSO

## Pruebas Locales

Para probar la aplicación sin configurar Supabase:

1. La aplicación detectará automáticamente si no hay credenciales configuradas
2. Mostrará una advertencia en consola: "Using mock data mode"
3. Usará datos de demostración en lugar de la base de datos real

## Base de Datos

### Tablas Principales

- **profiles**: Perfiles de usuario extendiendo auth.users
- **homes**: Hogares/casas
- **zones**: Zonas del hogar (cocina, baño, etc.)
- **home_members**: Miembros de cada hogar
- **tasks**: Tareas del hogar
- **task_assignments**: Asignaciones de tareas a miembros
- **task_completions**: Registros de completitud
- **challenges**: Desafíos grupales y personales
- **achievements**: Insignias disponibles
- **member_achievements**: Insignias desbloqueadas
- **improvement_proposals**: Propuestas de mejora (visionary)
- **change_log**: Historial de cambios

## Desarrollo

### Comandos Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build para producción
npm run preview      # Preview del build
```

### Agregar Nuevas Funcionalidades

1. Define los tipos en `src/lib/types.ts`
2. Agrega queries en `src/lib/db.ts`
3. Actualiza el schema SQL si es necesario
4. Crea o actualiza componentes
5. Prueba localmente con `npm run dev`

## Solución de Problemas

### Error: "Supabase not configured"

- Verifica que `.env.local` existe y contiene las credenciales correctas
- Reinicia el servidor de desarrollo: `npm run dev`

### Error de RLS: "Row level security policy violation"

- Asegúrate de estar autenticado
- Verifica que las políticas RLS estén correctamente configuradas en Supabase

### Build falla en Vercel

- Verifica que las variables de entorno estén configuradas en Vercel
- Revisa los logs de build en el dashboard de Vercel

## Notas Adicionales

- La aplicación usa Vite como bundler
- Los componentes UI están basados en shadcn/ui
- El sistema de colores sigue una paleta armoniosa definida
- Todos los datos sensibles usan variables de entorno

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto es parte de un trabajo universitario de gamificación.
