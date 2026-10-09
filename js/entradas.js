// Entradas animadas: al llegar a cada tema se reproduce una escena corta y después
// aparece el título. Cada escena se mueve con las ecuaciones de su propio tema.
const Entradas = (function () {
  const S = Fis.svg;
  const reducir = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Física compartida por las escenas ----------

  // Ir de p0 a p1 en un tiempo T: acelera la primera mitad y frena la segunda (MRUA por tramos)
  function tramo(p0, p1, t, T) {
    const u = Math.max(0, Math.min(1, t / T));
    return p0 + (p1 - p0) * (u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u));
  }
  // Velocidad del tramo anterior (su derivada)
  function vTramo(p0, p1, t, T) {
    const u = t / T;
    if (u <= 0 || u >= 1) return 0;
    return ((p1 - p0) / T) * (u < 0.5 ? 4 * u : 4 * (1 - u));
  }

  // Altura sobre el piso de algo que cae desde h0 y rebota con coeficiente de restitución e
  function rebote(t, h0, g, e) {
    let v = Math.sqrt(2 * g * h0);
    const caida = v / g;
    if (t < caida) return h0 - 0.5 * g * t * t;
    t -= caida;
    for (v *= e; v > 25; v *= e) {
      const vuelo = (2 * v) / g;
      if (t < vuelo) return v * t - 0.5 * g * t * t;
      t -= vuelo;
    }
    return 0;
  }
  function duracionRebote(h0, g, e) {
    let v = Math.sqrt(2 * g * h0), total = v / g;
    for (v *= e; v > 25; v *= e) total += (2 * v) / g;
    return total;
  }

  // Flecha de un vector: se coloca con su origen y sus componentes en pixeles
  function flecha(padre, clase = "flecha") {
    const g = S("g", { class: clase }, padre);
    const linea = S("line", { x1: 0, y1: 0, y2: 0, "stroke-width": 2.5, "stroke-linecap": "round" }, g);
    const punta = S("path", { d: "M0 0 L-9 -5 L-9 5 Z" }, g);
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
  }

  // Texto de datos en la esquina, como la consola de un programa
  function hud(svg, lineas) {
    return Array.from({ length: lineas }, (_, i) => S("text", { class: "hud", x: 0, y: 14 + i * 18 }, svg));
  }

  // Cada escena recibe el svg y su tamaño, y devuelve { dur, impacto, cuadro(t) }:
  // cuadro(t) dibuja el instante t; en "impacto" aparece el título del tema.
  const ESCENAS = {};

  // ---------- Motor: decide cuándo se reproduce cada escena ----------
  const escenas = [...document.querySelectorAll(".escena")].map((el) => ({
    el, seccion: el.closest(".tema"), activa: false, visible: false, jugada: false, anim: 0,
  }));

  function revelar(e) { e.seccion.classList.add("revelado"); }

  function construir(e) {
    const crear = ESCENAS[e.el.dataset.escena];
    e.el.querySelector("svg")?.remove();
    if (!crear) { e.escena = null; revelar(e); return; }
    const W = e.el.clientWidth, H = e.el.clientHeight;
    const svg = S("svg", { width: W, height: H, role: "img", "aria-label": e.el.dataset.titulo });
    e.el.prepend(svg);
    e.escena = crear(svg, W, H);
    e.escena.cuadro(e.jugada || reducir ? e.escena.dur : 0);
  }

  function jugar(e) {
    if (!e.escena) return;
    cancelAnimationFrame(e.anim);
    e.jugada = true;
    if (reducir) { e.escena.cuadro(e.escena.dur); revelar(e); return; }
    e.el.classList.remove("terminada");
    let inicio;
    const paso = (ahora) => {
      inicio ??= ahora;
      const t = (ahora - inicio) / 1000;
      e.escena.cuadro(Math.min(t, e.escena.dur));
      if (t >= e.escena.impacto) revelar(e);
      if (t < e.escena.dur) e.anim = requestAnimationFrame(paso);
      else e.el.classList.add("terminada");
    };
    e.anim = requestAnimationFrame(paso);
  }

  // Se reproduce la primera vez que el tema está activo y su escena se ve
  function revisar(e) { if (e.activa && e.visible && !e.jugada) jugar(e); }

  escenas.forEach((e) => {
    construir(e);
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "escena__repetir";
    boton.textContent = "↻ Repetir";
    e.el.append(boton);
    e.el.addEventListener("click", () => jugar(e));
  });

  const observador = new IntersectionObserver(
    (entradas) => entradas.forEach((en) => {
      const e = escenas.find((x) => x.el === en.target);
      e.visible = en.intersectionRatio >= 0.4;
      e.el.classList.toggle("visible", en.isIntersecting);
      revisar(e);
    }),
    { threshold: [0, 0.4] }
  );
  escenas.forEach((e) => observador.observe(e.el));

  // base.js avisa cuando cambia el tema en pantalla
  document.addEventListener("mundo", (ev) => {
    escenas.forEach((e) => {
      e.activa = e.seccion === ev.detail;
      if (!e.activa) return;
      // Si se llega desde abajo, la escena no se ve: el título aparece de una vez
      if (!e.visible) revelar(e);
      setTimeout(() => revelar(e), 4000); // respaldo
      revisar(e);
    });
  });

  let ancho = innerWidth, espera;
  addEventListener("resize", () => {
    if (innerWidth === ancho) return;
    ancho = innerWidth;
    clearTimeout(espera);
    espera = setTimeout(() => escenas.forEach((e) => {
      cancelAnimationFrame(e.anim);
      if (e.jugada) { revelar(e); e.el.classList.add("terminada"); }
      construir(e);
    }), 150);
  });

  // ---------- Portada: las palabras del título caen con la misma g y rebotan ----------
  (function portada() {
    if (reducir) return;
    const caja = document.querySelector(".portada"), h1 = caja.querySelector("h1");
    const texto = h1.textContent.trim();
    h1.setAttribute("aria-label", texto);
    h1.textContent = "";
    const palabras = texto.split(" ").map((p, i, todas) => {
      const s = document.createElement("span");
      s.className = "palabra";
      s.textContent = p;
      s.setAttribute("aria-hidden", "true");
      h1.append(s, i < todas.length - 1 ? " " : "");
      return s;
    });
    // La pelota con los colores de los cinco temas hace de punto final
    const pelota = document.createElement("span");
    pelota.className = "pelota";
    palabras[palabras.length - 1].append(pelota);

    const G = 4200; // px/s², igual para todas: en caída libre g no depende de la masa
    let anim;
    function caer() {
      cancelAnimationFrame(anim);
      palabras.forEach((s) => (s.style.transform = ""));
      pelota.style.transform = "";
      // Cada palabra arranca justo arriba del borde de la pantalla
      const datos = palabras.map((s, i) => ({ s, h0: Math.min(600, s.getBoundingClientRect().bottom + 30), t0: i * 0.08, e: 0.32 }));
      const ultima = datos[datos.length - 1];
      const bola = { h0: Math.min(600, pelota.getBoundingClientRect().bottom + 30), e: 0.62 };
      bola.t0 = ultima.t0 + duracionRebote(ultima.h0, G, ultima.e) - 0.1;
      const fin = bola.t0 + duracionRebote(bola.h0, G, bola.e);
      const cuadro = (t) => {
        datos.forEach((d) => (d.s.style.transform = `translateY(${-rebote(Math.max(0, t - d.t0), d.h0, G, d.e)}px)`));
        const tb = Math.min(Math.max(0, t - bola.t0), fin - bola.t0);
        pelota.style.transform = `translateY(${-rebote(tb, bola.h0, G, bola.e)}px) rotate(${tb * 420}deg)`;
      };
      cuadro(0);
      caja.classList.add("lista");
      let inicio;
      const paso = (ahora) => {
        inicio ??= ahora;
        const t = (ahora - inicio) / 1000;
        cuadro(Math.min(t, fin));
        if (t < fin) anim = requestAnimationFrame(paso);
      };
      anim = requestAnimationFrame(paso);
    }
    caer();
    h1.addEventListener("click", caer);
  })();

  return { ESCENAS };
})();
