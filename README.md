# Planificador semanal

Web estática y PWA. No necesita backend, base de datos, cuentas de usuario ni servidor propio.

## Uso local

Puedes abrir `index.html` directamente en el navegador. La mayor parte de la app funcionará así.

Para probar la instalación PWA y el modo offline necesitas servirla por `http://localhost` o publicarla por HTTPS.

### Servidor local opcional

Con Python:

```bash
python -m http.server 8080
```

Después abre:

```text
http://localhost:8080
```

## Datos

Todo se guarda en `localStorage` del navegador.

- Cada dispositivo tiene sus propios horarios.
- No se envía ningún horario a ningún servidor.
- Puedes crear varios horarios locales.
- Desde Ajustes puedes exportar/importar un horario como JSON.

## Publicarla

El proyecto es completamente estático. Puedes subir esta carpeta tal cual a:

- GitHub Pages
- Cloudflare Pages
- Netlify
- Vercel
- cualquier hosting estático

No hace falta configurar API, base de datos ni variables de entorno.

### GitHub Pages

1. Crea un repositorio.
2. Sube todos los archivos de esta carpeta.
3. En GitHub: Settings → Pages.
4. Selecciona `Deploy from a branch`.
5. Elige la rama `main` y la carpeta `/root`.
6. Guarda.

La URL final tendrá HTTPS, por lo que la PWA podrá instalarse y funcionar offline.

## Instalación como app

Una vez publicada por HTTPS:

- Chrome / Edge en PC: icono de instalar en la barra de direcciones.
- Android: menú → Instalar aplicación / Añadir a pantalla de inicio.
- iPhone/iPad: Compartir → Añadir a pantalla de inicio.

## Estructura

```text
index.html
styles.css
app.js
manifest.webmanifest
service-worker.js
icons/
  icon.svg
```