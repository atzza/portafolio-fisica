// Tema 10: animación con un resorte amortiguado, como la de SwiftUI o Framer Motion.
//   m·x″ + c·x′ + k·x = 0, con x = distancia que le falta a la tarjeta para llegar a la meta.
// Se integra paso a paso (Euler semiimplícito, 600 pasos por segundo), igual que un motor de animación.
(function () {
  const M = 1;                         // masa, como en Framer Motion y en los ejemplos de Apple
  const DT = 1 / 600;                  // s, paso de integración
  const VENTANA = 2.5;                 // s que se ven en la gráfica
  const el = (id) => document.getElementById(id);
  const cK = el("muelle-k"), cC = el("muelle-c");
  const reducir = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const zeta = (k, c) => c / (2 * Math.sqrt(k * M));
  const cPara = (k, z) => 2 * z * Math.sqrt(k * M);

  // Integra desde x = 1 (lejos de la meta) en reposo; devuelve [t, x] cada 1/120 s
  function curva(k, c, tMax) {
    const pts = [];
    let x = 1, v = 0;
    for (let i = 0, n = Math.round(tMax / DT); i <= n; i++) {
      if (i % 5 === 0) pts.push([i * DT, x]);
      const a = (-k * x - c * v) / M;
      v += a * DT;
      x += v * DT;
    }
    return pts;
  }
  // Rebase y tiempo en que queda dentro del 2 % para siempre (se mira hasta 20 s)
  function medidas(k, c) {
    const pts = curva(k, c, 20);
    let rebase = 0, asienta = 0;
    for (const [t, x] of pts) {
      if (x < 0) rebase = Math.max(rebase, -x);
      if (Math.abs(x) > 0.02) asienta = t;
    }
    return { rebase, asienta: asienta >= 19.9 ? Infinity : asienta };
  }

  let sx, tarjeta, resorte, marcador, sxG, syG, anim = 0;
  let pos = 0, vel = 0, destino = 0, previo = null, acumulado = 0, tAnim = 0;

  function dibujarEscena() {
    const caja = el("muelle-escena");
    caja.innerHTML = "";
    const W = caja.clientWidth, H = 130;
    const ancho = Math.min(90, W * 0.2);
    sx = (u) => 24 + u * (W - 48 - ancho);       // u = 0 a la izquierda, 1 a la derecha
    const svg = Fis.svg("svg", { width: W, height: H, role: "img", "aria-label": caja.dataset.titulo }, caja);
    Fis.svg("line", { class: "riel", x1: 12, x2: W - 12, y1: 100, y2: 100 }, svg);
    [0, 1].forEach((u) => {
      Fis.svg("line", { class: "meta", x1: sx(u) + ancho / 2, x2: sx(u) + ancho / 2, y1: 12, y2: 112 }, svg);
      Fis.svg("text", { x: sx(u) + ancho / 2, y: 126, "text-anchor": "middle" }, svg).textContent = u ? "meta B" : "meta A";
    });
    resorte = Fis.svg("polyline", { class: "resorte" }, svg);
    tarjeta = Fis.svg("rect", { class: "tarjeta", y: 34, width: ancho, height: 56, rx: 10 }, svg);
    tarjeta.dataset.ancho = ancho;
    colocar();
  }
  function colocar() {
    const ancho = +tarjeta.dataset.ancho, x = sx(pos);
    tarjeta.setAttribute("x", x);
    // El resorte va de la meta actual al centro de la tarjeta: se estira y se comprime con x
    const xMeta = sx(destino) + ancho / 2, xT = x + ancho / 2, n = 14;
    let p = "";
    for (let i = 0; i <= n; i++) {
      const xi = xMeta + ((xT - xMeta) * i) / n;
      const yi = 20 + (i === 0 || i === n ? 0 : i % 2 ? -7 : 7);
      p += `${xi.toFixed(1)},${yi} `;
    }
    resorte.setAttribute("points", p);
  }

  function dibujarGrafica() {
    const k = +cK.value, c = +cC.value;
    const caja = el("muelle-grafica");
    caja.innerHTML = "";
    const W = caja.clientWidth, H = 260, m = { i: 46, d: 12, s: 14, b: 40 };
    sxG = (t) => m.i + (t / VENTANA) * (W - m.i - m.d);
    const sy = (r) => H - m.b - ((r + 0.5) / 2.2) * (H - m.s - m.b);     // r = fracción del recorrido hecha, de −50 % a 170 %
    const svg = Fis.svg("svg", { width: W, height: H, role: "img", "aria-label": caja.dataset.titulo }, caja);
    for (let r = -0.5; r <= 1.71; r += 0.5) {
      Fis.svg("line", { class: Math.abs(r) < 1e-9 || Math.abs(r - 1) < 1e-9 ? "eje" : "rejilla", x1: m.i, x2: W - m.d, y1: sy(r), y2: sy(r) }, svg);
      Fis.svg("text", { x: m.i - 6, y: sy(r) + 4, "text-anchor": "end" }, svg).textContent = Fis.n(r * 100, 0) + " %";
    }
    for (let t = 0; t <= VENTANA + 1e-9; t += 0.5) {
      Fis.svg("text", { x: sxG(t), y: H - m.b + 16, "text-anchor": "middle" }, svg).textContent = Fis.n(t, 1);
    }
    Fis.svg("text", { x: (m.i + W - m.d) / 2, y: H - 4, "text-anchor": "middle" }, svg).textContent = "Tiempo t (s)";
    Fis.svg("text", { x: m.i + 4, y: sy(1) - 6 }, svg).textContent = "meta (100 % del recorrido)";
    const linea = (pts, cls, extra = {}) => Fis.svg("polyline", {
      class: cls, points: pts.map(([t, x]) => `${sxG(t).toFixed(1)},${sy(1 - x).toFixed(1)}`).join(" "), ...extra,
    }, svg);
    [0.2, 1, 2.5].forEach((z) => linea(curva(k, cPara(k, z), VENTANA), "linea s2", { "stroke-width": 1.2, "stroke-dasharray": "4 4", opacity: 0.8 }));
    linea(curva(k, c, VENTANA), "linea s1", { "stroke-width": 2.5 });
    marcador = Fis.svg("circle", { r: 5, class: "f1 anillo", cx: -20, cy: -20 }, svg);
    syG = sy;
  }

  function actualizarTextos() {
    const k = +cK.value, c = +cC.value, z = zeta(k, c), w0 = Math.sqrt(k / M);
    el("muelle-k-valor").textContent = Fis.n(k, 0) + " N/m";
    el("muelle-c-valor").textContent = Fis.n(c, 1) + " N·s/m";
    el("muelle-zeta").textContent = Fis.n(z, 2);
    el("muelle-regimen").textContent = Math.abs(z - 1) < 0.02 ? "Crítico" : z < 1 ? "Subamortiguado" : "Sobreamortiguado";
    const r = medidas(k, c);
    el("muelle-rebase").textContent = r.rebase > 0.001 ? Fis.n(r.rebase * 100, 1) + " %" : "No";
    el("muelle-asienta").textContent = isFinite(r.asienta) ? Fis.n(r.asienta, 2) + " s" : "Nunca";
    const bounce = Math.max(0, 1 - z);
    el("muelle-estado").textContent =
      `ω₀ = √(k/m) = ${Fis.n(w0, 2)} rad/s · ζ = c / (2·√(k·m)) = ${Fis.n(z, 2)}` +
      ` · en Apple sería duración ${Fis.n((2 * Math.PI) / w0, 2)} s y rebote ${Fis.n(bounce, 2)}`;
  }

  // La tarjeta salta de meta: el resorte pasa a jalar hacia la otra
  function animar() {
    cancelAnimationFrame(anim);
    destino = destino === 1 ? 0 : 1;
    tAnim = 0; acumulado = 0; previo = null;
    if (reducir) { pos = destino; vel = 0; colocar(); return; }
    anim = requestAnimationFrame(cuadro);
  }
  function cuadro(ahora) {
    const k = +cK.value, c = +cC.value;
    if (previo !== null) {
      acumulado += Math.min(0.05, (ahora - previo) / 1000);
      while (acumulado >= DT) {
        const x = pos - destino;                   // distancia a la meta
        const a = (-k * x - c * vel) / M;
        vel += a * DT;
        pos += vel * DT;
        tAnim += DT;
        acumulado -= DT;
      }
      colocar();
      const hecho = destino === 1 ? pos : 1 - pos; // fracción del recorrido, para el marcador de la gráfica
      if (tAnim <= VENTANA) { marcador.setAttribute("cx", sxG(tAnim)); marcador.setAttribute("cy", syG(hecho)); }
    }
    previo = ahora;
    const quieta = Math.abs(pos - destino) < 0.001 && Math.abs(vel) < 0.01;
    if (quieta || tAnim > 20) { pos = destino; vel = 0; colocar(); return; }
    anim = requestAnimationFrame(cuadro);
  }

  function preajuste(tipo) {
    const k = +cK.value;
    if (tipo === "sub") cC.value = cPara(k, 0.2).toFixed(1);
    if (tipo === "crit") cC.value = cPara(k, 1).toFixed(1);
    if (tipo === "sobre") cC.value = Math.min(60, cPara(k, 2.5)).toFixed(1);
    if (tipo === "framer") { cK.value = 100; cC.value = 10; }
    if (tipo === "apple") { cK.value = 157.9; cC.value = 17.6; }   // Spring(duration: 0.5, bounce: 0.3)
    todo();
    animar();
  }

  function todo() { actualizarTextos(); dibujarGrafica(); }
  cK.addEventListener("input", todo);
  cC.addEventListener("input", todo);
  cK.addEventListener("change", animar);
  cC.addEventListener("change", animar);
  el("muelle-animar").addEventListener("click", animar);
  document.querySelectorAll("[data-muelle]").forEach((b) => b.addEventListener("click", () => preajuste(b.dataset.muelle)));
  let ancho = innerWidth, espera;
  addEventListener("resize", () => {
    if (innerWidth === ancho) return;
    ancho = innerWidth;
    clearTimeout(espera);
    espera = setTimeout(() => { dibujarEscena(); dibujarGrafica(); }, 150);
  });
  dibujarEscena();
  todo();
})();
