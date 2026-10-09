// Tema 2: simulación interactiva del salto de un personaje.
// Todo se recalcula con las ecuaciones del tiro parabólico cada vez que se mueve un control.
(function () {
  const G_TIERRA = 9.81;   // m/s²
  const VX = 4;            // rapidez horizontal fija del personaje, m/s
  const el = (id) => document.getElementById(id);
  const cImpulso = el("sim-impulso"), cGravedad = el("sim-gravedad"), cComparar = el("sim-comparar");
  const lienzo = el("sim-lienzo");
  let personaje, escala, animacion;

  // Ecuaciones del salto (v0 = impulso vertical, g = gravedad del juego)
  const alturaMax = (v0, g) => (v0 * v0) / (2 * g);
  const tiempoAire = (v0, g) => (2 * v0) / g;
  const posicion = (v0, g, t) => ({ x: VX * t, y: v0 * t - 0.5 * g * t * t });

  function dibujar() {
    cancelAnimationFrame(animacion);
    const v0 = +cImpulso.value, g = +cGravedad.value;
    const h = alturaMax(v0, g), T = tiempoAire(v0, g);
    const comparar = cComparar.checked;
    const hT = alturaMax(v0, G_TIERRA), TT = tiempoAire(v0, G_TIERRA);

    el("sim-impulso-valor").textContent = Fis.n(v0, 1) + " m/s";
    el("sim-gravedad-valor").textContent = Fis.n(g, 2) + " m/s²";
    el("sim-altura").textContent = Fis.n(h) + " m";
    el("sim-tiempo").textContent = Fis.n(T) + " s";
    el("sim-alcance").textContent = Fis.n(VX * T) + " m";
    el("sim-veces").textContent = Fis.n(g / G_TIERRA, 1) + " × g";
    el("sim-tierra").textContent = comparar
      ? `Con el mismo impulso y g = 9,81 m/s², el salto llegaría a ${Fis.n(hT)} m y duraría ${Fis.n(TT)} s en el aire.`
      : "";

    // Escala: metros a pixeles, ajustada para que quepa todo el salto
    const W = lienzo.clientWidth, H = Math.max(240, Math.min(420, W * 0.5));
    const anchoM = Math.max(12, VX * Math.max(T, comparar ? TT : 0) * 1.12 + 1.5);
    const altoM = Math.max(5, Math.max(h, comparar ? hT : 0) * 1.15 + 1.6);
    const m = { i: 40, b: 30 };
    const k = Math.min((W - m.i - 10) / anchoM, (H - m.b - 8) / altoM);
    const sx = (x) => m.i + (x + 0.8) * k, sy = (y) => H - m.b - y * k;
    escala = { sx, sy, k };

    lienzo.innerHTML = "";
    const svg = Fis.svg("svg", { width: W, height: H, role: "img",
      "aria-label": `Trayectoria del salto: altura máxima ${Fis.n(h)} metros, ${Fis.n(T)} segundos en el aire` }, lienzo);
    // Rejilla en metros
    const paso = k > 26 ? 1 : k > 12 ? 2 : k > 5 ? 5 : 10;
    for (let y = paso; sy(y) > 6; y += paso) {
      Fis.svg("line", { class: "rejilla", x1: m.i, x2: W, y1: sy(y), y2: sy(y) }, svg);
      Fis.svg("text", { x: m.i - 6, y: sy(y) + 4, "text-anchor": "end" }, svg).textContent = y + " m";
    }
    for (let x = 0; sx(x) < W - 16; x += paso) {
      Fis.svg("text", { x: sx(x), y: H - m.b + 16, "text-anchor": "middle" }, svg).textContent = x;
    }
    Fis.svg("text", { x: W - 4, y: H - 2, "text-anchor": "end" }, svg).textContent = "distancia (m)";
    Fis.svg("line", { class: "suelo", x1: 0, x2: W, y1: sy(0), y2: sy(0) }, svg);

    // Trayectoria de comparación con la gravedad real
    if (comparar) {
      let pts = "";
      for (let i = 0; i <= 60; i++) { const p = posicion(v0, G_TIERRA, (TT * i) / 60); pts += sx(p.x).toFixed(1) + "," + sy(p.y).toFixed(1) + " "; }
      Fis.svg("polyline", { class: "fantasma", points: pts }, svg);
      const c = posicion(v0, G_TIERRA, TT / 2);
      Fis.svg("text", { class: "etq", x: sx(c.x), y: sy(c.y) - 8, "text-anchor": "middle" }, svg).textContent = "g = 9,81";
    }
    // Trayectoria del juego: un punto cada 0,05 s (puntos juntos = movimiento lento)
    for (let t = 0; t <= T + 1e-9; t += 0.05) {
      const p = posicion(v0, g, t);
      Fis.svg("circle", { class: "punto", cx: sx(p.x), cy: sy(p.y), r: 3 }, svg);
    }
    const c = posicion(v0, g, T / 2);
    if (!comparar || Math.abs(sy(c.y) - sy(hT)) > 22) {
      Fis.svg("text", { class: "etq", x: sx(c.x), y: sy(c.y) - 10, "text-anchor": "middle" }, svg).textContent = "g del juego";
    }
    // Personaje: bloque de 1 m de alto
    personaje = Fis.svg("g", {}, svg);
    Fis.svg("rect", { class: "personaje", x: -0.35 * k, y: -k, width: 0.7 * k, height: k, rx: 0.12 * k }, personaje);
    Fis.svg("circle", { class: "ojo", cx: 0.02 * k, cy: -0.68 * k, r: 0.07 * k }, personaje);
    Fis.svg("circle", { class: "ojo", cx: 0.22 * k, cy: -0.68 * k, r: 0.07 * k }, personaje);
    colocar(0, 0);
  }

  function colocar(x, y) {
    personaje.setAttribute("transform", `translate(${escala.sx(x)},${escala.sy(y)})`);
  }

  // Anima el salto en tiempo real: lo que dura en pantalla es el tiempo en el aire calculado
  function saltar() {
    cancelAnimationFrame(animacion);
    const v0 = +cImpulso.value, g = +cGravedad.value, T = tiempoAire(v0, g);
    const inicio = performance.now();
    (function cuadro(ahora) {
      const t = Math.min((ahora - inicio) / 1000, T);
      const p = posicion(v0, g, t);
      colocar(p.x, Math.max(0, p.y));
      if (t < T) animacion = requestAnimationFrame(cuadro);
    })(inicio);
  }

  // Diseño "al revés": se escoge la altura h y el tiempo de subida ts, y de ahí salen g y v0
  //   g = 2h / ts²      v0 = 2h / ts
  function preajuste(h, ts) {
    cGravedad.value = (2 * h) / (ts * ts);
    cImpulso.value = (2 * h) / ts;
    dibujar();
    saltar();
  }

  cImpulso.addEventListener("input", dibujar);
  cGravedad.addEventListener("input", dibujar);
  cComparar.addEventListener("change", dibujar);
  el("sim-saltar").addEventListener("click", saltar);
  el("sim-pre-tierra").addEventListener("click", () => { cGravedad.value = G_TIERRA; dibujar(); saltar(); });
  el("sim-pre-juego").addEventListener("click", () => preajuste(2, 0.35));
  let espera;
  window.addEventListener("resize", () => { clearTimeout(espera); espera = setTimeout(dibujar, 150); });
  dibujar();
})();
