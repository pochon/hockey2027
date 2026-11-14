/* ============================================================
   Hockey Santa Fe 2027 — gallery.js
   Carrusel de imágenes alimentado por data/contenido.json.
   - Flechas, teclado, swipe nativo y scroll-snap
   - Filtros por grupo de fotos
   - Cada slide abre PhotoSwipe (data-pswp-width/height)
   Para agregar fotos: sumar objetos al array "galeria" del JSON
   (campos: capitulo, titulo, descripcion, imagen, miniatura,
   ancho, alto, alt). Si no hay "miniatura", usa "imagen".
   ============================================================ */
(function () {
  'use strict';

  var CONTENEDOR_ID = 'galeriaGrid';
  var RUTA_DATOS = 'data/contenido.json';
  var GRUPOS_GALERIA = [
    { valor: 'parana', etiqueta: 'Encuentro en Paraná' },
    { valor: 'regional', etiqueta: 'Encuentro Regional' },
    { valor: 'costanera', etiqueta: 'Promoción en Costanera' },
    { valor: 'liverpool', etiqueta: 'Escuelas de Iniciación en Liverpool' },
    { valor: 'progreso', etiqueta: 'Escuelas de Iniciación en Progreso' },
  ];

  var figuras = [];
  var track = null;
  var prevBtn = null;
  var nextBtn = null;
  var contador = null;
  var carruselListo = false;
  var moverPendiente = false;
  var arrastre = null;
  var ignorarClick = false;
  var sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Utilidades ---------- */
  function neutralizarEnlace(enlace) {
    enlace.classList.remove('gallery-link');
    enlace.removeAttribute('href');
    enlace.removeAttribute('data-pswp-width');
    enlace.removeAttribute('data-pswp-height');
    enlace.removeAttribute('aria-label');
  }

  function marcarPlaceholder(media) {
    media.classList.add('placeholder');
    media.setAttribute('aria-hidden', 'true');
    media.textContent = '🏒';
  }

  function crearFigura(item, indice) {
    var figura = document.createElement('figure');
    figura.className = 'gallery-item';
    figura.setAttribute('role', 'group');
    figura.setAttribute('aria-roledescription', 'diapositiva');
    figura.setAttribute('aria-label', indice + 1 + ' de ' + figuras.length);
    if (item.capitulo) figura.dataset.capitulo = item.capitulo;
    if (item.grupo) figura.dataset.grupo = item.grupo;

    var media = document.createElement('div');
    media.className = 'figure-media';

    var titulo = item.titulo || 'Galería ' + (indice + 1);

    var enlace = document.createElement('a');
    enlace.className = 'gallery-link';
    enlace.href = item.imagen || '#';
    enlace.setAttribute('data-pswp-width', String(item.ancho || 1600));
    enlace.setAttribute('data-pswp-height', String(item.alto || 1200));

    if (item.imagen) {
      var imagen = document.createElement('img');
      imagen.loading = 'lazy';
      imagen.decoding = 'async';
      imagen.alt = item.alt || titulo;
      imagen.width = item.ancho || 800;
      imagen.height = item.alto || 600;

      imagen.addEventListener('error', function () {
        imagen.remove();
        marcarPlaceholder(media);
        neutralizarEnlace(enlace);
      });

      imagen.src = item.miniatura || item.imagen;
      media.appendChild(imagen);
    } else {
      marcarPlaceholder(media);
      neutralizarEnlace(enlace);
    }

    enlace.appendChild(media);

    var caption = document.createElement('figcaption');

    if (item.capitulo) {
      var capitulo = document.createElement('span');
      capitulo.className = 'gallery-chapter';
      capitulo.textContent = item.capitulo;
      caption.appendChild(capitulo);
    }

    var nombre = document.createElement('strong');
    nombre.textContent = titulo;
    caption.appendChild(nombre);

    if (item.descripcion) {
      var descripcion = document.createElement('p');
      descripcion.textContent = item.descripcion;
      caption.appendChild(descripcion);
    }

    enlace.appendChild(caption);
    figura.appendChild(enlace);

    return figura;
  }

  /* ---------- Carrusel ---------- */
  function anchoPaso() {
    if (!track) return 0;

    var slide = track.querySelector('.gallery-item');
    if (!slide) return track.clientWidth;

    var estilos = window.getComputedStyle(track);
    var gap = parseFloat(estilos.columnGap || estilos.gap) || 0;

    return slide.getBoundingClientRect().width + gap;
  }

  function porVista() {
    if (!track) return 1;

    var paso = anchoPaso();
    if (!paso) return 1;

    var estilos = window.getComputedStyle(track);
    var gap = parseFloat(estilos.columnGap || estilos.gap) || 0;

    return Math.max(1, Math.round((track.clientWidth + gap) / paso));
  }

  function actualizarCarrusel() {
    if (!track) return;

    var slides = track.querySelectorAll('.gallery-item');
    var total = slides.length;

    if (prevBtn && nextBtn) {
      var alInicio = track.scrollLeft <= 2;
      var alFinal = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
      prevBtn.disabled = total === 0 || alInicio;
      nextBtn.disabled = total === 0 || alFinal;
    }

    if (!contador) return;

    if (!total) {
      contador.textContent = 'Sin imágenes';
      return;
    }

    var visibles = porVista();

    if (total <= visibles) {
      contador.textContent = total + (total === 1 ? ' imagen' : ' imágenes');
      return;
    }

    var paso = anchoPaso();
    var inicio = Math.min(
      total - 1,
      Math.max(0, Math.round(track.scrollLeft / paso))
    );
    var fin = Math.min(total, inicio + visibles);

    contador.textContent = inicio + 1 + '–' + fin + ' de ' + total;
  }

  function alScrollear() {
    if (moverPendiente) return;
    moverPendiente = true;

    window.requestAnimationFrame(function () {
      actualizarCarrusel();
      moverPendiente = false;
    });
  }

  function indiceActual() {
    var paso = anchoPaso();
    if (!paso) return 0;
    return Math.round(track.scrollLeft / paso);
  }

  function irA(indice) {
    if (!track) return;

    var paso = anchoPaso();
    if (!paso) return;

    var maximo = Math.max(0, track.scrollWidth - track.clientWidth);
    var destino = Math.min(maximo, Math.max(0, indice * paso));

    track.scrollTo({
      left: destino,
      behavior: sinMovimiento ? 'auto' : 'smooth',
    });
  }

  function mover(direccion) {
    if (!track) return;
    irA(indiceActual() + direccion);
  }

  function reiniciarCarrusel() {
    if (!track) return;

    track.scrollTo({ left: 0, behavior: 'auto' });
    actualizarCarrusel();
  }

  function iniciarCarrusel() {
    if (carruselListo) return;

    track = document.getElementById(CONTENEDOR_ID);
    prevBtn = document.getElementById('galeriaPrev');
    nextBtn = document.getElementById('galeriaNext');
    contador = document.getElementById('galeriaContador');

    if (!track || !prevBtn || !nextBtn) return;

    carruselListo = true;

    prevBtn.addEventListener('click', function () {
      mover(-1);
    });

    nextBtn.addEventListener('click', function () {
      mover(1);
    });

    track.addEventListener('scroll', alScrollear, { passive: true });

    track.addEventListener('pointerdown', function (evento) {
      if (evento.pointerType !== 'mouse' || evento.button !== 0) return;

      arrastre = {
        pointerId: evento.pointerId,
        inicioX: evento.clientX,
        scrollInicial: track.scrollLeft,
        movido: false,
      };
    });

    window.addEventListener('pointermove', function (evento) {
      if (!arrastre || evento.pointerId !== arrastre.pointerId) return;

      var desplazamiento = evento.clientX - arrastre.inicioX;
      if (!arrastre.movido && Math.abs(desplazamiento) < 5) return;

      arrastre.movido = true;
      track.classList.add('is-dragging');
      evento.preventDefault();
      track.scrollLeft = arrastre.scrollInicial - desplazamiento;
    });

    function finalizarArrastre(evento) {
      if (!arrastre || evento.pointerId !== arrastre.pointerId) return;

      if (arrastre.movido) {
        ignorarClick = true;
        window.setTimeout(function () {
          ignorarClick = false;
        }, 0);
      }

      arrastre = null;
      track.classList.remove('is-dragging');
    }

    window.addEventListener('pointerup', finalizarArrastre);
    window.addEventListener('pointercancel', finalizarArrastre);

    track.addEventListener('click', function (evento) {
      if (!ignorarClick) return;

      ignorarClick = false;
      evento.preventDefault();
      evento.stopImmediatePropagation();
    }, true);

    track.addEventListener('dragstart', function (evento) {
      evento.preventDefault();
    });

    track.addEventListener('keydown', function (evento) {
      if (evento.key === 'ArrowRight') {
        evento.preventDefault();
        mover(1);
      } else if (evento.key === 'ArrowLeft') {
        evento.preventDefault();
        mover(-1);
      } else if (evento.key === 'Home') {
        evento.preventDefault();
        track.scrollTo({ left: 0, behavior: 'auto' });
      } else if (evento.key === 'End') {
        evento.preventDefault();
        irA(track.querySelectorAll('.gallery-item').length);
      }
    });

    window.addEventListener('resize', actualizarCarrusel);
  }

  /* ---------- Filtros ---------- */
  function crearFiltros(items) {
    var barra = document.getElementById('galeriaFiltros');
    var estado = document.getElementById('galeriaEstado');
    var contenedor = document.getElementById(CONTENEDOR_ID);

    if (!barra || !contenedor) return;

    barra.textContent = '';

    barra.hidden = false;

    var botones = [];

    function aplicar(valor, boton, silencioso) {
      var visibles = 0;

      /* Sólo dejamos en el DOM las figuras que coinciden: así el
         visor y los lectores de pantalla trabajan con lo visible */
      contenedor.textContent = '';

      figuras.forEach(function (figura) {
        if (!valor || figura.dataset.grupo === valor) {
          contenedor.appendChild(figura);
          visibles++;
        }
      });

      botones.forEach(function (b) {
        var activo = b === boton;
        b.classList.toggle('is-active', activo);
        b.setAttribute('aria-pressed', activo ? 'true' : 'false');
      });

      if (estado) {
        var grupo = GRUPOS_GALERIA.filter(function (opcion) {
          return opcion.valor === valor;
        })[0];
        estado.textContent = valor
          ? 'Mostrando ' + visibles + ' de ' + figuras.length + ' imágenes · ' + grupo.etiqueta + '.'
          : 'Mostrando las ' + figuras.length + ' imágenes.';
      }

      reiniciarCarrusel();

      if (silencioso) return;

      document.dispatchEvent(
        new CustomEvent('galeria-filtrada', {
          detail: { grupo: valor || null, visibles: visibles },
        })
      );
    }

    function crearBoton(valor, texto) {
      var boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'filtro';
      boton.dataset.grupo = valor;
      boton.textContent = texto;
      boton.addEventListener('click', function () {
        aplicar(valor, boton, false);
      });
      botones.push(boton);
      barra.appendChild(boton);
      return boton;
    }

    var todas = crearBoton('', 'Todas (' + items.length + ')');

    GRUPOS_GALERIA.forEach(function (grupo) {
      var cantidad = items.filter(function (item) {
        return item.grupo === grupo.valor;
      }).length;
      crearBoton(grupo.valor, grupo.etiqueta + ' (' + cantidad + ')');
      
    });

    aplicar('', todas, true);
  }

  function mostrarAviso(contenedor, mensaje) {
    if (!contenedor) return;
    var aviso = document.createElement('p');
    aviso.className = 'gallery-error';
    aviso.textContent = mensaje;
    contenedor.appendChild(aviso);
  }

  function renderizar(items) {
    var contenedor = document.getElementById(CONTENEDOR_ID);
    if (!contenedor) return;

    contenedor.textContent = '';

    if (!items || !items.length) {
      mostrarAviso(contenedor, 'Todavía no hay imágenes cargadas en la galería.');
      actualizarCarrusel();
      return;
    }

    iniciarCarrusel();

    figuras = items.map(function (item, indice) {
      return crearFigura(item, indice);
    });

    /* Actualizar las etiquetas "N de M" ahora que sabemos el total */
    figuras.forEach(function (figura, indice) {
      figura.setAttribute('aria-label', indice + 1 + ' de ' + figuras.length);
    });

    var fragmento = document.createDocumentFragment();
    figuras.forEach(function (figura) {
      fragmento.appendChild(figura);
    });

    contenedor.appendChild(fragmento);

    crearFiltros(items);
    actualizarCarrusel();

    /* Avisar a lightbox.js y animations.js que hay contenido nuevo */
    document.dispatchEvent(
      new CustomEvent('galeria-lista', { detail: { total: items.length } })
    );
  }

  function cargar() {
    var contenedor = document.getElementById(CONTENEDOR_ID);
    if (!contenedor) return;

    if (typeof fetch !== 'function') {
      mostrarAviso(contenedor, 'Este navegador no permite cargar la galería.');
      return;
    }

    iniciarCarrusel();

    fetch(RUTA_DATOS, { cache: 'no-cache' })
      .then(function (respuesta) {
        if (!respuesta.ok) {
          throw new Error('HTTP ' + respuesta.status);
        }
        return respuesta.json();
      })
      .then(function (contenido) {
        renderizar(contenido.galeria);
      })
      .catch(function (error) {
        console.warn('No se pudo cargar la galería:', error);
        mostrarAviso(
          contenedor,
          'No se pudo cargar la galería. Verificá que data/contenido.json exista.'
        );
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cargar);
  } else {
    cargar();
  }
})();
