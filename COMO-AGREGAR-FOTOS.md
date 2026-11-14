# Cómo agregar fotos a la galería

La galería es un **carrusel** que se arma solo con los datos de `data/contenido.json`.
No hay que tocar HTML ni CSS: alcanza con sumar objetos al array `galeria`.
El filtro de cada botón se determina con el campo `grupo`.

## 1. Copiar las fotos originales

Creá una carpeta dentro de `img/` con el nombre del evento o la sede:

```
img/Costanera/A.png
img/Costanera/B.png
```

Se aceptan `.jpg`, `.jpeg`, `.png`, `.webp` y `.bmp`. Se ordenan por nombre de archivo,
así que conviene nombrarlas `01`, `02`, `03`… si el orden importa.

## 2. Optimizarlas con el script

Desde la raíz del proyecto:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools\optimizar-fotos.ps1 `
    -Origen "img\Costanera" -Prefijo "costanera" -Capitulo "Capítulo 1"
```

El script:

- genera la versión grande en `assets/img/eventos/<prefijo>-NN.jpg` (máx. 1600 px de ancho);
- genera la miniatura en `assets/img/eventos/thumbs/<prefijo>-NN.jpg` (640 px);
- imprime por pantalla el JSON listo para pegar.

Parámetros opcionales: `-Destino`, `-Calidad` (85 por defecto), `-AnchoMax`, `-AnchoMiniatura`.

## 3. Pegar el JSON

Abrí `data/contenido.json`, buscá el array `galeria` y pegá los objetos que imprimió el script.
Completá `titulo`, `descripcion` y `alt` (texto alternativo para lectores de pantalla):

```json
{
  "capitulo": "Capítulo 1",
  "grupo": "costanera",
  "titulo": "Práctica abierta en el playón",
  "descripcion": "Conducción de bocha y postura de stick en una tarde de entrenamiento abierto.",
  "imagen": "assets/img/eventos/costanera-02.jpg",
  "miniatura": "assets/img/eventos/thumbs/costanera-02.jpg",
  "ancho": 950,
  "alto": 503,
  "alt": "Grupo de niños patinando con sticks en el playón de la Costanera"
}
```

### Campos

| Campo | Obligatorio | Para qué sirve |
|---|---|---|
| `capitulo` | Sí | Etiqueta de capítulo que se muestra en la foto. |
| `grupo` | No | Asocia la foto a un botón. Sin este campo, aparece en “Todas”. |
| `titulo` | Sí | Título visible y nombre accesible del enlace. |
| `descripcion` | No | Texto del pie de foto. |
| `imagen` | Sí | Foto grande que abre el visor. |
| `miniatura` | No | Foto liviana del carrusel. Si falta, se usa `imagen`. |
| `ancho` / `alto` | Sí | Tamaño real de `imagen` (PhotoSwipe los necesita para abrir sin saltos). |
| `alt` | Recomendado | Descripción de la imagen para lectores de pantalla. Si falta, se usa `titulo`. |

Los valores admitidos para `grupo` son `parana` (Encuentro en Paraná), `regional`
(Encuentro Regional), `costanera` (Promoción en Costanera), `liverpool`
(Escuelas de Iniciación en Liverpool) y `progreso` (Escuelas de Iniciación en Progreso).

## 4. Recargar

Abrí el sitio y hacé **Ctrl + F5**. El carrusel, los filtros y el visor se actualizan solos.

> Las fotos se cargan de a una según se acercan a la pantalla (`loading="lazy"`),
> así que podés sumar muchas sin que la página se vuelva lenta.
