# Portafolio de evidencias · Física I (FUN-18, CENFOTEC)

Sitio web estático de Azarela Fernández Sibaja para el Avance 1 del portafolio del curso.
Se publica en GitHub Pages. Entrega: sábado 10 de octubre de 2026, 11:59 PM. Es individual.

## Qué pide la consigna (no romper esto)

- Cada tema tiene su propia sección, titulada con el nombre exacto de la consigna.
- Cada tema lleva dos partes obligatorias:
  1. Caso de uso en Ingeniería del Software: caso concreto (producto, sistema o industria),
     ecuación explícita y justificación frente a alternativas no físicas.
  2. Recurso de apoyo del tipo prescrito, hecho por la estudiante. No se puede sustituir el tipo.
- Tipos prescritos: tema 1 visualización de datos, tema 2 simulación interactiva (mínimo dos
  controles: impulso y gravedad), tema 3 diagrama con caso numérico de 1 g, tema 4 visualización
  de datos con fuente citada, tema 5 video incrustado con análisis escrito y curva F contra x.
- Todo contenido de terceros va citado con su fuente. No se aceptan imágenes ni diagramas descargados.
- La navegación debe llevar a cualquier tema sin buscar.
- El portafolio es acumulativo: en los avances 2 y 3 se agregan 8 temas más (13 en total).
- El código no se califica, pero el historial de commits evidencia la autoría: hacer commits
  pequeños y frecuentes desde la cuenta de Azarela (github.com/atzza).

## Estructura

- `index.html`: todo el contenido. Una `<section class="tema" id="tema-N" data-mundo-seccion="N">` por tema.
- `css/estilos.css`: estilos. Cada tema es un "mundo" de color definido en `body[data-mundo="N"]`.
  Los tokens (`--fondo`, `--superficie`, `--tinta`, `--tinta-2`, `--acento`, `--regla`) están
  registrados con `@property` para que el cambio de color se anime. Los colores de series de
  datos (`--serie-1`, `--serie-2`) se definen por tema en `#tema-N` y no cambian con el mundo.
- `js/base.js`: detecta el tema en pantalla, cambia el mundo, marca el menú y avisa con el evento
  `mundo`. Define el objeto `Fis` con utilidades (`Fis.n` para números con coma decimal,
  `Fis.svg` para crear SVG, `Fis.flecha` para dibujar vectores).
- `js/entradas.js`: animaciones de entrada. Cada tema tiene un `<div class="escena" data-escena="nombre">`
  al inicio de `.tema__cabeza`; la escena (`ESCENAS.nombre`) se calcula con la física del tema y,
  en su instante de "impacto", aparece el título. También hace caer las palabras de la portada.
  Respeta "reducir movimiento" del sistema.
- `js/tema1-dron.js`: genera los datos de la ruta declarada, dibuja las gráficas y el botón «Volar la ruta».
- `js/tema2-salto.js`: simulación del salto.
- `js/tema3-habitat.js`: botones de rpm del diagrama del tema 3 y giro en tiempo real de las marcas del anillo.
- `js/tema4-llantas.js`: gráficas con datos reales (Milliken vía Wikipedia, Pirelli 2019), explorables.
- `js/tema5-haptico.js`: curva de fuerza contra desplazamiento (valores ilustrativos declarados) y
  el control «Apretá el gatillo» con el par de la tercera ley.
- El diagrama del tema 3 es SVG escrito a mano dentro de `index.html`; el JS solo actualiza textos y marcas.
- `_pruebas/` (si existe) es solo para pruebas locales y está excluida de git en `.git/info/exclude`.

Sin frameworks ni paso de compilación: HTML, CSS y JavaScript puros. Se abre con doble clic.

## Cómo agregar un tema nuevo

1. Agregar el enlace en `.menu__temas` y en la lista `.indice` de la portada.
2. Agregar el mundo `body[data-mundo="N"]` en `css/estilos.css` y, si hay gráficas, `#tema-N { --serie-1; --serie-2 }`.
3. Copiar la estructura de una sección existente: cabeza, caso de uso (tres partes), concepto
   físico con `.ecuacion`, recurso de apoyo en `.recurso`, conexiones y fuentes.
4. Si el recurso necesita código, crear `js/temaN-nombre.js` y cargarlo al final de `index.html`.
5. Animación de entrada: agregar `<div class="escena" data-escena="nombre" data-titulo="...">` al inicio
   de `.tema__cabeza` y la función `ESCENAS.nombre = function (svg, W, H) { return { dur, impacto, cuadro(t) } }`
   en `js/entradas.js`. Sin escena, el título aparece de una vez.

## Convenciones

- Español de Costa Rica, tono de estudiante, frases cortas. Números con coma decimal.
- Las gráficas se dibujan en SVG al ancho real del contenedor y se redibujan al cambiar el tamaño.
- Texto de las gráficas con los tokens de tinta, nunca con el color de la serie.
- Probar siempre a 400 px de ancho: nada debe provocar scroll horizontal.

## Lo visto en clase (para las conexiones)

- Semana 2: vectores con notación î ĵ k̂, MRUA (x = x₀ + v₀t + ½at², v = v₀ + at), caída libre,
  tiro parabólico como dos movimientos independientes, movimiento circular (v = ω·r, ω = 2π/T,
  a_c = v²/r, fuerza centrípeta). El profe dijo que así funciona el motor de física de un videojuego.
- Semana 3: leyes de Newton, f = μ·N con μs > μk (ejemplo: bloque de 10 kg, 39,2 N y 29,4 N),
  fricción y llantas, resortes F = −kx.
- Usar siempre esa notación. Cada tema tiene un párrafo en "Conexiones" que cita la semana.

## Pendientes al 9 de octubre

- Publicar en GitHub Pages y entregar en Moodle la URL del sitio y la del repositorio.
  El repo local ya existe con identidad propia (afernandezsi@ucenfotec.ac.cr), sin remoto todavía.
- En celular, las cuatro cajas de ecuaciones del diagrama del tema 3 quedan a la derecha y hay
  que deslizar dentro del recuadro para verlas.
- Hecho el 8 de octubre: los 10 enlaces de "Fuentes" cargan (PX4 y Unity apuntan a la página correcta).
- Hecho el 9 de octubre: Azarela revisó el video del tema 5 y el instante 9:19 está bien.
