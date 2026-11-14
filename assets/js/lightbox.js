/* ============================================================
   Hockey Santa Fe 2027 — lightbox.js
   PhotoSwipe 5 cargado localmente (assets/vendor/photoswipe).
   Se recrea cuando la galería se pinta o se filtra, para que
   el visor incluya sólo las imágenes visibles.
   ============================================================ */
import PhotoSwipeLightbox from '../vendor/photoswipe/photoswipe-lightbox.esm.min.js';

var SELECTOR = '.gallery-link[data-pswp-width]';
var instancia = null;

function destruirLightbox() {
  if (!instancia) return;
  try {
    instancia.destroy();
  } catch (error) {
    console.warn('No se pudo destruir el visor anterior:', error);
  }
  instancia = null;
}

function crearLightbox() {
  /* Sin imágenes visibles: sólo limpiar */
  if (!document.querySelector(SELECTOR)) {
    destruirLightbox();
    return;
  }

  destruirLightbox();

  instancia = new PhotoSwipeLightbox({
    gallery: '#galeriaGrid',
    children: SELECTOR,
    pswpModule: () => import('../vendor/photoswipe/photoswipe.esm.min.js'),
    showHideAnimationType: 'fade',
    bgOpacity: 0.92,
    loop: true,
    wheelToZoom: true,
    arrowKeys: true,
  });

  /* Pie de foto tomado del <figcaption> de cada figura */
  instancia.on('uiRegister', function () {
    instancia.pswp.ui.registerElement({
      name: 'custom-caption',
      order: 9,
      isButton: false,
      appendTo: 'root',
      html: '',
      onInit: function (el, pswp) {
        pswp.on('change', function () {
          var enlace = pswp.currSlide && pswp.currSlide.data.element;
          var figura = enlace ? enlace.closest('figure') : null;
          var caption = figura ? figura.querySelector('figcaption') : null;

          el.textContent = '';

          if (!caption) return;

          var clon = caption.cloneNode(true);
          /* Quitar el kicker del capítulo para no repetirlo en el visor */
          var kicker = clon.querySelector('.gallery-chapter');
          if (kicker) kicker.remove();

          while (clon.firstChild) {
            el.appendChild(clon.firstChild);
          }
        });
      },
    });
  });

  instancia.init();
}

document.addEventListener('galeria-lista', crearLightbox);
document.addEventListener('galeria-filtrada', crearLightbox);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', crearLightbox);
} else {
  crearLightbox();
}
