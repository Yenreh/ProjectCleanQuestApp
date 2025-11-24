# Despliegue

Guía para desplegar la aplicación en Vercel.

## Despliegue en Vercel

### Configuración Inicial

1. **Conectar Repositorio**
   - Ve a [vercel.com](https://vercel.com)
   - Click en "Add New" → "Project"
   - Importa tu repositorio de GitHub

2. **Variables de Entorno**
   
   En Settings → Environment Variables:
   
   ```
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key
   ```

3. **Deploy**
   - Vercel detecta automáticamente Vite
   - Click en "Deploy"
   - Espera a que termine el build

### Deploys Automáticos

Cada push a `main` despliega automáticamente en producción.

### Preview Deployments

Cada Pull Request genera una preview URL para testing.

## Configuración de Producción

### Supabase

1. **Row Level Security (RLS)**
   - Verifica que todas las tablas tengan políticas RLS habilitadas
   - Las políticas están en `scripts/01-create-tables.sql`

2. **Rate Limiting**
   - Configura límites en Supabase Dashboard
   - Settings → API → Rate Limiting

3. **Backups**
   - Habilita backups automáticos en Settings → Database

### Dominio Personalizado

1. Settings → Domains en Vercel
2. Agrega tu dominio
3. Configura DNS según instrucciones:
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   ```

### HTTPS

Vercel incluye SSL automático con Let's Encrypt.

## Monitoreo

### Logs

Dashboard → Deployment → Logs para ver logs en tiempo real.

### Supabase Logs

Dashboard → Database → Logs para queries y errores.

## Rollback

Dashboard → Deployments → Click en deployment anterior → "Promote to Production"

## Checklist Pre-Deploy

- [ ] Build local exitoso (`npm run build`)
- [ ] Variables de entorno configuradas
- [ ] Base de datos Supabase en producción
- [ ] RLS policies habilitadas
- [ ] Pruebas de funcionalidad completas
- [ ] Sin errores en consola
- [ ] Responsive design verificado

## Mantenimiento

### Updates de Dependencias

```bash
npm outdated    # Verificar updates
npm update      # Actualizar
npm run build   # Test build
```

### Updates de Supabase

Monitorea [Supabase Changelog](https://supabase.com/changelog) para breaking changes y mejoras de seguridad.

