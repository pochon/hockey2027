/* ============================================================
   Hockey Santa Fe 2027 — mapa.js
   Mapa de sedes y encuentros con Leaflet (local, sin CDN).
   Los datos salen de data/contenido.json -> "sedes".
   ============================================================ */
(function () {
  'use strict';

  var CONTENEDOR_ID = 'mapaSedes';
  var LISTA_ID = 'sedesLista';
  var RUTA_DATOS = 'data/contenido.json';

  var TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  var ATRIBUCION =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

  var mapa = null;
  var capa = null;
  var marcadores = [];
  var mqOscuro = window.matchMedia('(prefers-color-scheme: dark)');
  var mqReducido = window.matchMedia('(prefers-reduced-motion: reduce)');

  function crearIcono() {
    return L.divIcon({
      className: 'mapa-pin',
      html: '<span class="mapa-pin__punto" aria-hidden="true"></span>',
      iconSize: [28, 40],
      iconAnchor: [14, 40],
      popupAnchor: [0, -36],
    });
  }

  function crearPopup(sede) {
    var contenedor = document.createElement('div');
    contenedor.className = 'mapa-popup';

    if (sede.tipo) {
      var tipo = document.createElement('span');
      tipo.className = 'mapa-popup__tipo';
      tipo.textContent = sede.tipo;
      contenedor.appendChild(tipo);
    }

    var nombre = document.createElement('strong');
    nombre.textContent = sede.nombre;
    contenedor.appendChild(nombre);

    if (sede.descripcion) {
      var descripcion = document.createElement('p');
      descripcion.textContent = sede.descripcion;
      contenedor.appendChild(descripcion);
    }

    return contenedor;
  }

  function aplicarTema() {
    if (!mapa) return;

    var contenedor = mapa.getContainer();
    contenedor.classList.toggle('mapa--oscuro', mqOscuro.matches);
  }

  function centrarEn(sede) {
    if (!mapa) return;

    if (mqReducido.matches) {
      mapa.setView([sede.lat, sede.lng], 12);
    } else {
      mapa.flyTo([sede.lat, sede.lng], 12, { duration: 0.9 });
    }

    if (sede.marcador) sede.marcador.openPopup();
  }

  function crearLista(sedes) {
    var lista = document.getElementById(LISTA_ID);
    if (!lista) return;

    lista.textContent = '';
    var fragmento = document.createDocumentFragment();

    sedes.forEach(function (sede) {
      var item = document.createElement('li');
      item.className = 'sede';

      var boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'sede-btn';

      if (sede.tipo) {
        var tipo = document.createElement('span');
        tipo.className = 'sede-tipo';
        tipo.textContent = sede.tipo;
        boton.appendChild(tipo);
      }

      var nombre = document.createElement('strong');
      nombre.textContent = sede.nombre;
      boton.appendChild(nombre);

      if (sede.descripcion) {
        var descripcion = document.createElement('span');
        descripcion.className = 'sede-desc';
        descripcion.textContent = sede.descripcion;
        boton.appendChild(descripcion);
      }

      boton.addEventListener('click', function () {
        centrarEn(sede);
      });

      item.appendChild(boton);
      fragmento.appendChild(item);
    });

    lista.appendChild(fragmento);
  }

  function mostrarAviso(mensaje) {
    var contenedor = document.getElementById(CONTENEDOR_ID);
    if (!contenedor) return;
    contenedor.classList.add('mapa--error');
    contenedor.textContent = mensaje;
  }

  function iniciarMapa(sedes) {
    var contenedor = document.getElementById(CONTENEDOR_ID);

    if (!contenedor) return;

    if (typeof L === 'undefined') {
      mostrarAviso('No se pudo cargar el mapa. Verificá assets/vendor/leaflet.');
      return;
    }

    if (!sedes || !sedes.length) {
      mostrarAviso('Todavía no hay sedes cargadas en data/contenido.json.');
      return;
    }

    mapa = L.map(contenedor, {
      scrollWheelZoom: false,
      zoomControl: true,
      attributionControl: true,
    });

    mapa.attributionControl.setPrefix(
      '<a href="https://leafletjs.com" title="Leaflet">Leaflet</a>'
    );

    capa = L.tileLayer(TILES, {
      maxZoom: 19,
      attribution: ATRIBUCION,
    }).addTo(mapa);

    aplicarTema();

    var icono = crearIcono();
    var limites = [];

    sedes.forEach(function (sede) {
      if (typeof sede.lat !== 'number' || typeof sede.lng !== 'number') return;

      var marcador = L.marker([sede.lat, sede.lng], {
        icon: icono,
        title: sede.nombre,
        alt: sede.nombre,
        keyboard: true,
      });

      marcador.bindPopup(crearPopup(sede));
      marcador.addTo(mapa);

      sede.marcador = marcador;
      marcadores.push(marcador);
      limites.push([sede.lat, sede.lng]);
    });

    if (limites.length === 1) {
      mapa.setView(limites[0], 13);
    } else if (limites.length > 1) {
      mapa.fitBounds(limites, { padding: [36, 36] });
    } else {
      mapa.setView([-31.6333, -60.7008], 10);
    }

    crearLista(sedes);

    /* Habilitar zoom con la rueda sólo cuando el mapa tiene el foco */
    mapa.on('focus', function () {
      mapa.scrollWheelZoom.enable();
    });
    mapa.on('blur', function () {
      mapa.scrollWheelZoom.disable();
    });

    if (mqOscuro.addEventListener) {
      mqOscuro.addEventListener('change', aplicarTema);
    } else if (mqOscuro.addListener) {
      mqOscuro.addListener(aplicarTema);
    }
  }

  function cargar() {
    if (!document.getElementById(CONTENEDOR_ID)) return;

    if (typeof fetch !== 'function') {
      mostrarAviso('Este navegador no permite cargar el mapa.');
      return;
    }

    fetch(RUTA_DATOS, { cache: 'no-cache' })
      .then(function (respuesta) {
        if (!respuesta.ok) throw new Error('HTTP ' + respuesta.status);
        return respuesta.json();
      })
      .then(function (contenido) {
        iniciarMapa(contenido.sedes);
      })
      .catch(function (error) {
        console.warn('No se pudo cargar el mapa:', error);
        mostrarAviso('No se pudieron cargar las sedes desde data/contenido.json.');
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cargar);
  } else {
    cargar();
  }
})();
