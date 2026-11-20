// Tema 12: factor de amplificación de una oscilación forzada amortiguada.
//   A / (F₀/k) = 1 / √((1 − r²)² + (2·ζ·r)²), con r = f / f₀
(function () {
  const ZETAS = [{ z: 0.02, cls: "s1" }, { z: 0.1, cls: "s2" }, { z: 0.3, cls: "s3" }];
  const RMAX = 2.5, AMAX = 27;
  const factor = (r, z) => 1 / Math.sqrt((1 - r * r) ** 2 + (2 * z * r) ** 2);
  const el = (id) => document.getElementById(id);

  function dibujar() {
    const caja = el("resonancia-grafica");
    caja.innerHTML = "";
    const W = caja.clientWidth, H = 280, m = { i: 40, d: 12, s: 16, b: 40 };
    const sx = (r) => m.i + (r / RMAX) * (W - m.i - m.d);
    const sy = (a) => H - m.b - (Math.min(a, AMAX) / AMAX) * (H - m.s - m.b);
    const svg = Fis.svg("svg", { width: W, height: H, role: "img", "aria-label": caja.dataset.titulo }, caja);
    for (let a = 0; a <= 25; a += 5) {
      Fis.svg("line", { class: a ? "rejilla" : "eje", x1: m.i, x2: W - m.d, y1: sy(a), y2: sy(a) }, svg);
      Fis.svg("text", { x: m.i - 6, y: sy(a) + 4, "text-anchor": "end" }, svg).textContent = a;
    }
    for (let r = 0; r <= RMAX + 1e-9; r += 0.5) {
      Fis.svg("text", { x: sx(r), y: H - m.b + 16, "text-anchor": "middle" }, svg).textContent = Fis.n(r, 1);
    }
    Fis.svg("line", { class: "cursor", x1: sx(1), x2: sx(1), y1: m.s, y2: H - m.b }, svg);
    Fis.svg("text", { class: "etq", x: sx(1) + 6, y: m.s + 10 }, svg).textContent = "f = f₀ (resonancia)";
    Fis.svg("text", { x: (m.i + W - m.d) / 2, y: H - 4, "text-anchor": "middle" }, svg).textContent = "Razón de frecuencias r = f / f₀";
    Fis.svg("text", { x: m.i, y: 10 }, svg).textContent = "A / (F₀/k)";
    ZETAS.forEach(({ z, cls }) => {
      let pts = "";
      for (let i = 0; i <= 800; i++) {
        const r = (RMAX * i) / 800;
        pts += `${sx(r).toFixed(1)},${sy(factor(r, z)).toFixed(1)} `;
      }
      Fis.svg("polyline", { class: "linea " + cls, points: pts }, svg);
    });
    const cursor = Fis.svg("line", { class: "cursor", y1: m.s, y2: H - m.b, x1: -10, x2: -10 }, svg);
    const zona = Fis.svg("rect", { x: m.i, y: 0, width: W - m.i - m.d, height: H, fill: "transparent" }, svg);
    const leer = (ev) => {
      const b = svg.getBoundingClientRect();
      const r = Math.max(0, Math.min(RMAX, ((ev.clientX - b.left - m.i) / (W - m.i - m.d)) * RMAX));
      cursor.setAttribute("x1", sx(r)); cursor.setAttribute("x2", sx(r));
      el("resonancia-lectura").innerHTML = `<span>r = ${Fis.n(r, 2)}</span>` +
        ZETAS.map(({ z }) => `<span>ζ = ${Fis.n(z, 2)}: ${Fis.n(factor(r, z), 2)} veces</span>`).join("");
    };
    zona.addEventListener("pointermove", leer);
    zona.addEventListener("pointerdown", leer);
  }
  el("resonancia-lectura").innerHTML = "<span>r = 1,00</span>" +
    ZETAS.map(({ z }) => `<span>ζ = ${Fis.n(z, 2)}: ${Fis.n(factor(1, z), 2)} veces</span>`).join("");
  let ancho = innerWidth, espera;
  addEventListener("resize", () => {
    if (innerWidth === ancho) return;
    ancho = innerWidth;
    clearTimeout(espera);
    espera = setTimeout(dibujar, 150);
  });
  dibujar();
})();
