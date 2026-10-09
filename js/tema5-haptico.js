// Tema 5: curva de fuerza contra desplazamiento de un gatillo con "resorte virtual".
// Los valores son ilustrativos (los escogí yo); no son datos medidos del control.
(function () {
  const K_RETORNO = 0.15; // N/mm, resorte mecánico de retorno del gatillo
  const K_VIRTUAL = 1.0;  // N/mm, rigidez del resorte que simula el motor
  const X0 = 2;           // mm, punto donde el juego activa la resistencia
  const F_MAX = 5;        // N, fuerza máxima que puede dar el motor
  const X_MAX = 8;        // mm, recorrido total del gatillo

  function fuerza(x) {
    const f = K_RETORNO * x + (x > X0 ? K_VIRTUAL * (x - X0) : 0);
    return Math.min(f, F_MAX);
  }
  const X_TOPE = (F_MAX + K_VIRTUAL * X0) / (K_RETORNO + K_VIRTUAL); // donde se alcanza F_MAX

  function dibujar() {
    const caja = document.getElementById("graf-resorte");
    caja.innerHTML = "";
    const W = caja.clientWidth, H = 300, m = { i: 44, d: 18, s: 30, b: 44 };
    const sx = (v) => m.i + (v / X_MAX) * (W - m.i - m.d), sy = (v) => H - m.b - (v / 8) * (H - m.s - m.b);
    const svg = Fis.svg("svg", { width: W, height: H, role: "img", "aria-label": caja.dataset.titulo }, caja);
    for (let v = 0; v <= 8; v += 2) {
      Fis.svg("line", { class: v ? "rejilla" : "eje", x1: m.i, x2: W - m.d, y1: sy(v), y2: sy(v) }, svg);
      Fis.svg("text", { x: m.i - 8, y: sy(v) + 4, "text-anchor": "end" }, svg).textContent = v;
      Fis.svg("text", { x: sx(v), y: H - m.b + 16, "text-anchor": "middle" }, svg).textContent = v;
    }
    Fis.svg("text", { x: (m.i + W - m.d) / 2, y: H - 6, "text-anchor": "middle" }, svg).textContent = "Desplazamiento del gatillo x (mm)";
    // Límites de las tres zonas
    [X0, X_TOPE].forEach((x) => Fis.svg("line", { class: "cursor", x1: sx(x), x2: sx(x), y1: m.s - 8, y2: sy(0) }, svg));
    const zonas = [["Libre", X0 / 2], ["Resorte virtual", (X0 + X_TOPE) / 2], ["Límite del motor", (X_TOPE + X_MAX) / 2]];
    zonas.forEach(([t, x]) => Fis.svg("text", { class: "etq", x: sx(x), y: m.s - 14, "text-anchor": "middle" }, svg).textContent = t);
    // Resorte ideal (ley de Hooke sin límite)
    Fis.svg("line", { class: "linea s2", "stroke-dasharray": "6 5", x1: sx(X_TOPE), y1: sy(F_MAX), x2: sx(X_MAX), y2: sy(K_RETORNO * X_MAX + K_VIRTUAL * (X_MAX - X0)) }, svg);
    // Fuerza que entrega el gatillo
    let pts = "";
    for (let x = 0; x <= X_MAX + 1e-9; x += 0.05) pts += sx(x).toFixed(1) + "," + sy(fuerza(x)).toFixed(1) + " ";
    Fis.svg("polyline", { class: "linea s1", points: pts }, svg);
    Fis.svg("text", { class: "etq", x: sx(4.1) - 10, y: sy(fuerza(4.1)) - 10, "text-anchor": "end" }, svg).textContent = "F = kᵣ·x + k·(x − x₀)";
  }
  dibujar();
  let espera;
  window.addEventListener("resize", () => { clearTimeout(espera); espera = setTimeout(dibujar, 150); });
})();
