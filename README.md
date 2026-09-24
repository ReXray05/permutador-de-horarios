# Planificador semanal · v27

Versión aprobada del planificador: `index.html` es autónomo e incluye sus estilos, lógica e imágenes. Los módulos anteriores se conservan en el historial y en el repositorio, pero esta página ya no los carga.

- Horario semanal editable, selección, duración, LAB, marcos, filtros y deshacer.
- 22 asignaturas de tercero, cuarto e Italia; creación de asignaturas y grupos plegables.
- Varios horarios con importación y exportación JSON.
- Seis skins, textos temáticos y exportaciones con la skin activa.
- 32 preguntas de cultura general: 25 monedas por acierto, una recompensa por pregunta y bloqueo hasta el siguiente día local tras fallar.
- Ajustes de apariencia y códigos de prueba: `retitos` (saldo infinito), `rosita` (apariencia rosa para Clásica), `borrar` (reinicio con confirmación).

Los datos se guardan en el navegador, sin servidor ni cuenta. Las monedas son ficticias. Los códigos son utilidades locales de prueba, no secretos ni controles de seguridad. Exporta tus horarios a JSON para conservar copias.

## Publicación

GitHub Actions publica la rama `main` en https://rexray05.github.io/permutador-de-horarios/.

`service-worker.js` actualiza la caché de instalaciones anteriores y da prioridad a la red. El archivo autónomo puede abrirse directamente o servirse con cualquier servidor estático.
