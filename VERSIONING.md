# Sistema de Versionado

Este proyecto utiliza un sistema de versionado manual controlado por `version.json`.

## Archivos de Versión

- `version.json`: Contiene la versión actual de la aplicación (fuente de verdad)
- `package.json`: Se sincroniza automáticamente con `version.json`

## Cómo Actualizar la Versión

### Flujo Manual (Recomendado)

1. **Edita `version.json` manualmente** con la nueva versión:
   ```json
   {
     "version": "1.0.0"
   }
   ```

2. **Haz commit y push**:
   ```bash
   git add version.json
   git commit -m "chore: bump version to 1.0.0"
   git push origin main
   ```

3. **El workflow automático se encarga de**:
   - Sincronizar `package.json` con la nueva versión
   - Crear un tag de Git: `v1.0.0`
   - Crear un release en GitHub con notas automáticas
   - Evitar duplicados (si el tag ya existe, no hace nada)

## Workflow de GitHub Actions

### `release-version.yml` - Release Automático

Se ejecuta cuando detecta cambios en `version.json` en la rama `main`.

**Acciones:**
- Lee la versión desde `version.json`
- Verifica si el tag ya existe (evita duplicados)
- Actualiza `package.json` y `package-lock.json`
- Crea un commit: `chore: sync package.json to vX.X.X [skip ci]`
- Crea un tag de Git: `vX.X.X`
- Crea un release en GitHub con notas generadas automáticamente

## Formato de Versión Semántica

Sigue [Semantic Versioning 2.0.0](https://semver.org/):

```
MAJOR.MINOR.PATCH
```

- **MAJOR**: Cambios incompatibles con versiones anteriores (1.0.0 → 2.0.0)
- **MINOR**: Nuevas características compatibles (1.0.0 → 1.1.0)
- **PATCH**: Correcciones de bugs (1.0.0 → 1.0.1)

### Ejemplos:

- `0.1.0` → `0.1.1`: Corrección de un bug
- `0.1.1` → `0.2.0`: Nueva característica
- `0.9.0` → `1.0.0`: Primera versión estable
- `1.5.2` → `2.0.0`: Cambio que rompe compatibilidad

## Uso en la Aplicación

La versión se muestra automáticamente en:
- Pantalla de login (parte inferior)
- Se lee desde `version.json` en tiempo de compilación

## Recomendaciones de Commits

Aunque el versionado es manual, se recomienda usar Conventional Commits:

```
<tipo>(<alcance>): <descripción>

[cuerpo opcional]
```

**Tipos comunes:**
- `feat`: Nueva característica (sugiere bump minor)
- `fix`: Corrección de bug (sugiere bump patch)
- `chore`: Tareas de mantenimiento
- `docs`: Cambios en documentación
- `refactor`: Refactorización de código
- `test`: Agregar o modificar tests

**Ejemplo completo:**
```bash
# 1. Hacer cambios en el código
git add .
git commit -m "feat: add user profile settings"
git push

# 2. Cuando estés listo para una nueva versión
# Editar version.json: 0.8.0 → 0.9.0
git add version.json
git commit -m "chore: bump version to 0.9.0"
git push

# 3. El workflow automáticamente crea el release
```

## Notas

- Solo actualiza `version.json` cuando quieras crear un nuevo release
- El workflow ignora sus propios commits con `[skip ci]`
- Si el tag ya existe, el workflow no hace nada (seguro contra re-ejecuciones)
- Los releases incluyen notas generadas automáticamente desde los commits
