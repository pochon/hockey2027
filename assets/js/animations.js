/* ============================================================
   Hockey Santa Fe 2027 — animations.js
   Aparición suave al hacer scroll con IntersectionObserver.
   Respeta prefers-reduced-motion y funciona sin librerías.
   ============================================================ */
(function () {
  'use strict';

  var sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var observador = null;

  function mostrarTodo() {
    var elementos = document.querySelectorAll('.reveal');
    Array.prototype.forEach.call(elementos, function (elemento) {
      elemento.classList.add('is-visible');
    });
  }

  function observar(raiz) {
    if (!observador) return;

    var objetivos = raiz.querySelectorAll('.reveal:not(.is-visible)');

    /* Si no hay objetivos nuevos, no hay nada que hacer */
    if (!objetivos.length) return;

    Array.prototype.forEach.call(objetivos, function (elemento) {
      observador.observe(elemento);
    });
  }

  function crearObservador() {
    if (!('IntersectionObserver' in window)) {
      mostrarTodo();
      return;
    }

    observador = new IntersectionObserver(
      function (entradas) {
        entradas.forEach(function (entrada) {
          if (!entrada.isIntersecting) return;
          entrada.target.classList.add('is-visible');
          observador.unobserve(entrada.target);
        });
      },
      {
        root: null,
        rootMargin: '0px 0px -8% 0px',
        threshold: 0.12,
      }
    );
  }

  /* Retardo escalonado para grupos de tarjetas */
  function escalonar(raiz) {
    var grupos = raiz.querySelectorAll('.cards');

    Array.prototype.forEach.call(grupos, function (grupo) {
      var hijos = grupo.querySelectorAll('.reveal');

      Array.prototype.forEach.call(hijos, function (hijo, indice) {
        if (!hijo.style.transitionDelay) {
          hijo.style.transitionDelay = Math.min(indice * 70, 350) + 'ms';
        }
      });
    });
  }

  function iniciar() {
    /* Registrar siempre: la galería puede llegar con movimiento reducido */
    document.addEventListener('galeria-lista', function () {
      if (sinMovimiento) {
        mostrarTodo();
        return;
      }
      escalonar(document);
      observar(document);
    });

    if (sinMovimiento) {
      mostrarTodo();
      return;
    }

    crearObservador();
    observar(document);
    escalonar(document);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
