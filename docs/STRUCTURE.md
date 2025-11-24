# Estructura del Proyecto

Descripción detallada de la organización del código.

## Árbol de Directorios

```
CleanQuestApp/
├── .github/
│   └── workflows/              # GitHub Actions (CI/CD, versionado)
├── docs/                       # Documentación del proyecto
├── public/                     # Assets estáticos
├── scripts/                    # Scripts SQL para Supabase
│   ├── 01-create-tables.sql
│   ├── 02-seed-data.sql
│   ├── 03-functions.sql
│   └── 05-reset-database.sql
├── src/
│   ├── components/
│   │   ├── dialogs/            # Modales y diálogos
│   │   │   ├── home-management/    # Gestión de hogares
│   │   │   ├── AvailableTasksDialog.tsx
│   │   │   ├── CompleteTaskDialog.tsx
│   │   │   ├── StatisticsDialog.tsx
│   │   │   └── ...
│   │   ├── panels/             # Vistas principales
│   │   │   ├── AuthView.tsx
│   │   │   ├── HomeView.tsx
│   │   │   ├── OnboardingView.tsx
│   │   │   └── ...
│   │   ├── sections/           # Componentes de onboarding
│   │   └── ui/                 # Componentes base (shadcn/ui)
│   ├── hooks/                  # Custom React hooks
│   │   └── useNotifications.ts
│   ├── lib/                    # Lógica de negocio y utilidades
│   │   ├── db.ts               # Cliente Supabase
│   │   ├── types.ts            # Definiciones TypeScript
│   │   ├── notifications.ts    # Sistema de notificaciones
│   │   └── masteryService.ts   # Sistema de maestría
│   ├── stores/                 # Estado global (Zustand)
│   │   ├── authStore.ts
│   │   ├── homeStore.ts
│   │   ├── challengesStore.ts
│   │   └── ...
│   ├── styles/                 # Estilos globales
│   │   └── globals.css
│   ├── App.tsx                 # Componente raíz
│   ├── main.tsx                # Punto de entrada
│   └── index.css               # Estilos base
├── .env.example                # Template de variables de entorno
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json               # Configuración TypeScript
├── vercel.json                 # Configuración de Vercel
├── version.json                # Versión de la aplicación
├── vite.config.ts              # Configuración de Vite
└── VERSIONING.md               # Sistema de versionado
```

## Descripción de Módulos

### `/src/components`

Componentes React organizados por función:

- **dialogs/**: Ventanas modales para interacciones complejas
- **panels/**: Vistas principales de la aplicación
- **sections/**: Componentes específicos de flujos (onboarding)
- **ui/**: Componentes reutilizables de la interfaz (shadcn/ui)

### `/src/lib`

Lógica de negocio y servicios:

- **db.ts**: Cliente Supabase, funciones CRUD
- **types.ts**: Definiciones de tipos TypeScript
- **notifications.ts**: Sistema de notificaciones push
- **masteryService.ts**: Cálculo de maestría y progresión

### `/src/stores`

Estado global con Zustand:

- **authStore**: Autenticación y sesión del usuario
- **homeStore**: Información del hogar actual
- **assignmentsStore**: Tareas y asignaciones
- **challengesStore**: Desafíos activos
- **notificationStore**: Gestión de notificaciones
- **uiStore**: Estado de la interfaz (modales, sidebar)

### `/scripts`

Scripts SQL para inicializar Supabase:

1. **01-create-tables.sql**: Schema de base de datos
2. **02-seed-data.sql**: Datos de prueba
3. **03-functions.sql**: Funciones y triggers PostgreSQL
4. **05-reset-database.sql**: Reseteo completo

### `/docs`

Documentación del proyecto separada por temas.

## Flujo de Datos

1. **Usuario interactúa** → Componente
2. **Componente llama** → Store (Zustand)
3. **Store ejecuta** → Servicio (lib/)
4. **Servicio comunica** → Supabase (db.ts)
5. **Respuesta actualiza** → Store → Componente

