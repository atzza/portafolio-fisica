// Cambia el "mundo" (color) de la página según el tema que está en pantalla
// y marca en el menú el tema actual.
(function () {
  const secciones = document.querySelectorAll("[data-mundo-seccion]");
  const enlaces = document.querySelectorAll(".menu__temas a");

  function activar(seccion) {
    const mundo = seccion.dataset.mundoSeccion;
    if (document.body.dataset.mundo === mundo) return;
    document.body.dataset.mundo = mundo;
    secciones.forEach((s) => s.classList.toggle("activo", s === seccion));
    enlaces.forEach((a) => {
      const actual = a.getAttribute("href") === "#" + seccion.id;
      a.setAttribute("aria-current", actual ? "true" : "false");
      if (actual) a.scrollIntoView({ block: "nearest", inline: "center" });
    });
    // Aviso para las animaciones de entrada (entradas.js)
    document.dispatchEvent(new CustomEvent("mundo", { detail: seccion }));
  }

  // Un tema se considera "actual" cuando cruza la franja central de la pantalla
  const observador = new IntersectionObserver(
    (entradas) => entradas.forEach((e) => e.isIntersecting && activar(e.target)),
    { rootMargin: "-45% 0px -45% 0px" }
  );
  secciones.forEach((s) => observador.observe(s));
})();

// Utilidades compartidas por los temas
const Fis = {
  // Número con coma decimal, como se escribe en español
  n(valor, decimales = 2) {
    return valor.toFixed(decimales).replace(".", ",").replace(/^-0(,0+)?$/, "0$1");
  },
  svg(nombre, atributos = {}, padre) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", nombre);
    for (const k in atributos) el.setAttribute(k, atributos[k]);
    if (padre) padre.appendChild(el);
    return el;
  },
  // Flecha de un vector: se coloca con su origen y sus componentes en pixeles
  flecha(padre, clase = "flecha") {
    const g = Fis.svg("g", { class: clase }, padre);
    const linea = Fis.svg("line", { x1: 0, y1: 0, y2: 0, "stroke-width": 2.5, "stroke-linecap": "round" }, g);
    const punta = Fis.svg("path", { d: "M0 0 L-9 -5 L-9 5 Z" }, g);
    return {
      poner(x, y, dx, dy) {
        const largo = Math.hypot(dx, dy);
        g.style.display = largo < 6 ? "none" : "";
        if (largo < 6) return;
        g.setAttribute("transform", `translate(${x},${y}) rotate(${(Math.atan2(dy, dx) * 180) / Math.PI})`);
        linea.setAttribute("x2", largo - 6);
        punta.setAttribute("transform", `translate(${largo},0)`);
      },
    };
  },
};
