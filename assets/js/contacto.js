/* ============================================================
   Hockey Santa Fe 2027 — contacto.js
   Formulario sin backend:
   - Si data/contenido.json -> contacto.endpoint está definido,
     envía un POST JSON a esa URL (Formspree, Getform, etc.).
   - Si no, abre el cliente de correo con el mensaje precargado.
   ============================================================ */
(function () {
  'use strict';

  var form = document.getElementById('formContacto');
  if (!form) return;

  var estado = document.getElementById('contactoEstado');
  var boton = form.querySelector('button[type="submit"]');
  var textoBoton = boton ? boton.textContent : 'Enviar mensaje';

  /* Cargar la configuración de contacto una sola vez */
  var configLista = (function () {
    if (typeof fetch !== 'function') return Promise.resolve(null);

    return fetch('data/contenido.json', { cache: 'no-cache' })
      .then(function (respuesta) {
        return respuesta.ok ? respuesta.json() : null;
      })
      .then(function (contenido) {
        return (contenido && contenido.contacto) || null;
      })
      .catch(function () {
        return null;
      });
  })();

  function mostrar(mensaje, tipo) {
    if (!estado) return;
    estado.textContent = mensaje;
    estado.className = 'form-estado' + (tipo ? ' form-estado--' + tipo : '');
  }

  function ocupado(activo) {
    if (!boton) return;
    boton.disabled = activo;
    boton.textContent = activo ? 'Enviando…' : textoBoton;
  }

  function asuntoDe(config) {
    return (config && config.asunto) || 'Consulta desde el sitio — Hockey Santa Fe 2027';
  }

  function construirMailto(correo, asunto, datos) {
    var cuerpo =
      'Nombre: ' +
      datos.nombre +
      '\nCorreo: ' +
      datos.email +
      '\n\n' +
      datos.mensaje;

    return (
      'mailto:' +
      correo +
      '?subject=' +
      encodeURIComponent(asunto) +
      '&body=' +
      encodeURIComponent(cuerpo)
    );
  }

  form.addEventListener('submit', function (evento) {
    evento.preventDefault();

    var datos = {
      nombre: form.nombre.value.trim(),
      email: form.email.value.trim(),
      mensaje: form.mensaje.value.trim(),
      empresa: form.empresa ? form.empresa.value.trim() : '',
    };

    /* Trampa anti-spam: si viene completa, simulamos éxito */
    if (datos.empresa) {
      form.reset();
      mostrar('¡Gracias! Recibimos tu mensaje.', 'ok');
      return;
    }

    /* Validación nativa (required, type=email, minlength) */
    if (!form.checkValidity()) {
      form.reportValidity();
      mostrar('Revisá los campos marcados antes de enviar.', 'error');
      return;
    }

    mostrar('');
    ocupado(true);

    configLista.then(function (config) {
      var endpoint = config && config.endpoint;
      var correo = (config && config.email) || '';

      /* Sin endpoint: mailto */
      if (!endpoint) {
        ocupado(false);

        if (!correo) {
          mostrar(
            'No hay un correo configurado. Agregá "email" en contacto dentro de data/contenido.json.',
            'error'
          );
          return;
        }

        window.location.href = construirMailto(correo, asuntoDe(config), datos);
        mostrar(
          'Abrimos tu cliente de correo con el mensaje listo. Si no se abrió, escribí a ' +
            correo +
            '.',
          'ok'
        );
        return;
      }

      /* Con endpoint: POST JSON */
      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          nombre: datos.nombre,
          email: datos.email,
          mensaje: datos.mensaje,
        }),
      })
        .then(function (respuesta) {
          if (!respuesta.ok) throw new Error('HTTP ' + respuesta.status);
          form.reset();
          mostrar(
            '¡Gracias! Recibimos tu mensaje y te responderemos a la brevedad.',
            'ok'
          );
        })
        .catch(function (error) {
          console.warn('No se pudo enviar el formulario:', error);
          mostrar(
            'No pudimos enviar el mensaje. Probá de nuevo' +
              (correo ? ' o escribí a ' + correo : '') +
              '.',
            'error'
          );
        })
        .then(function () {
          ocupado(false);
        });
    });
  });

  /* Limpiar el estado de error mientras se escribe */
  form.addEventListener('input', function () {
    if (estado && estado.classList.contains('form-estado--error')) {
      mostrar('');
    }
  });
})();
