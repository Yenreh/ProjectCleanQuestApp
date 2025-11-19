# CleanQuest App

Aplicación de gamificación para gestión colaborativa de tareas del hogar. Stack: React + TypeScript + Vite + Supabase.

## Setup del Proyecto

### 1. Configurar Supabase

1. Crea un proyecto en [Supabase](https://app.supabase.com/)
2. En `Settings` → `API`, copia:
   - Project URL
   - anon/public key

### 2. Ejecutar Scripts SQL

En el SQL Editor de Supabase, ejecuta en orden:

1. `scripts/01-create-tables.sql`
2. `scripts/02-seed-data.sql`
3. `scripts/03-functions.sql`

### 3. Variables de Entorno

Crea `.env.local`:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

### 4. Instalación

```bash
npm install
npm run dev
```

## Comandos

```bash
npm run dev          # Desarrollo (localhost:5173)
npm run build        # Build producción
npm run preview      # Preview del build
```

## Despliegue (Vercel)

1. Importa el repositorio en [vercel.com](https://vercel.com)
2. Configura variables de entorno:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy

## Estructura del Proyecto

```
CleanQuestApp/
├── scripts/              # Scripts SQL para Supabase
├── src/
│   ├── components/
│   │   ├── dialogs/              # Modales y diálogos
│   │   │   └── home-management/  # Tabs de gestión del hogar
│   │   ├── panels/               # Vistas principales
│   │   ├── sections/             # Pasos del onboarding
│   │   └── ui/                   # Componentes base (shadcn/ui)
│   ├── hooks/                    # Custom hooks
│   ├── lib/                      # Utilidades y servicios
│   │   ├── db.ts                 # Cliente Supabase
│   │   ├── types.ts              # Tipos TypeScript
│   │   ├── notifications.ts      # Sistema de notificaciones
│   │   └── masteryService.ts     # Lógica de maestría
│   ├── stores/                   # Estado global (Zustand)
│   ├── styles/                   # Estilos globales
│   ├── App.tsx
│   └── main.tsx
├── .env.local
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vercel.json
```

## Stack Técnico

- **Frontend**: React 18 + TypeScript
- **Build**: Vite
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **UI**: Tailwind CSS + shadcn/ui
- **Deploy**: Vercel
