# Sistema de Versionado

Este proyecto utiliza un sistema de versionado automático basado en GitHub Actions.

## Archivos de Versión

- `version.json`: Contiene la versión actual de la aplicación
- `package.json`: Se sincroniza automáticamente con `version.json`

## Workflows de GitHub Actions

### 1. Versionado Manual (`version-bump.yml`)

Permite incrementar la versión manualmente desde GitHub Actions.

**Uso:**
1. Ve a la pestaña "Actions" en GitHub
2. Selecciona "Version Bump"
3. Haz clic en "Run workflow"
4. Selecciona el tipo de incremento:
   - **patch**: 0.1.0 → 0.1.1 (correcciones de bugs)
   - **minor**: 0.1.0 → 0.2.0 (nuevas características)
   - **major**: 0.1.0 → 1.0.0 (cambios que rompen compatibilidad)

**Acciones:**
- Actualiza `version.json` y `package.json`
- Crea un commit con el mensaje: `chore: bump version to X.X.X`
- Crea un tag de Git: `vX.X.X`
- Crea un release en GitHub

### 2. Versionado Automático (`auto-version.yml`)

Se ejecuta automáticamente cuando se hace push a `main` (excepto cambios en archivos de versión).

**Reglas de incremento basadas en commits:**
- **major**: Commits con `BREAKING CHANGE:` o `feat!:`, `fix!:`, `chore!:`
- **minor**: Commits con `feat:` o `feat(scope):`
- **patch**: Cualquier otro commit

**Ejemplos de commits:**
```bash
git commit -m "fix: corregir error en login"           # patch: 0.1.0 → 0.1.1
git commit -m "feat: agregar sistema de notificaciones" # minor: 0.1.0 → 0.2.0
git commit -m "feat!: rediseñar API completa"          # major: 0.1.0 → 1.0.0
```

**Acciones:**
- Analiza los mensajes de commit
- Determina el tipo de incremento
- Actualiza versiones automáticamente
- Crea tag de Git
- Evita loops infinitos con `[skip ci]`

## Formato de Commits (Conventional Commits)

Se recomienda seguir el formato:

```
<tipo>(<alcance>): <descripción>

[cuerpo opcional]

[notas al pie opcionales]
```

**Tipos comunes:**
- `feat`: Nueva característica
- `fix`: Corrección de bug
- `docs`: Cambios en documentación
- `style`: Cambios de formato (no afectan el código)
- `refactor`: Refactorización de código
- `test`: Agregar o modificar tests
- `chore`: Tareas de mantenimiento

## Uso en la Aplicación

La versión se muestra automáticamente en:
- Pantalla de login (esquina inferior)
- Se lee desde `version.json` en tiempo de compilación

## Actualización Manual

Si necesitas actualizar la versión manualmente:

```bash
# Editar version.json
echo '{"version": "0.2.0"}' > version.json

# Actualizar package.json
npm version 0.2.0 --no-git-tag-version

# Commit
git add version.json package.json
git commit -m "chore: bump version to 0.2.0"
git push
```

## Notas

- Los workflows requieren permisos de escritura en el repositorio
- El token `GITHUB_TOKEN` se proporciona automáticamente
- Los cambios en archivos de versión no disparan el auto-versionado
- Se ignoran cambios en workflows, README y otros archivos de configuración
