# Instalación y Configuración

Guía completa para configurar el proyecto localmente.

## Requisitos Previos

- Node.js 18+ y npm
- Cuenta en Supabase
- Git

## Pasos de Instalación

### 1. Clonar el Repositorio

```bash
git clone https://github.com/Yenreh/ProjectCleanQuestApp.git
cd CleanQuestApp
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Supabase

#### 3.1 Crear Proyecto

1. Accede a [Supabase](https://app.supabase.com/)
2. Crea un nuevo proyecto
3. Espera a que la base de datos se inicialice

#### 3.2 Obtener Credenciales

En tu proyecto de Supabase:
1. Ve a `Settings` → `API`
2. Copia los siguientes valores:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: Token público para autenticación

#### 3.3 Ejecutar Scripts SQL

En el SQL Editor de Supabase, ejecuta los scripts en orden:

1. `scripts/01-create-tables.sql` - Crea tablas de la base de datos
2. `scripts/02-seed-data.sql` - Datos iniciales para desarrollo
3. `scripts/03-functions.sql` - Funciones y triggers de PostgreSQL

Para resetear la base de datos, ejecuta `scripts/05-reset-database.sql`

### 4. Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

Usa `.env.example` como referencia.

### 5. Iniciar Servidor de Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## Verificación

Para verificar que todo funciona correctamente:

1. Abre `http://localhost:5173`
2. Registra un nuevo usuario
3. Crea un hogar de prueba
4. Verifica que puedes crear tareas

## Solución de Problemas

### Error de Conexión a Supabase

- Verifica que las variables de entorno estén correctamente configuradas
- Confirma que el proyecto de Supabase esté activo
- Revisa que los scripts SQL se ejecutaron sin errores

### Error al Instalar Dependencias

```bash
# Limpiar caché de npm
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Puerto 5173 en Uso

Vite automáticamente asignará otro puerto. O especifica uno:

```bash
npm run dev -- --port 3000
```

## Próximos Pasos

- Lee la [Estructura del Proyecto](STRUCTURE.md)
- Consulta la [Guía de Desarrollo](DEVELOPMENT.md)
