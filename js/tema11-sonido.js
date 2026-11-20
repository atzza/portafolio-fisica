// Tema 11: forma de onda y contenido armónico de las dos muestras de audio.
// Se usan los mismos coeficientes que herramientas/generar_audio.py:
//   y(t) = Σ b_n·sen(2π·n·f₀·t), con f₀ = 220 Hz
//   muestra 1: b_n = 1/n solo para n impar · muestra 2: b_n = 1/n para todo n
(function () {
  const F0 = 220, NMAX = 20;
  const MUESTRAS = [
    { b: (n) => (n % 2 ? 1 / n : 0), cls: "s1", fill: "f1" },
    { b: (n) => 1 / n, cls: "s2", fill: "f2" },
  ];
  const el = (id) => document.getElementById(id);
  const cN = el("sonido-n");

  function onda() {
    const N = +cN.value;
    const caja = el("sonido-onda");
    caja.innerHTML = "";
    const W = caja.clientWidth, H = 240, m = { i: 40, d: 12, s: 14, b: 40 };
    const T = 1000 / F0;                                   // período en ms
    const sx = (t) => m.i + (t / (2 * T)) * (W - m.i - m.d);
    const sy = (y) => m.s + ((1.9 - y) / 3.8) * (H - m.s - m.b);
    const svg = Fis.svg("svg", { width: W, height: H, role: "img", "aria-label": caja.dataset.titulo }, caja);
    [-1.5, 0, 1.5].forEach((y) => {
      Fis.svg("line", { class: y ? "rejilla" : "eje", x1: m.i, x2: W - m.d, y1: sy(y), y2: sy(y) }, svg);
      Fis.svg("text", { x: m.i - 6, y: sy(y) + 4, "text-anchor": "end" }, svg).textContent = Fis.n(y, 1);
    });
    [0, T, 2 * T].forEach((t) => {
      Fis.svg("line", { class: "rejilla", x1: sx(t), x2: sx(t), y1: m.s, y2: H - m.b }, svg);
      Fis.svg("text", { x: sx(t), y: H - m.b + 16, "text-anchor": "middle" }, svg).textContent = Fis.n(t, 2);
    });
    Fis.svg("text", { x: (m.i + W - m.d) / 2, y: H - 4, "text-anchor": "middle" }, svg).textContent = "Tiempo t (ms) · un período = 4,55 ms";
    Fis.svg("text", { x: m.i, y: 10 }, svg).textContent = "Amplitud (relativa)";
    MUESTRAS.forEach((mu) => {
      let pts = "";
      for (let i = 0; i <= 600; i++) {
        const t = (2 * T * i) / 600, ts = t / 1000;
        let y = 0;
        for (let n = 1; n <= N; n++) y += mu.b(n) * Math.sin(2 * Math.PI * n * F0 * ts);
        pts += `${sx(t).toFixed(1)},${sy(y).toFixed(1)} `;
      }
      Fis.svg("polyline", { class: "linea " + mu.cls, points: pts }, svg);
    });
  }

  function espectro() {
    const N = +cN.value;
    const caja = el("sonido-espectro");
    caja.innerHTML = "";
    const W = caja.clientWidth, H = 240, m = { i: 40, d: 12, s: 14, b: 40 };
    const ancho = (W - m.i - m.d) / NMAX;
    const sx = (n) => m.i + (n - 0.5) * ancho;            // centro de la barra del armónico n
    const sy = (a) => H - m.b - a * (H - m.s - m.b);
    const svg = Fis.svg("svg", { width: W, height: H, role: "img", "aria-label": caja.dataset.titulo }, caja);
    [0, 0.5, 1].forEach((a) => {
      Fis.svg("line", { class: a ? "rejilla" : "eje", x1: m.i, x2: W - m.d, y1: sy(a), y2: sy(a) }, svg);
      Fis.svg("text", { x: m.i - 6, y: sy(a) + 4, "text-anchor": "end" }, svg).textContent = Fis.n(a, 1);
    });
    for (let n = 1; n <= NMAX; n++) {
      if (n === 1 || n % 4 === 0) {
        Fis.svg("text", { x: sx(n), y: H - m.b + 16, "text-anchor": "middle" }, svg).textContent = n * F0;
      }
      MUESTRAS.forEach((mu, i) => {
        const a = n <= N ? mu.b(n) : 0;
        if (!a) return;
        const w = Math.max(2, ancho * 0.36);
        const x = sx(n) + (i ? 1 : -1) * (w / 2 + 1) - w / 2;
        const r = Fis.svg("rect", { class: mu.fill, x, y: sy(a), width: w, height: sy(0) - sy(a), rx: Math.min(2, w / 2) }, svg);
        Fis.svg("title", {}, r).textContent = `Muestra ${i + 1}, armónico ${n} (${n * F0} Hz): amplitud ${Fis.n(a, 3)}`;
      });
    }
    Fis.svg("text", { x: (m.i + W - m.d) / 2, y: H - 4, "text-anchor": "middle" }, svg).textContent = "Frecuencia del armónico (Hz)";
    Fis.svg("text", { x: m.i, y: 10 }, svg).textContent = "Amplitud b_n";
  }

  function todo() {
    const N = +cN.value;
    el("sonido-n-valor").textContent = N === 1 ? "1 (solo la fundamental)" : `${N} (hasta ${N * F0} Hz)`;
    onda();
    espectro();
  }
  cN.addEventListener("input", todo);
  let ancho = innerWidth, espera;
  addEventListener("resize", () => {
    if (innerWidth === ancho) return;
    ancho = innerWidth;
    clearTimeout(espera);
    espera = setTimeout(todo, 150);
  });
  todo();
})();
