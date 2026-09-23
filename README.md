# Planificador universitario

PWA estática y local-first para organizar horario semanal, calendario mensual, misiones y skins.

## Arquitectura v20

La aplicación se reescribió para eliminar parches e inyecciones dinámicas. El HTML carga un único punto de entrada ES Module (`src/main.js`) y cada responsabilidad vive en su propio módulo:

- `src/config.js`: asignaturas, horario base, skins y preguntas.
- `src/storage.js`: persistencia, migración y copias de seguridad.
- `src/ui.js`: temas, skins, textos y utilidades de interfaz.
- `src/weekly.js`: horario semanal, edición, filtros y exportación.
- `src/month.js`: calendario mensual, eventos e ICS.
- `src/game.js`: monedas, tienda, skins y misiones.
- `src/main.js`: arranque, navegación, ajustes y PWA.
- `styles.css` + `src/mobile.css`: estilos base y adaptación móvil.

No hay backend, cuentas ni base de datos. Los datos siguen guardándose en `localStorage`, conservando las claves usadas por versiones anteriores.

## PWA

`service-worker.js` usa una caché simple con prioridad de red para evitar quedarse atascado en versiones antiguas. No modifica JavaScript ni inyecta módulos en tiempo de ejecución.

## Desarrollo local

```bash
python -m http.server 8080
```

Abre `http://localhost:8080`.
