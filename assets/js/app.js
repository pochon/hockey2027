/* ============================================================
   Hockey Santa Fe 2027 — app.js
   Menú móvil accesible · Scrollspy · Header con scroll ·
   Botón "volver arriba". Sin dependencias.
   ============================================================ */
(function () {
  'use strict';

  var header = document.querySelector('.site-header');
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('siteNav');
  var backToTop = document.getElementById('backToTop');
  var navLinks = nav ? Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]')) : [];
  var secciones = [];
  var mqEscritorio = window.matchMedia('(min-width: 768px)');

  /* ---------- Menú móvil ---------- */
  function estaAbierto() {
    return header ? header.classList.contains('nav-open') : false;
  }

  function abrirMenu() {
    if (!header || !toggle) return;
    header.classList.add('nav-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Cerrar menú de navegación');
  }

  function cerrarMenu() {
    if (!header || !toggle) return;
    header.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menú de navegación');
  }

  function alternarMenu() {
    if (estaAbierto()) {
      cerrarMenu();
    } else {
      abrirMenu();
    }
  }

  if (toggle) {
    toggle.addEventListener('click', alternarMenu);
  }

  /* Cerrar al elegir un enlace (sólo en móvil) */
  navLinks.forEach(function (enlace) {
    enlace.addEventListener('click', function () {
      if (!mqEscritorio.matches) cerrarMenu();
    });
  });

  /* Cerrar con Escape y devolver el foco al botón */
  document.addEventListener('keydown', function (evento) {
    if (evento.key === 'Escape' && estaAbierto()) {
      cerrarMenu();
      if (toggle) toggle.focus();
    }
  });

  /* Cerrar al hacer clic fuera del header */
  document.addEventListener('click', function (evento) {
    if (!estaAbierto() || !header) return;
    if (!header.contains(evento.target)) cerrarMenu();
  });

  /* Al pasar a escritorio, asegurar estado cerrado */
  function sincronizarBreakpoint() {
    if (mqEscritorio.matches) cerrarMenu();
  }

  if (mqEscritorio.addEventListener) {
    mqEscritorio.addEventListener('change', sincronizarBreakpoint);
  } else if (mqEscritorio.addListener) {
    mqEscritorio.addListener(sincronizarBreakpoint);
  }

  /* ---------- Scrollspy ---------- */
  function prepararSecciones() {
    secciones = navLinks
      .map(function (enlace) {
        var id = enlace.getAttribute('href').slice(1);
        var seccion = id ? document.getElementById(id) : null;
        return seccion ? { enlace: enlace, seccion: seccion } : null;
      })
      .filter(Boolean);
  }

  function marcarActivo(activo) {
    navLinks.forEach(function (enlace) {
      if (enlace === activo) {
        enlace.classList.add('is-active');
        enlace.setAttribute('aria-current', 'true');
      } else {
        enlace.classList.remove('is-active');
        enlace.removeAttribute('aria-current');
      }
    });
  }

  function actualizarScrollspy() {
    if (!secciones.length) return;

    var linea = window.scrollY + (header ? header.offsetHeight : 0) + 24;
    var actual = null;

    secciones.forEach(function (item) {
      if (item.seccion.offsetTop <= linea) actual = item;
    });

    /* Si llegamos al final de la página, marcar la última sección */
    var alFinal = window.innerHeight + window.scrollY >= document.body.offsetHeight - 4;
    if (alFinal) actual = secciones[secciones.length - 1];

    marcarActivo(actual ? actual.enlace : null);
  }

  /* ---------- Header con scroll + volver arriba ---------- */
  function actualizarEstadoScroll() {
    var y = window.scrollY;

    if (header) {
      header.classList.toggle('is-scrolled', y > 8);
    }

    if (backToTop) {
      var visible = y > 480;
      backToTop.hidden = !visible;
      backToTop.classList.toggle('is-visible', visible);
    }
  }

  function irArriba() {
    var reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reducido ? 'auto' : 'smooth' });
    var marca = document.querySelector('.brand');
    if (marca) {
      marca.focus({ preventScroll: true });
    }
  }

  if (backToTop) {
    backToTop.addEventListener('click', irArriba);
  }

  /* ---------- Throttle con requestAnimationFrame ---------- */
  var pendiente = false;

  function alScroll() {
    if (pendiente) return;
    pendiente = true;
    window.requestAnimationFrame(function () {
      actualizarEstadoScroll();
      actualizarScrollspy();
      pendiente = false;
    });
  }

  /* ---------- Registro del service worker ---------- */
  function registrarServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol === 'file:') return;

    window.addEventListener('load', function () {
      navigator.serviceWorker.register('service-worker.js').catch(function (error) {
        console.warn('No se pudo registrar el service worker:', error);
      });
    });
  }

  /* ---------- Inicio ---------- */
  function iniciar() {
    prepararSecciones();
    actualizarEstadoScroll();
    actualizarScrollspy();

    window.addEventListener('scroll', alScroll, { passive: true });
    window.addEventListener('resize', alScroll);

    registrarServiceWorker();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
