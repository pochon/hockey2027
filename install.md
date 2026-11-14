# Publicar Hockey Santa Fe 2027

## 1. Subir el proyecto a GitHub

El repositorio del proyecto es [pochon/hockey2027](https://github.com/pochon/hockey2027). La rama principal es `main`.

Para publicar cambios posteriores desde la carpeta del proyecto:

```powershell
git add .
git commit -m "Describe el cambio"
git push origin main
```

## 2. Desplegar en Netlify

1. Abrí [Netlify: importar un repositorio](https://app.netlify.com/start/repos) e iniciá sesión.
2. Elegí **GitHub** y autorizá a Netlify para acceder al repositorio `pochon/hockey2027`.
3. Seleccioná la rama `main`.
4. En la configuración de compilación, dejá vacío **Build command** y usá `.` como **Publish directory**. El sitio es estático y no requiere un paso de compilación.
5. Elegí **Deploy site**. Netlify publicará el sitio y asignará una URL `*.netlify.app`.

Después de conectar el repositorio, cada `git push` a `main` iniciará un nuevo despliegue automáticamente.
